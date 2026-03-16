"use client";

import Link from "next/link";
import { useState } from "react";
import {
  clearCompareItems,
  getCompareItems,
  removeCompareItem,
  type CompareItem,
} from "../lib/compare-storage";

const STATUS_LABEL: Record<string, string> = {
  in_stock: "На складе",
  in_transit: "В пути",
  in_production: "В производстве",
};

export default function ComparePage() {
  const [items, setItems] = useState<CompareItem[]>(() => getCompareItems());

  function handleRemove(id: string) {
    const next = removeCompareItem(id);
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
                Сравнение выбранных позиций из наличия
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
              Добавь до 3 позиций из раздела «Техника в наличии».
            </div>

            <Link
              href="/inventory"
              className="mt-4 inline-flex min-h-11 items-center rounded-2xl bg-zinc-950 px-4 text-sm font-medium text-white"
            >
              Открыть наличие
            </Link>
          </div>
        ) : (
          <>
            <div className="mb-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {items.map((item) => (
                <article
                  key={item.id}
                  className="rounded-[26px] border border-zinc-200 bg-white p-4 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="truncate text-lg font-semibold text-zinc-950">
                        {item.brand} {item.model}
                      </div>
                      <div className="mt-1 text-sm text-zinc-500">
                        {item.production_year ?? "—"} • {item.location ?? "—"}
                      </div>
                    </div>

                    <button
                      onClick={() => handleRemove(item.id)}
                      className="shrink-0 rounded-full border border-zinc-300 px-3 py-1.5 text-xs text-zinc-700"
                    >
                      Убрать
                    </button>
                  </div>

                  <div className="mt-3 flex items-center justify-between gap-2 rounded-[18px] bg-zinc-100 px-3 py-2.5">
                    <div>
                      <div className="text-[10px] uppercase tracking-[0.14em] text-zinc-500">
                        Цена
                      </div>
                      <div className="mt-1 text-base font-semibold text-zinc-950">
                        {item.price_with_vat
                          ? Number(item.price_with_vat).toLocaleString("ru-RU")
                          : "—"}
                      </div>
                    </div>
                    <div className="text-sm text-zinc-500">
                      {item.contract_currency ?? "—"}
                    </div>
                  </div>
                </article>
              ))}
            </div>

            <div className="overflow-x-auto rounded-[28px] border border-zinc-200 bg-white shadow-sm">
              <table className="min-w-full border-collapse text-sm">
                <tbody>
                  <CompareRow
                    label="Бренд"
                    values={items.map((i) => i.brand ?? "—")}
                  />
                  <CompareRow
                    label="Модель"
                    values={items.map((i) => i.model ?? "—")}
                  />
                  <CompareRow
                    label="Год"
                    values={items.map((i) =>
                      i.production_year ? String(i.production_year) : "—"
                    )}
                  />
                  <CompareRow
                    label="Локация"
                    values={items.map((i) => i.location ?? "—")}
                  />
                  <CompareRow
                    label="Статус"
                    values={items.map(
                      (i) => STATUS_LABEL[i.status ?? ""] ?? i.status ?? "—"
                    )}
                  />
                  <CompareRow
                    label="External ID"
                    values={items.map((i) => i.external_id ?? "—")}
                  />
                  <CompareRow
                    label="Serial number"
                    values={items.map((i) => i.serial_number ?? "—")}
                  />
                  <CompareRow
                    label="Поступление"
                    values={items.map((i) => i.arrival_date ?? "—")}
                  />
                  <CompareRow
                    label="Гарантия"
                    values={items.map((i) => i.warranty ?? "—")}
                  />
                  <CompareRow
                    label="Цена"
                    values={items.map((i) =>
                      i.price_with_vat
                        ? `${Number(i.price_with_vat).toLocaleString("ru-RU")} ${i.contract_currency ?? ""}`.trim()
                        : "—"
                    )}
                  />
                  <CompareRow
                    label="Спецификация"
                    values={items.map((i) =>
                      i.specification ? "Есть ссылка" : "—"
                    )}
                  />
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </main>
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
