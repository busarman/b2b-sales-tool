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
    <main className="min-h-dvh bg-zinc-100 pb-[calc(2.5rem+env(safe-area-inset-bottom))]">
      <div className="sticky top-0 z-20 bg-zinc-950/95 text-white shadow-sm backdrop-blur">
        <div className="mx-auto max-w-md px-4 pb-4 pt-5 md:max-w-3xl xl:max-w-6xl">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="text-xs uppercase tracking-[0.18em] text-white/50">
                B2B SALES TOOL
              </div>
              <h1 className="mt-1 truncate text-2xl font-semibold">Сравнение техники</h1>
              <p className="mt-1 text-sm text-white/60">
                Сравнение выбранных позиций из наличия
              </p>
            </div>

            <div className="flex shrink-0 flex-wrap justify-end gap-2">
              <button
                onClick={handleClear}
                className="inline-flex min-h-10 items-center rounded-full border border-white/20 px-3 py-1.5 text-xs hover:bg-white/10 active:scale-[0.98]"
              >
                Очистить
              </button>

              <Link
                href="/inventory"
                className="inline-flex min-h-10 items-center rounded-full border border-white/20 px-3 py-1.5 text-xs hover:bg-white/10 active:scale-[0.98]"
              >
                Назад
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-md px-4 py-4 md:max-w-3xl xl:max-w-6xl">
        {items.length === 0 ? (
          <div className="card-lift reveal-up rounded-3xl p-6">
            <div className="text-lg font-semibold">Сравнение пока пустое</div>
            <div className="mt-2 text-sm text-zinc-500">
              Добавь до 3 позиций из раздела «Техника в наличии».
            </div>

            <Link
              href="/inventory"
              className="mt-4 inline-block rounded-2xl bg-zinc-950 px-4 py-3 text-sm text-white hover:bg-zinc-800 active:scale-[0.99]"
            >
              Открыть наличие
            </Link>
          </div>
        ) : (
          <>
            <div className="mb-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {items.map((item, idx) => (
                <div
                  key={item.id}
                  className="card-lift reveal-up rounded-3xl p-4"
                  style={{ animationDelay: `${Math.min(idx, 8) * 40}ms` }}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="truncate text-lg font-semibold">
                        {item.brand} {item.model}
                      </div>
                      <div className="text-sm text-zinc-500">
                        {item.production_year ?? "—"} • {item.location ?? "—"}
                      </div>
                    </div>

                    <button
                      onClick={() => handleRemove(item.id)}
                      className="rounded-full border px-3 py-1 text-xs hover:border-zinc-950 hover:bg-zinc-950 hover:text-white active:scale-[0.98]"
                    >
                      Убрать
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="card-lift reveal-up overflow-x-auto rounded-3xl" style={{ animationDelay: "140ms" }}>
              <table className="min-w-full border-collapse">
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
                    values={items.map((i) => STATUS_LABEL[i.status ?? ""] ?? i.status ?? "—")}
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
      <td className="w-52 whitespace-nowrap bg-zinc-50 px-4 py-3 text-sm font-semibold text-zinc-700">
        {label}
      </td>

      {values.map((value, idx) => (
        <td key={idx} className="px-4 py-3 text-sm text-zinc-950 align-top break-words">
          {value}
        </td>
      ))}
    </tr>
  );
}
