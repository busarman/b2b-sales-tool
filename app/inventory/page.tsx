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

  if (s === "in_stock") {
    return "bg-emerald-100 text-emerald-800 border-emerald-300";
  }

  if (s === "in_transit") {
    return "bg-amber-100 text-amber-800 border-amber-300";
  }

  if (s === "in_production") {
    return "bg-sky-100 text-sky-800 border-sky-300";
  }

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
  const [compareCount, setCompareCount] = useState(0);

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
    setCompareCount(getCompareCount());
  }, []);

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
        [i.brand, i.model, i.serial_number, i.external_id, i.location]
          .filter(Boolean)
          .some((v) => String(v).toLowerCase().includes(q));

      return brandOk && statusOk && searchOk;
    });
  }, [items, brand, status, search]);

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

  return (
    <main className="min-h-dvh bg-zinc-100 pb-10">
      <div className="sticky top-0 z-20 bg-zinc-950 text-white shadow-sm">
        <div className="mx-auto max-w-md px-4 pb-4 pt-5">
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="text-[11px] uppercase tracking-[0.18em] text-white/50">
                B2B SALES TOOL
              </div>

              <h1 className="mt-1 text-2xl font-semibold">
                Техника в наличии
              </h1>

              <p className="text-sm text-white/60">
                Актуальное наличие для дилеров
              </p>
            </div>

            <div className="flex gap-2">
              <Link
                href="/compare"
                className="rounded-full bg-white px-3 py-1.5 text-xs font-medium text-zinc-950"
              >
                Сравнение{compareCount > 0 ? ` (${compareCount})` : ""}
              </Link>

              <Link
                href="/"
                className="rounded-full border border-white/20 px-3 py-1.5 text-xs"
              >
                Главная
              </Link>
            </div>
          </div>

          <div className="mt-4">
            <input
              placeholder="Поиск: модель / serial / ID / локация"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-white outline-none placeholder:text-white/40"
            />
          </div>

          <div className="mt-3 -mx-4 overflow-x-auto px-4">
            <div className="flex w-max gap-2">
              <button
                onClick={() => setBrand("")}
                className={`rounded-full px-3 py-2 text-xs whitespace-nowrap ${
                  brand === "" ? "bg-white text-zinc-950" : "bg-white/10"
                }`}
              >
                Все бренды
              </button>

              {brands.map((b) => (
                <button
                  key={b}
                  onClick={() => setBrand(b)}
                  className={`rounded-full px-3 py-2 text-xs whitespace-nowrap ${
                    brand === b ? "bg-white text-zinc-950" : "bg-white/10"
                  }`}
                >
                  {b}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-2 -mx-4 overflow-x-auto px-4">
            <div className="flex w-max gap-2">
              <button
                onClick={() => setStatus("")}
                className={`rounded-full px-3 py-2 text-xs whitespace-nowrap ${
                  status === "" ? "bg-white text-zinc-950" : "bg-white/10"
                }`}
              >
                Все статусы
              </button>

              <button
                onClick={() => setStatus("in_stock")}
                className={`rounded-full px-3 py-2 text-xs whitespace-nowrap ${
                  status === "in_stock"
                    ? "bg-white text-zinc-950"
                    : "bg-white/10"
                }`}
              >
                На складе
              </button>

              <button
                onClick={() => setStatus("in_transit")}
                className={`rounded-full px-3 py-2 text-xs whitespace-nowrap ${
                  status === "in_transit"
                    ? "bg-white text-zinc-950"
                    : "bg-white/10"
                }`}
              >
                В пути
              </button>

              <button
                onClick={() => setStatus("in_production")}
                className={`rounded-full px-3 py-2 text-xs whitespace-nowrap ${
                  status === "in_production"
                    ? "bg-white text-zinc-950"
                    : "bg-white/10"
                }`}
              >
                В производстве
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-md px-4 py-4">
        <div className="mb-3 text-xs uppercase tracking-[0.18em] text-zinc-500">
          Позиций: {loading ? "..." : filtered.length}
        </div>

        {loading && (
          <div className="rounded-3xl bg-white p-4 text-sm shadow">
            Загрузка...
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <div className="rounded-3xl bg-white p-4 text-sm shadow">
            Ничего не найдено
          </div>
        )}

        <div className="space-y-4">
          {filtered.map((item) => (
            <div
              key={item.id}
              className="rounded-[28px] bg-white shadow ring-1 ring-zinc-200"
            >
              <div className="border-b border-zinc-200 px-4 py-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="truncate text-[21px] font-semibold text-zinc-950">
                      {item.brand} {item.model}
                    </div>

                    <div className="mt-1 text-sm text-zinc-500">
                      {item.production_year ?? "—"} • {item.location ?? "—"}
                    </div>
                  </div>

                  <div
                    className={`shrink-0 rounded-full border px-3 py-1 text-xs font-medium ${statusClass(
                      item.status
                    )}`}
                  >
                    {STATUS_LABEL[item.status ?? ""] ?? item.status}
                  </div>
                </div>
              </div>

              <div className="space-y-3 px-4 py-4">
                <div className="rounded-2xl bg-zinc-950 p-4 text-white">
                  <div className="text-xs uppercase tracking-[0.14em] text-white/60">
                    Цена
                  </div>

                  <div className="mt-2 text-2xl font-semibold">
                    {item.price_with_vat
                      ? Number(item.price_with_vat).toLocaleString("ru-RU")
                      : "—"}
                  </div>

                  <div className="text-sm text-white/60">
                    {item.contract_currency ?? ""}
                  </div>
                </div>

                <Info label="External ID" value={item.external_id} />
                <Info label="Serial number" value={item.serial_number} />
                <Info label="Поступление" value={item.arrival_date} />

                <div className="grid grid-cols-2 gap-3">
                  <Info label="Валюта" value={item.contract_currency} />
                  <Info label="Гарантия" value={item.warranty} />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => handleAddCompare(item)}
                    className="rounded-2xl border border-zinc-300 px-4 py-3 text-sm font-medium"
                  >
                    + Сравнить
                  </button>

                  {isUrl(item.specification) ? (
                    <a
                      href={item.specification ?? undefined}
                      target="_blank"
                      rel="noreferrer"
                      className="block rounded-2xl border border-zinc-300 px-4 py-3 text-center text-sm font-medium"
                    >
                      Спецификация
                    </a>
                  ) : (
                    <div className="rounded-2xl border border-zinc-200 px-4 py-3 text-center text-sm text-zinc-400">
                      Нет ссылки
                    </div>
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
    <div className="rounded-2xl bg-zinc-100 p-3">
      <div className="text-xs uppercase text-zinc-500">{label}</div>
      <div className="text-sm font-medium">{value ?? "—"}</div>
    </div>
  );
}