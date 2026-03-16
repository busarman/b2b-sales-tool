"use client";

const COMPARE_STORAGE_KEY = "b2b_compare_items_v1";
const COMPARE_LIMIT = 3;
export const COMPARE_STORAGE_EVENT = "b2b-compare-updated";

export type CompareSource = "inventory" | "spot";

export type CompareItem = {
  id: string;
  source: CompareSource;
  brand?: string | null;
  model?: string | null;
  type?: string | null;
  production_year?: number | null;
  status?: string | null;
  location?: string | null;
  price_with_vat?: number | null;
  contract_currency?: string | null;
  specification?: string | null;
  external_id?: string | null;
  serial_number?: string | null;
  arrival_date?: string | null;
  warranty?: string | null;
  delivery_terms?: string | null;
  delivery?: string | null;
};

type AddCompareResult =
  | { ok: true; items: CompareItem[] }
  | { ok: false; reason: "exists" | "limit"; items: CompareItem[] };

function canUseStorage() {
  return typeof window !== "undefined" && typeof localStorage !== "undefined";
}

function isCompareSource(value: unknown): value is CompareSource {
  return value === "inventory" || value === "spot";
}

function normalizeCompareItem(value: unknown): CompareItem | null {
  if (!value || typeof value !== "object") return null;

  const item = value as Record<string, unknown>;

  if (typeof item.id !== "string" || !isCompareSource(item.source)) {
    return null;
  }

  return {
    id: item.id,
    source: item.source,
    brand: typeof item.brand === "string" || item.brand == null ? item.brand : null,
    model: typeof item.model === "string" || item.model == null ? item.model : null,
    type: typeof item.type === "string" || item.type == null ? item.type : null,
    production_year:
      typeof item.production_year === "number" || item.production_year == null
        ? item.production_year
        : null,
    status:
      typeof item.status === "string" || item.status == null ? item.status : null,
    location:
      typeof item.location === "string" || item.location == null
        ? item.location
        : null,
    price_with_vat:
      typeof item.price_with_vat === "number" || item.price_with_vat == null
        ? item.price_with_vat
        : null,
    contract_currency:
      typeof item.contract_currency === "string" || item.contract_currency == null
        ? item.contract_currency
        : null,
    specification:
      typeof item.specification === "string" || item.specification == null
        ? item.specification
        : null,
    external_id:
      typeof item.external_id === "string" || item.external_id == null
        ? item.external_id
        : null,
    serial_number:
      typeof item.serial_number === "string" || item.serial_number == null
        ? item.serial_number
        : null,
    arrival_date:
      typeof item.arrival_date === "string" || item.arrival_date == null
        ? item.arrival_date
        : null,
    warranty:
      typeof item.warranty === "string" || item.warranty == null
        ? item.warranty
        : null,
    delivery_terms:
      typeof item.delivery_terms === "string" || item.delivery_terms == null
        ? item.delivery_terms
        : null,
    delivery:
      typeof item.delivery === "string" || item.delivery == null
        ? item.delivery
        : null,
  };
}

function compareKey(item: Pick<CompareItem, "id" | "source">) {
  return `${item.source}:${item.id}`;
}

function readItems(): CompareItem[] {
  if (!canUseStorage()) return [];

  const raw = localStorage.getItem(COMPARE_STORAGE_KEY);
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((item) => normalizeCompareItem(item))
      .filter((item): item is CompareItem => item !== null);
  } catch {
    return [];
  }
}

function notifyChange(items: CompareItem[]) {
  if (!canUseStorage()) return;

  window.dispatchEvent(
    new CustomEvent<CompareItem[]>(COMPARE_STORAGE_EVENT, {
      detail: items,
    })
  );
}

export function saveCompareItems(items: CompareItem[]) {
  if (!canUseStorage()) return;
  localStorage.setItem(COMPARE_STORAGE_KEY, JSON.stringify(items));
  notifyChange(items);
}

export function getCompareItems() {
  return readItems();
}

export function getCompareCount() {
  return readItems().length;
}

export function clearCompareItems() {
  if (!canUseStorage()) return;
  localStorage.removeItem(COMPARE_STORAGE_KEY);
  notifyChange([]);
}

export function removeCompareItem(id: string, source?: CompareSource) {
  const next = readItems().filter((item) => {
    if (source) {
      return !(item.id === id && item.source === source);
    }

    return item.id !== id;
  });

  saveCompareItems(next);
  return next;
}

export function addCompareItem(item: CompareItem): AddCompareResult {
  const normalized = normalizeCompareItem(item);
  const items = readItems();

  if (!normalized) {
    return { ok: false, reason: "exists", items };
  }

  if (items.some((existing) => compareKey(existing) === compareKey(normalized))) {
    return { ok: false, reason: "exists", items };
  }

  if (items.length >= COMPARE_LIMIT) {
    return { ok: false, reason: "limit", items };
  }

  const next = [...items, normalized];
  saveCompareItems(next);
  return { ok: true, items: next };
}
