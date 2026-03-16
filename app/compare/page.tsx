"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  COMPARE_STORAGE_EVENT,
  clearCompareItems,
  getCompareItems,
  removeCompareItem,
  type CompareItem,
  type CompareSource,
} from "../lib/compare-storage";

const INVENTORY_STATUS_LABEL: Record<string, string> = {
  in_stock: "На складе",
  in_transit: "В пути",
  in_production: "В производстве",
};

const SOURCE_LABEL: Record<CompareSource, string> = {
  inventory: "Наличие",
  spot: "CNHi SPOT",
};

export default function ComparePage() {
  const [items, setItems] = useState<CompareItem[]>(() => getCompareItems());

  useEffect(() => {
    function syncItems() {
      setItems(getCompareItems());
    }

    window.addEventListener("storage", syncItems);
    window.addEventListener(COMPARE_STORAGE_EVENT, syncItems);

    return () => {
      window.removeEventListener("storage", syncItems);
      window.removeEventListener(COMPARE_STORAGE_EVENT, syncItems);
    };
  }, []);

  function handleRemove(item: CompareItem) {
    const next = removeCompareItem(item.id, item.source);
    setItems(next);
  }

  function handleClear() {
    clearCompareItems();
    setItems([]);
  }

  return (
    <main className="min-h-dvh bg-zinc-100 pb-8">
      <header className="sticky top-0 z-20 border-b border-white/10 bg-zinc-950/95 text-white shadow-sm backdrop-blur">
        <div className="mx-auto max-w-md px-4 pb-3 pt-4 md:max-w-3xl xl:max-w-6xl">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="text-[10px] uppercase tracking-[0.22em] text-white/45">
                B2B SALES TOOL
              </div>
              <h1 className="mt-1 text-xl font-semibold">Сравнение техники</h1>
              <p className="mt-1 text-xs text-white/60">
                Сравнение позиций из наличия и CNHi SPOT
              </p>
            </div>

            <div className="flex shrink-0 flex-wrap justify-end gap-2">
              <button
                onClick={handleClear}
                className="inline-flex min-h-9 items-center rounded-full border border-white/15 px-3 text-xs text-white/90"
              >
                Очистить
              </button>
              <Link
                href="/inventory"
                className="inline-flex min-h-9 items-center rounded-full border border-white/15 px-3 text-xs text-white/90"
              >
                Назад
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-md px-4 py-4 md:max-w-3xl xl:max-w-6xl">
        {items.length === 0 ? (
          <div className="rounded-[28px] border border-zinc-200 bg-white p-6 shadow-sm">
            <div className="text-lg font-semibold text-zinc-950">
              Сравнение пока пустое
            </div>
            <div className="mt-2 text-sm leading-6 text-zinc-500">
              Добавь до 3 позиций из разделов «Техника в наличии» и «Техника
              CNHi SPOT».
            </div>

            <div className="mt-4 flex gap-2">
              <Link
                href="/inventory"
                className="inline-flex min-h-11 items-center rounded-2xl bg-zinc-950 px-4 text-sm font-medium text-white"
              >
                Открыть наличие
              </Link>
              <Link
                href="/prices"
                className="inline-flex min-h-11 items-center rounded-2xl border border-zinc-300 px-4 text-sm font-medium text-zinc-950"
              >
                Открыть SPOT
              </Link>
            </div>
          </div>
        ) : (
          <>
            <div className="mb-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {items.map((item) => (
                <article
                  key={`${item.source}:${item.id}`}
                  className="rounded-[26px] border border-zinc-200 bg-white p-4 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <SourceBadge source={item.source} />

                    <button
                      onClick={() => handleRemove(item)}
                      className="shrink-0 rounded-full border border-zinc-300 px-3 py-1.5 text-xs text-zinc-700"
                    >
                      Убрать
                    </button>
                  </div>

                  <div className="mt-3">
                    <div className="truncate text-lg font-semibold text-zinc-950">
                      {[item.brand, item.model].filter(Boolean).join(" ") || "—"}
                    </div>
                    <div className="mt-1 text-sm text-zinc-500">
                      {summaryMeta(item)}
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-between gap-2 rounded-[18px] bg-zinc-100 px-3 py-2.5">
                    <div>
                      <div className="text-[10px] uppercase tracking-[0.14em] text-zinc-500">
                        Статус
                      </div>
                      <div className="mt-1 text-sm font-medium text-zinc-950">
                        {formatStatus(item)}
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-[10px] uppercase tracking-[0.14em] text-zinc-500">
                        Цена
                      </div>
                      <div className="mt-1 text-sm font-semibold text-zinc-950">
                        {formatPrice(item)}
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>

            <div className="space-y-3">
              <CompareBlock
                title="Основное"
                rows={[
                  { label: "Источник", values: items.map((item) => formatSource(item.source)) },
                  { label: "Бренд", values: items.map((item) => formatText(item.brand)) },
                  { label: "Модель", values: items.map((item) => formatText(item.model)) },
                  { label: "Тип", values: items.map((item) => formatText(item.type)) },
                  {
                    label: "Год",
                    values: items.map((item) => formatNumber(item.production_year)),
                  },
                  { label: "Статус", values: items.map((item) => formatStatus(item)) },
                ]}
              />

              <CompareBlock
                title="Коммерция"
                rows={[
                  { label: "Цена", values: items.map((item) => formatPriceValue(item.price_with_vat)) },
                  {
                    label: "Валюта",
                    values: items.map((item) => formatText(item.contract_currency)),
                  },
                  { label: "Локация", values: items.map((item) => formatText(item.location)) },
                  {
                    label: "Delivery terms",
                    values: items.map((item) => formatText(item.delivery_terms)),
                  },
                  {
                    label: "Срок поставки",
                    values: items.map((item) => formatText(item.delivery)),
                  },
                ]}
              />

              <CompareBlock
                title="Идентификация"
                rows={[
                  {
                    label: "External ID",
                    values: items.map((item) => formatText(item.external_id)),
                  },
                  {
                    label: "Serial number",
                    values: items.map((item) => formatText(item.serial_number)),
                  },
                  {
                    label: "Arrival date",
                    values: items.map((item) => formatText(item.arrival_date)),
                  },
                  {
                    label: "Warranty",
                    values: items.map((item) => formatText(item.warranty)),
                  },
                ]}
              />

              <CompareBlock
                title="Спецификация"
                rows={[
                  {
                    label: "Ссылка",
                    values: items.map((item) =>
                      isUrl(item.specification) ? "Есть ссылка" : "Нет ссылки"
                    ),
                  },
                ]}
              />
            </div>
          </>
        )}
      </div>
    </main>
  );
}

function CompareBlock({
  title,
  rows,
}: {
  title: string;
  rows: Array<{ label: string; values: string[] }>;
}) {
  return (
    <section className="overflow-x-auto rounded-[28px] border border-zinc-200 bg-white shadow-sm">
      <div className="border-b border-zinc-200 px-4 py-3">
        <div className="text-[11px] uppercase tracking-[0.18em] text-zinc-400">
          {title}
        </div>
      </div>

      <table className="min-w-full border-collapse text-sm">
        <tbody>
          {rows.map((row) => (
            <CompareRow key={row.label} label={row.label} values={row.values} />
          ))}
        </tbody>
      </table>
    </section>
  );
}

function CompareRow({
  label,
  values,
}: {
  label: string;
  values: string[];
}) {
  return (
    <tr className="border-b border-zinc-200 last:border-b-0">
      <td className="w-36 min-w-36 bg-zinc-50 px-3 py-3 align-top text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500 sm:w-44 sm:min-w-44 sm:px-4">
        {label}
      </td>

      {values.map((value, idx) => (
        <td
          key={idx}
          className="min-w-40 px-3 py-3 align-top text-sm leading-5 text-zinc-950 break-words sm:px-4"
        >
          {value}
        </td>
      ))}
    </tr>
  );
}

function SourceBadge({ source }: { source: CompareSource }) {
  return (
    <div
      className={`rounded-full border px-2.5 py-1 text-[11px] font-medium ${
        source === "spot"
          ? "border-amber-300 bg-amber-100 text-amber-800"
          : "border-zinc-300 bg-zinc-100 text-zinc-700"
      }`}
    >
      {formatSource(source)}
    </div>
  );
}

function formatSource(source: CompareSource) {
  return SOURCE_LABEL[source];
}

function formatStatus(item: CompareItem) {
  if (item.source === "inventory") {
    return INVENTORY_STATUS_LABEL[item.status ?? ""] ?? formatText(item.status);
  }

  return formatText(item.status);
}

function formatText(value?: string | null) {
  return value?.trim() ? value : "—";
}

function formatNumber(value?: number | null) {
  return typeof value === "number" ? String(value) : "—";
}

function formatPriceValue(value?: number | null) {
  return typeof value === "number" ? value.toLocaleString("ru-RU") : "—";
}

function formatPrice(item: CompareItem) {
  const price = formatPriceValue(item.price_with_vat);

  if (price === "—") {
    return "—";
  }

  return item.contract_currency ? `${price} ${item.contract_currency}` : price;
}

function summaryMeta(item: CompareItem) {
  if (item.source === "spot") {
    return [formatNumber(item.production_year), formatText(item.type)]
      .filter((value) => value !== "—")
      .join(" • ") || "—";
  }

  return [formatNumber(item.production_year), formatText(item.location)]
    .filter((value) => value !== "—")
    .join(" • ") || "—";
}

function isUrl(value?: string | null) {
  if (!value) return false;
  return value.startsWith("http://") || value.startsWith("https://");
}
