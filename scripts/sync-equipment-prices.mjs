import readExcelFile from "read-excel-file/node";
import { createClient } from "@supabase/supabase-js";
import path from "node:path";

const file = process.argv.find((value, index) => process.argv[index - 1] === "--file");
const apply = process.argv.includes("--apply");
if (!file || !/^PQ PL for dealers_\d{8}\.xlsx$/i.test(path.basename(file))) {
  throw new Error("Укажите --file 'PQ PL for dealers_YYYYMMDD.xlsx'; для применения добавьте --apply");
}
const normalize = (v) => String(v ?? "").trim().toLowerCase().replace(/ё/g, "е").replace(/[^a-zа-я0-9#]+/g, " ").trim();
const sheets = await readExcelFile(file);
function prices(sheetName, kind) {
  const sheet = sheets.find((s) => s.sheet === sheetName);
  if (!sheet) throw new Error(`Нет листа ${sheetName}`);
  const headers = sheet.data[0].map(normalize);
  function index(...names) {
    const i = names.map(normalize).map((name) => headers.indexOf(name)).find((i) => i >= 0);
    if (i == null) throw new Error(`${sheetName}: нет колонки ${names[0]}`);
    return i;
  }
  const id = index(kind === "inventory" ? "ID#" : "ID");
  const model = index("Модель");
  const currency = index(kind === "inventory" ? "Валюта договора" : "Валюта");
  const price = kind === "inventory" ? index("Price with VAT") : index("Цена дилера, с НДС. (см примечание)", "Цена дилера с НДС");
  const serial = kind === "inventory" ? index("Serial number") : -1;
  const status = kind === "spot" ? index("Статус") : -1;
  const seen = new Set();
  const rows = [];
  for (const [offset, row] of sheet.data.slice(1).entries()) {
    if (!row.some((v) => v != null && String(v).trim())) continue;
    if (kind === "spot" && !normalize(row[status]).includes("налич")) continue;
    const externalId = String(row[id] ?? "").trim();
    const amount = typeof row[price] === "number" ? row[price] : Number(String(row[price] ?? "").replace(/\s/g, "").replace(",", "."));
    const curr = String(row[currency] ?? "").trim().toUpperCase();
    const name = String(row[model] ?? "").trim();
    const serialNumber = serial >= 0 ? String(row[serial] ?? "").trim() : null;
    if (!externalId || !name || !/^[A-Z]{3}$/.test(curr) || row[price] == null || row[price] === "" || !Number.isFinite(amount) || amount < 0 || (serial >= 0 && !serialNumber)) {
      throw new Error(`${sheetName}, строка ${offset + 2}: некорректные ID, цена, валюта или идентификация`);
    }
    if (seen.has(externalId)) throw new Error(`${sheetName}: повтор ID ${externalId}`);
    seen.add(externalId);
    rows.push({ external_id: externalId, model: name, serial_number: serialNumber, price_with_vat: Math.round(amount), contract_currency: curr });
  }
  if (!rows.length) throw new Error(`${sheetName}: пустой прайс`);
  return rows;
}
const inventory = prices("Append1", "inventory");
const spot = prices("CNH_Spot_Предложение", "spot");
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) throw new Error("Нужны серверные параметры Supabase");
const client = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
let differences = 0;
for (const [table, incoming] of [["inventory", inventory], ["cnhi_spot", spot]]) {
  const fields = table === "inventory"
    ? "external_id,model,serial_number,price_with_vat,contract_currency"
    : "external_id,model,price_with_vat,contract_currency";
  const { data, error } = await client.from(table).select(fields).eq("is_active", true);
  if (error) throw new Error(`Ошибка чтения ${table}: ${error.code}`);
  const map = new Map(incoming.map((r) => [r.external_id, r]));
  const ids = new Set();
  for (const row of data) {
    const p = map.get(row.external_id);
    if (ids.has(row.external_id) || !p || p.model !== row.model || (table === "inventory" && p.serial_number !== row.serial_number)) {
      throw new Error(`${table}: прайс не соответствует активной позиции ${row.external_id}`);
    }
    ids.add(row.external_id);
    if (p.price_with_vat !== row.price_with_vat || p.contract_currency !== row.contract_currency) differences++;
  }
  console.log(`${table}: ${data.length} позиций проверено`);
}
console.log(`Изменений цен/валют: ${differences}; SPOT без цены в источнике: ${spot.filter((r) => r.price_with_vat === 0).length}`);
if (apply) {
  const { data, error } = await client.rpc("apply_equipment_price_sync", { p_inventory: inventory, p_spot: spot, p_source_file: path.basename(file) });
  if (error) throw new Error(`Цены не применены: ${error.message}`);
  console.log(JSON.stringify(data));
}
