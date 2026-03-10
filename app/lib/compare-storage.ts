"use client";

const COMPARE_STORAGE_KEY = "b2b_compare_items_v1";
const COMPARE_LIMIT = 3;

export type CompareItem = {
  id: string;
  brand?: string | null;
  model?: string | null;
  production_year?: number | null;
  location?: string | null;
  status?: string | null;
  external_id?: string | null;
  serial_number?: string | null;
  arrival_date?: string | null;
  contract_currency?: string | null;
  price_with_vat?: number | null;
  specification?: string | null;
  warranty?: string | null;
};

type AddCompareResult =
  | { ok: true; items: CompareItem[] }
  | { ok: false; reason: "exists" | "limit"; items: CompareItem[] };

function canUseStorage() {
  return typeof window !== "undefined" && typeof localStorage !== "undefined";
}

function readItems(): CompareItem[] {
  if (!canUseStorage()) return [];

  const raw = localStorage.getItem(COMPARE_STORAGE_KEY);
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is CompareItem => {
      return Boolean(item && typeof item === "object" && typeof item.id === "string");
    });
  } catch {
    return [];
  }
}

function writeItems(items: CompareItem[]) {
  if (!canUseStorage()) return;
  localStorage.setItem(COMPARE_STORAGE_KEY, JSON.stringify(items));
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
}

export function removeCompareItem(id: string) {
  const next = readItems().filter((item) => item.id !== id);
  writeItems(next);
  return next;
}

export function addCompareItem(item: CompareItem): AddCompareResult {
  const items = readItems();

  if (items.some((existing) => existing.id === item.id)) {
    return { ok: false, reason: "exists", items };
  }

  if (items.length >= COMPARE_LIMIT) {
    return { ok: false, reason: "limit", items };
  }

  const next = [...items, item];
  writeItems(next);
  return { ok: true, items: next };
}
