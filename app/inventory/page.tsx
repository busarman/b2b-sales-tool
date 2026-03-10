"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import {
  addCompareItem,
  getCompareCount,
  type CompareItem,
} from "../lib/compare-storage";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type Item = {
  id: string;
  brand?: string | null;
  model?: string | null;
  production_year?: number | null;
  location?: string | null;
  status?: string | null;
  status_priority?: number | null;
  external_id?: string | null;
  serial_number?: string | null;
  arrival_date?: string | null;
  contract_currency?: string | null;
  price_with_vat?: number | null;
  specification?: string | null;
  warranty?: string | null;
};

const STATUS_LABEL: Record<string, string> = {
  in_stock: "На складе",
  in_transit: "В пути",
  in_production: "В производстве",
};

function statusClass(status?: string | null) {
  const s = (status ?? "").toLowerCase();

  if (s === "in_stock") return "bg-emerald-100 text-emerald-800 border-emerald-300";
  if (s === "in_transit") return "bg-amber-100 text-amber-800 border-amber-300";
  if (s === "in_production") return "bg-sky-100 text-sky-800 border-sky-300";

  return "bg-zinc-100 text-zinc-700 border-zinc-300";
}

function isUrl(v?: string | null) {
  if (!v) return false;
  return v.startsWith("http://") || v.startsWith("https://");
}

export default function InventoryPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);

  const [brand, setBrand] = useState("");
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [compareCount, setCompareCount] = useState(() => getCompareCount());

  useEffect(() => {
    async function load() {
      const { data, error } = await supabase
        .from("inventory")
        .select("*")
        .order("status_priority", { ascending: true });

      if (error) {
        console.error(error);
        setItems([]);
      } else {
        setItems((data ?? []) as Item[]);
      }

      setLoading(false);
    }

    load();
  }, []);

  function handleAddCompare(item: Item) {
    const result = addCompareItem(item as CompareItem);

    if (!result.ok && result.reason === "exists") {
      alert("Эта техника уже добавлена в сравнение.");
      return;
    }

    if (!result.ok && result.reason === "limit") {
      alert("Можно сравнивать максимум 3 позиции.");
      return;
    }

    setCompareCount(result.items.length);
  }

  const brands = useMemo(() => {
    const values = Array.from(
      new Set(
        items
          .map((i) => i.brand?.trim())
          .filter((v): v is string => Boolean(v))
      )
    );

    return values.sort((a, b) => a.localeCompare(b, "ru"));
  }, [items]);

  const filtered = useMemo(() => {
    return items.filter((i) => {
      const brandOk = !brand || i.brand === brand;
      const statusOk = !status || i.status === status;

      const q = search.trim().toLowerCase();

      const searchOk =
        !q ||
        [
          i.model,
          i.serial_number,
          i.external_id,
          i.location,
          i.brand,
        ]
          .filter(Boolean)
          .some((v) => String(v).toLowerCase().includes(q));

      return brandOk && statusOk && searchOk;
    });
  }, [items, brand, status, search]);

  return (
    <main className="min-h-dvh bg-zinc-100 pb-[calc(2.5rem+env(safe-area-inset-bottom))]">
      <div className="sticky top-0 z-20 bg-zinc-950/95 text-white shadow-sm backdrop-blur">
        <div className="mx-auto max-w-md px-4 pb-4 pt-5 md:max-w-3xl xl:max-w-6xl">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="text-xs uppercase tracking-[0.18em] text-white/50">
                B2B SALES TOOL
              </div>

              <h1 className="mt-1 truncate text-2xl font-semibold">
                Техника в наличии
              </h1>

              <p className="text-sm text-white/60">
                Актуальное наличие для дилеров
              </p>
            </div>

            <div className="flex shrink-0 flex-wrap justify-end gap-2">
              <Link
                href="/compare"
                className="inline-flex min-h-10 items-center rounded-full border border-white/20 px-3 py-1.5 text-xs hover:bg-white/10 active:scale-[0.98]"
              >
                Сравнение {compareCount > 0 ? `(${compareCount})` : ""}
              </Link>

              <Link
                href="/"
                className="inline-flex min-h-10 items-center rounded-full border border-white/20 px-3 py-1.5 text-xs hover:bg-white/10 active:scale-[0.98]"
              >
                Главная
              </Link>
            </div>
          </div>

          <div className="mt-4 max-w-3xl">
            <input
              placeholder="Поиск модель / serial / ID / локация"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-white outline-none placeholder:text-white/40 focus:border-white/35 focus:bg-white/15"
            />
          </div>

          <div className="no-scrollbar -mx-1 mt-3 flex gap-2 overflow-x-auto px-1 md:mx-0 md:max-w-4xl md:flex-wrap md:overflow-visible md:px-0">
            <button
              onClick={() => setBrand("")}
              className={`shrink-0 rounded-full px-3 py-2 text-xs hover:bg-white/20 active:scale-[0.98] ${
                brand === "" ? "bg-white text-zinc-950" : "bg-white/10"
              }`}
            >
              Все
            </button>

            {brands.map((b) => (
              <button
                key={b}
                onClick={() => setBrand(b)}
                className={`shrink-0 rounded-full px-3 py-2 text-xs hover:bg-white/20 active:scale-[0.98] ${
                  brand === b ? "bg-white text-zinc-950" : "bg-white/10"
                }`}
              >
                {b}
              </button>
            ))}
          </div>

          <div className="no-scrollbar -mx-1 mt-2 flex gap-2 overflow-x-auto px-1 md:mx-0 md:max-w-4xl md:flex-wrap md:overflow-visible md:px-0">
            <button
              onClick={() => setStatus("")}
              className={`shrink-0 rounded-full px-3 py-2 text-xs hover:bg-white/20 active:scale-[0.98] ${
                status === "" ? "bg-white text-zinc-950" : "bg-white/10"
              }`}
            >
              Все
            </button>

            <button
              onClick={() => setStatus("in_stock")}
              className={`shrink-0 rounded-full px-3 py-2 text-xs hover:bg-white/20 active:scale-[0.98] ${
                status === "in_stock" ? "bg-white text-zinc-950" : "bg-white/10"
              }`}
            >
              На складе
            </button>

            <button
              onClick={() => setStatus("in_transit")}
              className={`shrink-0 rounded-full px-3 py-2 text-xs hover:bg-white/20 active:scale-[0.98] ${
                status === "in_transit" ? "bg-white text-zinc-950" : "bg-white/10"
              }`}
            >
              В пути
            </button>

            <button
              onClick={() => setStatus("in_production")}
              className={`shrink-0 rounded-full px-3 py-2 text-xs hover:bg-white/20 active:scale-[0.98] ${
                status === "in_production" ? "bg-white text-zinc-950" : "bg-white/10"
              }`}
            >
              В производстве
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-md px-4 py-5 md:max-w-3xl xl:max-w-6xl">
        <div className="mb-4 text-xs uppercase tracking-[0.18em] text-zinc-500">
          Позиций: {loading ? "..." : filtered.length}
        </div>

        {loading && (
          <div className="card-lift rounded-3xl p-4 text-sm">
            Загрузка...
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <div className="card-lift rounded-3xl p-4 text-sm">
            Ничего не найдено
          </div>
        )}

        <div className="grid gap-4 lg:grid-cols-2 2xl:grid-cols-3">
          {filtered.map((item, idx) => (
            <div
              key={item.id}
              className="card-lift reveal-up flex h-full flex-col rounded-3xl border-2 border-zinc-300/90 bg-white shadow-[0_18px_40px_-30px_rgba(24,24,27,0.65)] hover:border-zinc-400"
              style={{ animationDelay: `${Math.min(idx, 8) * 45}ms` }}
            >
              <div className="border-b border-zinc-200 px-5 py-5">
                <div className="flex justify-between gap-3">
                  <div className="min-w-0">
                    <div className="truncate text-[22px] font-extrabold leading-[1.1] tracking-[-0.01em] sm:text-[26px] xl:text-[32px]">
                      {item.brand} {item.model}
                    </div>

                    <div className="mt-1 text-base font-medium text-zinc-600 sm:text-lg">
                      {item.production_year ?? "—"} • {item.location ?? "—"}
                    </div>
                  </div>

                  <div
                    className={`inline-flex h-10 min-w-[108px] items-center justify-center rounded-full border px-4 text-sm font-bold leading-none whitespace-nowrap sm:h-12 sm:min-w-[116px] sm:px-5 sm:text-base ${statusClass(
                      item.status
                    )}`}
                  >
                    {STATUS_LABEL[item.status ?? ""] ?? item.status}
                  </div>
                </div>
              </div>

              <div className="flex flex-1 flex-col space-y-3 px-5 py-5">
                <Info label="External ID" value={item.external_id} />
                <Info label="Serial number" value={item.serial_number} />
                <Info label="Поступление" value={item.arrival_date} />

                <div className="grid grid-cols-2 gap-3">
                  <Info label="Валюта" value={item.contract_currency} />
                  <Info label="Гарантия" value={item.warranty} />
                </div>

                <div className="rounded-2xl bg-zinc-950 p-4 text-white">
                  <div className="text-xs font-semibold uppercase tracking-[0.14em] text-white/60">
                    Цена
                  </div>

                  <div className="mt-2 text-4xl font-extrabold leading-none tracking-tight">
                    {item.price_with_vat
                      ? Number(item.price_with_vat).toLocaleString("ru-RU")
                      : "—"}
                  </div>

                  <div className="mt-1 text-base font-semibold text-white/70">
                    {item.contract_currency ?? ""}
                  </div>
                </div>

                <div className="mt-auto space-y-3">
                  <button
                    onClick={() => handleAddCompare(item)}
                    className="w-full rounded-2xl border border-zinc-300 px-4 py-3 text-base font-bold hover:border-zinc-950 hover:bg-zinc-950 hover:text-white active:scale-[0.99] sm:text-lg"
                  >
                    + Сравнить
                  </button>

                  {isUrl(item.specification) && (
                    <a
                      href={item.specification ?? undefined}
                      target="_blank"
                      rel="noreferrer"
                      className="block rounded-2xl border px-4 py-3 text-center text-sm font-semibold hover:border-zinc-950 hover:bg-zinc-950 hover:text-white active:scale-[0.99] sm:text-base"
                    >
                      Открыть спецификацию
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}

function Info({
  label,
  value,
}: {
  label: string;
  value?: string | number | null;
}) {
  return (
    <div className="rounded-2xl bg-zinc-100 p-3 transition-colors hover:bg-zinc-200/70">
      <div className="text-xs font-medium uppercase text-zinc-500">
        {label}
      </div>

      <div className="text-xl font-bold leading-tight sm:text-2xl">
        {value ?? "—"}
      </div>
    </div>
  );
}
