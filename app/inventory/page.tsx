"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import BottomNav from "../components/bottom-nav";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type InventoryItem = {
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
};

function statusLabel(status?: string | null) {
  const s = (status ?? "").toLowerCase();
  if (s === "in_stock") return "На складе";
  if (s === "in_transit") return "В пути";
  if (s === "reserved") return "Резерв";
  if (s === "sold") return "Продано";
  return status ?? "—";
}

function statusClass(status?: string | null) {
  const s = (status ?? "").toLowerCase();
  if (s === "in_stock") return "bg-emerald-100 text-emerald-800 border-emerald-300";
  if (s === "in_transit") return "bg-amber-100 text-amber-800 border-amber-300";
  if (s === "reserved") return "bg-sky-100 text-sky-800 border-sky-300";
  if (s === "sold") return "bg-zinc-200 text-zinc-700 border-zinc-300";
  return "bg-zinc-100 text-zinc-700 border-zinc-300";
}

function isUrl(value?: string | null) {
  if (!value) return false;
  return value.startsWith("http://") || value.startsWith("https://");
}

export default function InventoryPage() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from("inventory")
        .select("*")
        .order("created_at", { ascending: false });

      setItems((data ?? []) as InventoryItem[]);
      setLoading(false);
    }

    load();
  }, []);

  return (
    <main className="min-h-dvh bg-zinc-100 pb-24 text-zinc-950">
      <div className="sticky top-0 z-20 bg-zinc-950 text-white shadow-sm">
        <div className="mx-auto max-w-md px-4 pb-4 pt-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-xs uppercase tracking-[0.18em] text-white/50">
                B2B SALES TOOL
              </div>
              <h1 className="mt-1 text-2xl font-semibold text-white">
                Наличие техники
              </h1>
              <p className="mt-1 text-sm text-white/70">
                Актуальное наличие для дилеров
              </p>
            </div>

            <Link
              href="/"
              className="rounded-full border border-white/20 px-3 py-1.5 text-xs text-white"
            >
              На главную
            </Link>
          </div>

          <div className="mt-4">
            <input
              placeholder="Поиск по модели, serial, ID"
              className="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-white placeholder:text-white/40 outline-none"
            />
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-md px-4 py-4">
        {loading ? (
          <div className="rounded-3xl bg-white p-4 text-zinc-700 shadow-sm ring-1 ring-zinc-200">
            Загрузка...
          </div>
        ) : (
          <div className="space-y-4">
            {items.map((item) => (
              <div
                key={item.id}
                className="rounded-[28px] bg-white shadow-sm ring-1 ring-zinc-200"
              >
                <div className="border-b border-zinc-200 px-4 py-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="truncate text-[22px] font-semibold text-zinc-950">
                        {item.brand} {item.model}
                      </div>
                      <div className="mt-1 text-sm font-medium text-zinc-600">
                        {item.production_year ?? "—"} • {item.location ?? "—"}
                      </div>
                    </div>

                    <div
                      className={`shrink-0 rounded-full border px-3 py-1 text-xs font-semibold ${statusClass(
                        item.status
                      )}`}
                    >
                      {statusLabel(item.status)}
                    </div>
                  </div>
                </div>

                <div className="space-y-3 px-4 py-4">
                  <Info label="External ID" value={item.external_id} />
                  <Info label="Serial number" value={item.serial_number} />
                  <Info label="Поступление" value={item.arrival_date} />

                  <div className="rounded-2xl bg-zinc-950 p-4 text-white">
                    <div className="text-xs uppercase tracking-[0.14em] text-white/60">
                      Цена с НДС
                    </div>
                    <div className="mt-2 text-[22px] font-semibold">
                      {item.price_with_vat
                        ? Number(item.price_with_vat).toLocaleString("ru-RU")
                        : "—"}
                    </div>
                    <div className="mt-1 text-sm text-white/70">
                      {item.contract_currency ?? ""}
                    </div>
                  </div>

                  {item.specification && isUrl(item.specification) && (
                    <a
                      href={item.specification}
                      target="_blank"
                      rel="noreferrer"
                      className="block rounded-2xl border border-zinc-300 bg-white px-4 py-3 text-center text-sm font-medium text-zinc-900"
                    >
                      Открыть спецификацию
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <BottomNav />
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
      <div className="text-xs font-medium uppercase tracking-[0.12em] text-zinc-500">
        {label}
      </div>
      <div className="mt-1 text-sm font-semibold text-zinc-900">
        {value ?? "—"}
      </div>
    </div>
  );
}