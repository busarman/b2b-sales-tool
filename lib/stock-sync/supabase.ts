import { createClient } from "@supabase/supabase-js";
import type { BrandResolver, InventoryImportRow, SpotImportRow } from "./types";
import { normalizedModel } from "./transform";

type ExistingInventory = {
  serial_number: string | null;
  model: string | null;
  brand: string | null;
};

function requiredEnv(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`Не задана переменная ${name}`);
  return value;
}

export function stockSyncClient() {
  return createClient(
    requiredEnv("NEXT_PUBLIC_SUPABASE_URL"),
    requiredEnv("SUPABASE_SERVICE_ROLE_KEY"),
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
}

export async function loadBrandResolver() {
  const client = stockSyncClient();
  const { data, error } = await client
    .from("inventory")
    .select("serial_number,model,brand")
    .returns<ExistingInventory[]>();
  if (error) throw new Error(`Supabase inventory: ${error.message}`);

  const bySerial = new Map<string, string>();
  const modelBrands = new Map<string, Set<string>>();
  for (const row of data ?? []) {
    if (row.serial_number && row.brand) bySerial.set(row.serial_number, row.brand);
    if (row.model && row.brand) {
      const key = normalizedModel(row.model);
      const values = modelBrands.get(key) ?? new Set<string>();
      values.add(row.brand);
      modelBrands.set(key, values);
    }
  }

  const byModel = new Map<string, string>();
  for (const [model, brands] of modelBrands) {
    if (brands.size === 1) byModel.set(model, [...brands][0]);
  }

  return { bySerial, byModel } satisfies BrandResolver;
}

function comparable(
  row: Record<string, unknown>,
  ignored: string[],
  comparedFields: Set<string>
) {
  return JSON.stringify(
    Object.fromEntries(
      Object.entries(row)
        .filter(([key]) => comparedFields.has(key) && !ignored.includes(key))
        .sort(([a], [b]) => a.localeCompare(b))
    )
  );
}

function diffByKey<T extends Record<string, unknown>>(
  incoming: T[],
  current: T[],
  key: keyof T,
  ignored: string[]
) {
  const before = new Map(current.map((row) => [String(row[key] ?? ""), row]));
  const after = new Map(incoming.map((row) => [String(row[key] ?? ""), row]));
  const comparedFields = new Set(incoming.flatMap((row) => Object.keys(row)));
  let added = 0;
  let changed = 0;
  let removed = 0;

  for (const [id, row] of after) {
    const old = before.get(id);
    if (!old) added += 1;
    else if (
      comparable(row, ignored, comparedFields) !==
      comparable(old, ignored, comparedFields)
    ) {
      changed += 1;
    }
  }
  for (const id of before.keys()) if (!after.has(id)) removed += 1;
  return { current: current.length, incoming: incoming.length, added, changed, removed };
}

export async function previewStockSync(
  inventory: InventoryImportRow[],
  spot: SpotImportRow[]
) {
  const client = stockSyncClient();
  const [inventoryResult, spotResult] = await Promise.all([
    client.from("inventory").select("*"),
    client.from("cnhi_spot").select("*"),
  ]);
  if (inventoryResult.error) throw new Error(`Supabase inventory: ${inventoryResult.error.message}`);
  if (spotResult.error) throw new Error(`Supabase cnhi_spot: ${spotResult.error.message}`);

  return {
    inventory: diffByKey(
      inventory as unknown as Record<string, unknown>[],
      ((inventoryResult.data ?? []) as Record<string, unknown>[]).filter(
        (row) => row.is_active !== false
      ),
      "serial_number",
      ["id", "created_at", "source_file", "source_synced_at", "is_active"]
    ),
    spot: diffByKey(
      spot as unknown as Record<string, unknown>[],
      ((spotResult.data ?? []) as Record<string, unknown>[]).filter(
        (row) => row.is_active !== false
      ),
      "external_id",
      ["id", "created_at", "source_file", "source_synced_at", "is_active"]
    ),
  };
}

export async function applyStockSync(
  inventory: InventoryImportRow[],
  spot: SpotImportRow[],
  sourceFile: string
) {
  const client = stockSyncClient();
  const { data, error } = await client.rpc("apply_stock_sync", {
    p_inventory: inventory,
    p_spot: spot,
    p_source_file: sourceFile,
  });
  if (error) throw new Error(`Supabase sync: ${error.message}`);
  return data;
}
