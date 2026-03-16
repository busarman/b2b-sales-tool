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

const STATUS_OPTIONS = [
  { value: "", label: "Все статусы" },
  { value: "in_stock", label: "На складе" },
  { value: "in_transit", label: "В пути" },
  { value: "in_production", label: "В производстве" },
];

function statusClass(status?: string | null) {
  const s = (status ?? "").toLowerCase();

  if (s === "in_stock") {
    return "border-emerald-300 bg-emerald-100 text-emerald-800";
  }

  if (s === "in_transit") {
    return "border-amber-300 bg-amber-100 text-amber-800";
  }

  if (s === "in_production") {
    return "border-sky-300 bg-sky-100 text-sky-800";
  }

  return "border-zinc-300 bg-zinc-100 text-zinc-700";
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
    <main className="min-h-dvh bg-zinc-100 pb-8">
      <header className="sticky top-0 z-20 border-b border-white/10 bg-zinc-950 text-white shadow-sm">
        <div className="mx-auto max-w-md px-4 pb-3 pt-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="text-[10px] uppercase tracking-[0.22em] text-white/45">
                B2B SALES TOOL
              </div>
              <h1 className="mt-1 text-xl font-semibold">Техника в наличии</h1>
              <p className="mt-1 text-xs text-white/60">
                Актуальное наличие для дилеров
              </p>
            </div>

            <div className="flex shrink-0 gap-2">
              <Link
                href="/compare"
                className="inline-flex min-h-9 items-center rounded-full bg-white px-3 text-xs font-medium text-zinc-950"
              >
                Сравнение{compareCount > 0 ? ` (${compareCount})` : ""}
              </Link>
              <Link
                href="/"
                className="inline-flex min-h-9 items-center rounded-full border border-white/15 px-3 text-xs text-white/90"
              >
                Главная
              </Link>
            </div>
          </div>

          <div className="mt-3">
            <input
              placeholder="Поиск: модель / serial / ID / локация"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-white outline-none placeholder:text-white/35"
            />
          </div>

          <div className="mt-3 -mx-4 overflow-x-auto px-4 [scrollbar-width:none]">
            <div className="flex w-max gap-2 pb-1">
              <FilterPill
                active={brand === ""}
                onClick={() => setBrand("")}
                label="Все бренды"
                activeClassName="bg-white text-zinc-950"
                idleClassName="bg-white/10 text-white/75"
              />
              {brands.map((b) => (
                <FilterPill
                  key={b}
                  active={brand === b}
                  onClick={() => setBrand(b)}
                  label={b}
                  activeClassName="bg-white text-zinc-950"
                  idleClassName="bg-white/10 text-white/75"
                />
              ))}
            </div>
          </div>

          <div className="mt-2 -mx-4 overflow-x-auto px-4 [scrollbar-width:none]">
            <div className="flex w-max gap-2 pb-1">
              {STATUS_OPTIONS.map((option) => (
                <FilterPill
                  key={option.value || "all"}
                  active={status === option.value}
                  onClick={() => setStatus(option.value)}
                  label={option.label}
                  activeClassName="bg-white text-zinc-950"
                  idleClassName="bg-white/10 text-white/75"
                />
              ))}
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-md px-4 py-4">
        <div className="mb-3 flex items-center justify-between text-[11px] uppercase tracking-[0.18em] text-zinc-500">
          <span>Позиций</span>
          <span>{loading ? "..." : filtered.length}</span>
        </div>

        {loading && (
          <div className="rounded-[24px] border border-zinc-200 bg-white px-4 py-5 text-sm text-zinc-600 shadow-sm">
            Загрузка...
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <div className="rounded-[24px] border border-zinc-200 bg-white px-4 py-5 text-sm text-zinc-600 shadow-sm">
            Ничего не найдено
          </div>
        )}

        <div className="space-y-3">
          {filtered.map((item) => (
            <article
              key={item.id}
              className="rounded-[26px] border border-zinc-200 bg-white p-4 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="truncate text-lg font-semibold text-zinc-950">
                    {[item.brand, item.model].filter(Boolean).join(" ") || "—"}
                  </h2>
                  <p className="mt-1 text-sm text-zinc-500">
                    {item.production_year ?? "—"} • {item.location ?? "—"}
                  </p>
                </div>

                <span
                  className={`shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-medium ${statusClass(
                    item.status
                  )}`}
                >
                  {STATUS_LABEL[item.status ?? ""] ?? item.status ?? "—"}
                </span>
              </div>

              <div className="mt-3 rounded-[22px] bg-zinc-950 px-4 py-3 text-white">
                <div className="text-[11px] uppercase tracking-[0.16em] text-white/55">
                  Цена
                </div>
                <div className="mt-1 text-2xl font-semibold leading-none">
                  {item.price_with_vat
                    ? Number(item.price_with_vat).toLocaleString("ru-RU")
                    : "—"}
                </div>
                <div className="mt-1 text-sm text-white/60">
                  {item.contract_currency ?? "Без валюты"}
                </div>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2">
                <InfoCell label="External ID" value={item.external_id} />
                <InfoCell label="Serial number" value={item.serial_number} />
                <InfoCell label="Arrival date" value={item.arrival_date} />
                <InfoCell
                  label="Warranty / Currency"
                  value={[item.warranty, item.contract_currency]
                    .filter(Boolean)
                    .join(" / ")}
                />
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleAddCompare(item)}
                  className="min-h-11 rounded-2xl border border-zinc-300 px-4 text-sm font-medium text-zinc-950 transition active:scale-[0.99]"
                >
                  + Сравнить
                </button>

                {isUrl(item.specification) ? (
                  <a
                    href={item.specification ?? undefined}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-zinc-300 px-4 text-sm font-medium text-zinc-950"
                  >
                    Спецификация
                  </a>
                ) : (
                  <div className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-zinc-200 px-4 text-sm text-zinc-400">
                    Нет ссылки
                  </div>
                )}
              </div>
            </article>
          ))}
        </div>
      </div>
    </main>
  );
}

function FilterPill({
  active,
  onClick,
  label,
  activeClassName,
  idleClassName,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  activeClassName: string;
  idleClassName: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full px-3 py-2 text-xs whitespace-nowrap transition ${active ? activeClassName : idleClassName}`}
    >
      {label}
    </button>
  );
}

function InfoCell({
  label,
  value,
}: {
  label: string;
  value?: string | number | null;
}) {
  const text =
    typeof value === "number" ? String(value) : value?.trim() ? value : "—";

  return (
    <div className="rounded-[18px] bg-zinc-100 px-3 py-2.5">
      <div className="text-[10px] uppercase tracking-[0.14em] text-zinc-500">
        {label}
      </div>
      <div className="mt-1 text-sm font-medium leading-5 text-zinc-900">
        {text}
      </div>
    </div>
  );
}
