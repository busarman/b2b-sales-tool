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

function statusClass() {
  return "bg-amber-100 text-amber-800 border-amber-300";
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
    <main className="min-h-dvh bg-zinc-100 pb-10">
      <div className="sticky top-0 z-20 bg-zinc-950 text-white shadow-sm">
        <div className="mx-auto max-w-md px-4 pb-4 pt-5">
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="text-[11px] uppercase tracking-[0.18em] text-white/50">
                B2B SALES TOOL
              </div>

              <h1 className="mt-1 text-2xl font-semibold">
                Техника CNHi SPOT
              </h1>

              <p className="text-sm text-white/60">
                Глобально доступные позиции для дилеров
              </p>
            </div>

            <Link
              href="/"
              className="rounded-full border border-white/20 px-3 py-1.5 text-xs"
            >
              Главная
            </Link>
          </div>

          <div className="mt-4 rounded-2xl border border-amber-300/20 bg-amber-400/10 p-3 text-sm leading-5 text-amber-100">
            Важно: это глобальный SPOT-сток. Позиции доступны для разных рынков
            и могут быть проданы до момента подтверждения.
          </div>

          <div className="mt-4">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Поиск: бренд / модель / ID / delivery"
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
                      {item.type ?? "—"} • {item.production_year ?? "—"}
                    </div>
                  </div>

                  <div
                    className={`shrink-0 rounded-full border px-3 py-1 text-xs font-medium ${statusClass()}`}
                  >
                    {statusLabel(item.status)}
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
                <Info label="Delivery terms" value={item.delivery_terms} />
                <Info label="Срок поставки" value={item.delivery} />

                <div className="grid grid-cols-2 gap-3">
                  <Info label="Тип" value={item.type} />
                  <Info label="Год" value={item.production_year} />
                </div>

                <div className="grid grid-cols-2 gap-3">
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

                  <div className="rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3 text-center text-sm font-medium text-amber-800">
                    SPOT
                  </div>
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