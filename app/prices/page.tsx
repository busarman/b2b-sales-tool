"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type SpotItem = {
  id: number;
  external_id?: string | null;
  brand?: string | null;
  type?: string | null;
  model?: string | null;
  production_year?: number | null;
  status?: string | null;
  contract_currency?: string | null;
  price_with_vat?: number | null;
  delivery_terms?: string | null;
  delivery?: string | null;
  specification?: string | null;
};

function isUrl(value?: string | null) {
  if (!value) return false;
  return value.startsWith("http://") || value.startsWith("https://");
}

function statusLabel(status?: string | null) {
  if (!status) return "SPOT";
  if (status === "Stock_CNH_Europe") return "CNH Europe";
  return status;
}

export default function CnhiSpotPage() {
  const [items, setItems] = useState<SpotItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [brand, setBrand] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function load() {
      const { data, error } = await supabase
        .from("cnhi_spot")
        .select("*")
        .order("brand", { ascending: true })
        .order("model", { ascending: true });

      if (error) {
        console.error(error);
        setItems([]);
      } else {
        setItems((data ?? []) as SpotItem[]);
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
    const q = search.trim().toLowerCase();

    return items.filter((item) => {
      const brandOk = !brand || item.brand === brand;

      const searchOk =
        !q ||
        [
          item.brand,
          item.type,
          item.model,
          item.external_id,
          item.delivery_terms,
          item.delivery,
        ]
          .filter(Boolean)
          .some((v) => String(v).toLowerCase().includes(q));

      return brandOk && searchOk;
    });
  }, [items, brand, search]);

  return (
    <main className="min-h-dvh bg-zinc-100 pb-8">
      <header className="sticky top-0 z-20 border-b border-white/10 bg-zinc-950 text-white shadow-sm">
        <div className="mx-auto max-w-md px-4 pb-3 pt-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="text-[10px] uppercase tracking-[0.22em] text-white/45">
                B2B SALES TOOL
              </div>
              <h1 className="mt-1 text-xl font-semibold">Техника CNHi SPOT</h1>
              <p className="mt-1 text-xs text-white/60">
                Глобальный SPOT-сток для быстрых проверок
              </p>
            </div>

            <Link
              href="/"
              className="inline-flex min-h-9 shrink-0 items-center rounded-full border border-white/15 px-3 text-xs text-white/90"
            >
              Главная
            </Link>
          </div>

          <div className="mt-3 rounded-[22px] border border-amber-300/25 bg-amber-400/10 px-4 py-3 text-sm leading-5 text-amber-100">
            Важно: это глобальный SPOT-сток. Позиции доступны для разных рынков
            и могут быть проданы до момента подтверждения.
          </div>

          <div className="mt-3">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Поиск: бренд / модель / ID / delivery"
              className="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-white outline-none placeholder:text-white/35"
            />
          </div>

          <div className="mt-3 -mx-4 overflow-x-auto px-4 [scrollbar-width:none]">
            <div className="flex w-max gap-2 pb-1">
              <BrandPill
                active={brand === ""}
                onClick={() => setBrand("")}
                label="Все бренды"
              />
              {brands.map((b) => (
                <BrandPill
                  key={b}
                  active={brand === b}
                  onClick={() => setBrand(b)}
                  label={b}
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
                    {item.type ?? "—"} • {item.production_year ?? "—"}
                  </p>
                </div>

                <span className="shrink-0 rounded-full border border-amber-300 bg-amber-100 px-2.5 py-1 text-[11px] font-medium text-amber-800">
                  {statusLabel(item.status)}
                </span>
              </div>

              <div className="mt-3 rounded-[22px] border border-amber-300/30 bg-zinc-950 px-4 py-3 text-white">
                <div className="text-[11px] uppercase tracking-[0.16em] text-amber-200/70">
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
                <InfoCell label="Delivery terms" value={item.delivery_terms} />
                <InfoCell label="Delivery" value={item.delivery} />
                <InfoCell
                  label="Type / Year"
                  value={[item.type, item.production_year ? String(item.production_year) : null]
                    .filter(Boolean)
                    .join(" / ")}
                />
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2">
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

                <div className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-amber-300 bg-amber-50 px-4 text-sm font-medium text-amber-800">
                  SPOT
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </main>
  );
}

function BrandPill({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full px-3 py-2 text-xs whitespace-nowrap transition ${
        active ? "bg-white text-zinc-950" : "bg-white/10 text-white/75"
      }`}
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
