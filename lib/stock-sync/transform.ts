import type {
  BrandResolver,
  CellValue,
  InventoryImportRow,
  SpotImportRow,
  TransformIssue,
  TransformResult,
  WorkbookSheet,
} from "./types";

function text(value: CellValue | undefined) {
  if (value == null) return "";
  return String(value).trim();
}

function normalize(value: CellValue | undefined) {
  return text(value)
    .toLocaleLowerCase("ru")
    .replace(/ё/g, "е")
    .replace(/[^a-zа-я0-9#]+/g, " ")
    .trim();
}

function headerIndex(row: CellValue[]) {
  const result = new Map<string, number>();
  row.forEach((value, index) => result.set(normalize(value), index));
  return result;
}

function column(headers: Map<string, number>, aliases: string[]) {
  for (const alias of aliases) {
    const index = headers.get(normalize(alias));
    if (index != null) return index;
  }
  return -1;
}

function value(row: CellValue[], index: number) {
  return index < 0 ? null : (row[index] ?? null);
}

function numberValue(input: CellValue | undefined): number | null {
  if (typeof input === "number" && Number.isFinite(input)) return input;
  const normalized = text(input)
    .replace(/\s/g, "")
    .replace(",", ".")
    .replace(/[^0-9.-]/g, "");
  if (!normalized) return null;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function integerValue(input: CellValue | undefined): number | null {
  const parsed = numberValue(input);
  return parsed == null ? null : Math.trunc(parsed);
}

function dateValue(input: CellValue | undefined): string | null {
  if (input instanceof Date && !Number.isNaN(input.getTime())) {
    return input.toISOString().slice(0, 10);
  }

  const raw = text(input);
  if (!raw) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;

  const match = raw.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{4})$/);
  if (!match) return null;
  const [, day, month, year] = match;
  return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
}

function optionalText(input: CellValue | undefined) {
  const result = text(input);
  return result || null;
}

function inventoryStatus(input: CellValue | undefined) {
  const status = normalize(input);
  if (status.includes("склад")) return "in_stock" as const;
  if (status.includes("транзит") || status.includes("пути")) {
    return "in_transit" as const;
  }
  if (
    status.includes("производ") ||
    status.includes("готов") ||
    status.includes("заказ")
  ) {
    return "in_production" as const;
  }
  return null;
}

function statusPriority(status: InventoryImportRow["status"]) {
  if (status === "in_stock") return 1;
  if (status === "in_transit") return 2;
  return 3;
}

function findSheet(sheets: WorkbookSheet[], names: string[]) {
  const normalizedNames = names.map(normalize);
  return sheets.find((sheet) => normalizedNames.includes(normalize(sheet.sheet)));
}

function duplicateIssues(
  rows: Array<{ key: string; row: number }>,
  sheet: string,
  label: string
) {
  const seen = new Map<string, number>();
  const issues: TransformIssue[] = [];
  for (const item of rows) {
    const first = seen.get(item.key);
    if (first != null) {
      issues.push({
        sheet,
        row: item.row,
        message: `${label} повторяется; первая строка: ${first}`,
      });
    } else {
      seen.set(item.key, item.row);
    }
  }
  return issues;
}

function transformInventory(
  sheet: WorkbookSheet,
  _resolver: BrandResolver,
  issues: TransformIssue[]
) {
  const [header = [], ...data] = sheet.data;
  const headers = headerIndex(header);
  const columns = {
    model: column(headers, ["Модель", "model"]),
    configuration: column(headers, ["Конфигурация", "configuration"]),
    externalId: column(headers, ["ID#", "ID", "external_id"]),
    serial: column(headers, ["Serial number", "serial_number"]),
    year: column(headers, ["Год производства", "production_year"]),
    arrival: column(headers, ["Срок поступления на склад Орел", "arrival_date"]),
    status: column(headers, ["Статус техники", "status"]),
    currency: column(headers, ["Валюта договора", "contract_currency"]),
    price: column(headers, ["Price with VAT", "price_with_vat"]),
    specification: column(headers, ["CNH_Spot_спецификация", "specification"]),
    warranty: column(headers, ["Гарантия", "warranty"]),
  };

  const requiredColumns = {
    model: columns.model,
    configuration: columns.configuration,
    externalId: columns.externalId,
    serial: columns.serial,
    year: columns.year,
    arrival: columns.arrival,
    status: columns.status,
    specification: columns.specification,
    warranty: columns.warranty,
  };

  for (const [name, index] of Object.entries(requiredColumns)) {
    if (index < 0) issues.push({ sheet: sheet.sheet, row: 1, message: `Нет колонки ${name}` });
  }
  if (Object.values(requiredColumns).some((index) => index < 0)) return [];

  const result: InventoryImportRow[] = [];
  const keys: Array<{ key: string; row: number }> = [];

  data.forEach((row, offset) => {
    const rowNumber = offset + 2;
    if (!row.some((cell) => text(cell))) return;
    const model = text(value(row, columns.model));
    const serial = text(value(row, columns.serial));
    const externalId = text(value(row, columns.externalId));
    const status = inventoryStatus(value(row, columns.status));
    const brand = "CNH";

    if (!model) issues.push({ sheet: sheet.sheet, row: rowNumber, message: "Не указана модель" });
    if (!serial) issues.push({ sheet: sheet.sheet, row: rowNumber, message: "Не указан Serial number" });
    if (!externalId) issues.push({ sheet: sheet.sheet, row: rowNumber, message: "Не указан ID#" });
    if (!status) issues.push({ sheet: sheet.sheet, row: rowNumber, message: "Неизвестный статус техники" });
    if (!model || !serial || !externalId || !status) return;

    keys.push({ key: serial, row: rowNumber });
    result.push({
      brand,
      model,
      configuration: optionalText(value(row, columns.configuration)),
      external_id: externalId,
      serial_number: serial,
      production_year: integerValue(value(row, columns.year)),
      arrival_date: dateValue(value(row, columns.arrival)),
      location: "Orel",
      status,
      status_priority: statusPriority(status),
      contract_currency: optionalText(value(row, columns.currency)),
      price_with_vat: (() => {
        const price = numberValue(value(row, columns.price));
        return price == null ? null : Math.round(price);
      })(),
      specification: optionalText(value(row, columns.specification)),
      warranty: optionalText(value(row, columns.warranty)),
    });
  });

  issues.push(...duplicateIssues(keys, sheet.sheet, "Serial number"));
  return result;
}

function transformSpot(
  sheet: WorkbookSheet,
  vatMultiplier: number,
  issues: TransformIssue[]
) {
  const [header = [], ...data] = sheet.data;
  const headers = headerIndex(header);
  const columns = {
    externalId: column(headers, ["ID", "external_id"]),
    brand: column(headers, ["Бренд", "brand"]),
    type: column(headers, ["Тип техники", "type"]),
    model: column(headers, ["Модель", "model"]),
    year: column(headers, ["Year", "production_year"]),
    status: column(headers, ["Статус", "status"]),
    currency: column(headers, ["Валюта", "contract_currency"]),
    price: column(headers, ["Цена дилера, без НДС.", "Цена дилера без НДС", "price_without_vat"]),
    deliveryTerms: column(headers, ["Условия отгрузки_1", "delivery_terms"]),
    delivery: column(headers, ["Срок поставки до склада Орёл", "delivery"]),
    specification: column(headers, ["Ссылка на спецификацию", "specification"]),
  };

  const requiredColumns = {
    externalId: columns.externalId,
    brand: columns.brand,
    type: columns.type,
    model: columns.model,
    year: columns.year,
    status: columns.status,
    deliveryTerms: columns.deliveryTerms,
    delivery: columns.delivery,
    specification: columns.specification,
  };

  for (const [name, index] of Object.entries(requiredColumns)) {
    if (index < 0) issues.push({ sheet: sheet.sheet, row: 1, message: `Нет колонки ${name}` });
  }
  if (Object.values(requiredColumns).some((index) => index < 0)) return [];

  const result: SpotImportRow[] = [];
  const keys: Array<{ key: string; row: number }> = [];

  data.forEach((row, offset) => {
    const rowNumber = offset + 2;
    if (!row.some((cell) => text(cell))) return;

    const externalId = text(value(row, columns.externalId));
    const brand = text(value(row, columns.brand));
    const model = text(value(row, columns.model));
    const sourceStatus = normalize(value(row, columns.status));
    const priceWithoutVat = numberValue(value(row, columns.price));

    if (!sourceStatus.includes("налич")) return;
    if (!externalId) issues.push({ sheet: sheet.sheet, row: rowNumber, message: "Не указан ID" });
    if (!brand) issues.push({ sheet: sheet.sheet, row: rowNumber, message: "Не указан бренд" });
    if (!model) issues.push({ sheet: sheet.sheet, row: rowNumber, message: "Не указана модель" });
    if (!externalId || !brand || !model) return;

    keys.push({ key: externalId, row: rowNumber });
    result.push({
      external_id: externalId,
      brand,
      type: optionalText(value(row, columns.type)),
      model,
      production_year: integerValue(value(row, columns.year)),
      status: "Stock_CNH_Europe",
      contract_currency: optionalText(value(row, columns.currency)),
      price_with_vat:
        priceWithoutVat == null ? null : Math.round(priceWithoutVat * vatMultiplier),
      delivery_terms: optionalText(value(row, columns.deliveryTerms)),
      delivery: optionalText(value(row, columns.delivery)),
      specification: optionalText(value(row, columns.specification)),
    });
  });

  issues.push(...duplicateIssues(keys, sheet.sheet, "ID"));
  return result;
}

export function transformStockWorkbook(
  sheets: WorkbookSheet[],
  resolver: BrandResolver,
  vatMultiplier = 1.22
): TransformResult {
  const issues: TransformIssue[] = [];
  const inventorySheet = findSheet(sheets, ["Append1"]);
  const spotSheet = findSheet(sheets, ["CNH_Spot_Предложение"]);

  if (!inventorySheet) issues.push({ sheet: "Append1", row: 1, message: "Лист не найден" });
  if (!spotSheet) issues.push({ sheet: "CNH_Spot_Предложение", row: 1, message: "Лист не найден" });

  const inventory = inventorySheet
    ? transformInventory(inventorySheet, resolver, issues)
    : [];
  const spot = spotSheet ? transformSpot(spotSheet, vatMultiplier, issues) : [];

  return { inventory, spot, issues };
}

export function normalizedModel(value: string) {
  return normalize(value);
}
