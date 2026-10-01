"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import {
  COMPARE_STORAGE_EVENT,
  addCompareItem,
  getCompareCount,
  type CompareItem,
} from "../lib/compare-storage";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  }
);

type Item = {
  id: string;
  brand?: string | null;
  model?: string | null;
  configuration?: string | null;
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

type EquipmentPhoto = {
  configuration: string;
  public_url: string;
  sort_order: number;
};

type EquipmentBrochure = {
  model_key: string;
  file_name: string;
  public_url: string;
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

function equipmentModelKey(value?: string | null) {
  return (value ?? "").toUpperCase().replace(/[^A-ZА-ЯЁ0-9]/g, "");
}

function uindWarrantyPrice(item: Item) {
  const equipmentName = `${item.model ?? ""} ${item.configuration ?? ""}`
    .toUpperCase()
    .replace(/[^A-ZА-ЯЁ0-9]/g, "");

  if (equipmentName.includes("T7260")) return 549_000;
  if (equipmentName.includes("MAGNUM")) return 854_000;
  if (equipmentName.includes("STEIGER")) return 1_464_000;
  if (equipmentName.includes("CX690")) return 854_000;
  if (equipmentName.includes("CR790")) return 976_000;
  if (equipmentName.includes("CX870") || equipmentName.includes("CX880")) return 976_000;
  if (equipmentName.includes("CR990") || equipmentName.includes("CR1090")) return 1_464_000;
  if (equipmentName.includes("AF8260")) return 1_464_000;
  if (equipmentName.includes("AF6160")) return 976_000;

  return null;
}

export default function InventoryPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [photos, setPhotos] = useState<EquipmentPhoto[]>([]);
  const [brochures, setBrochures] = useState<EquipmentBrochure[]>([]);
  const [gallery, setGallery] = useState<{
    configuration: string;
    urls: string[];
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [brand, setBrand] = useState("");
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [compareCount, setCompareCount] = useState(() => getCompareCount());
  const [reservationItem, setReservationItem] = useState<Item | null>(null);
  const [buyerInn, setBuyerInn] = useState("");
  const [retailPrice, setRetailPrice] = useState("");
  const [dealerCompany, setDealerCompany] = useState("");
  const [dealerPhone, setDealerPhone] = useState("");
  const [dealerName, setDealerName] = useState("");
  const [reservationSubmitting, setReservationSubmitting] = useState(false);
  const [reservationError, setReservationError] = useState("");
  const [reservationSuccess, setReservationSuccess] = useState("");
  const [reservationRequestKey, setReservationRequestKey] = useState("");

  useEffect(() => {
    async function load() {
      let query = supabase
        .from("inventory")
        .select("*");

      if (process.env.NEXT_PUBLIC_STOCK_SYNC_ACTIVE === "true") {
        query = query.eq("is_active", true);
      }

      const { data, error } = await query.order("status_priority", { ascending: true });

      if (error) {
        console.error(error);
        setItems([]);
      } else {
        setItems((data ?? []) as Item[]);
      }

      const { data: photoData, error: photoError } = await supabase
        .from("equipment_photos")
        .select("configuration,public_url,sort_order")
        .order("sort_order", { ascending: true });

      if (photoError) {
        console.error(photoError);
        setPhotos([]);
      } else {
        setPhotos((photoData ?? []) as EquipmentPhoto[]);
      }

      const { data: brochureData, error: brochureError } = await supabase
        .from("equipment_brochures")
        .select("model_key,file_name,public_url");

      if (brochureError) {
        console.error(brochureError);
        setBrochures([]);
      } else {
        setBrochures((brochureData ?? []) as EquipmentBrochure[]);
      }

      setLoading(false);
    }

    load();
  }, []);

  useEffect(() => {
    function syncCompareCount() {
      setCompareCount(getCompareCount());
    }

    window.addEventListener("storage", syncCompareCount);
    window.addEventListener(COMPARE_STORAGE_EVENT, syncCompareCount);

    return () => {
      window.removeEventListener("storage", syncCompareCount);
      window.removeEventListener(COMPARE_STORAGE_EVENT, syncCompareCount);
    };
  }, []);

  const brands = useMemo(() => {
    const values = Array.from(
      new Set(
        items
          .map((item) => item.brand?.trim())
          .filter((value): value is string => Boolean(value))
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
        [i.brand, i.model, i.configuration, i.serial_number, i.external_id]
          .filter(Boolean)
          .some((v) => String(v).toLowerCase().includes(q));

      return brandOk && statusOk && searchOk;
    });
  }, [items, brand, status, search]);

  const photosByConfiguration = useMemo(() => {
    const result = new Map<string, string[]>();
    for (const photo of photos) {
      const current = result.get(photo.configuration) ?? [];
      current.push(photo.public_url);
      result.set(photo.configuration, current);
    }
    return result;
  }, [photos]);

  const brochuresByModel = useMemo(
    () => new Map(brochures.map((brochure) => [brochure.model_key, brochure])),
    [brochures]
  );

  function handleAddCompare(item: Item) {
    const result = addCompareItem(toCompareItem(item));

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

  function openReservation(item: Item) {
    setReservationItem(item);
    setBuyerInn("");
    setRetailPrice("");
    setDealerCompany("");
    setDealerPhone("");
    setDealerName("");
    setReservationError("");
    setReservationSuccess("");
    setReservationRequestKey(crypto.randomUUID());
  }

  function closeReservation() {
    if (reservationSubmitting) return;
    setReservationItem(null);
    setReservationError("");
    setReservationSuccess("");
  }

  async function handleReservationSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!reservationItem || reservationSubmitting) return;

    setReservationSubmitting(true);
    setReservationError("");
    setReservationSuccess("");

    try {
      const response = await fetch("/api/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          inventoryId: reservationItem.id,
          buyerInn,
          retailPrice,
          dealerCompany,
          dealerPhone,
          dealerName,
          requestKey: reservationRequestKey,
        }),
      });
      const result = (await response.json()) as {
        ok?: boolean;
        error?: string;
        requestId?: string;
      };

      if (!response.ok || !result.ok) {
        throw new Error(result.error ?? "Не удалось отправить запрос");
      }

      setReservationSuccess(
        `Запрос отправлен. Номер заявки: ${result.requestId ?? "создан"}`
      );
    } catch (error) {
      setReservationError(
        error instanceof Error ? error.message : "Не удалось отправить запрос"
      );
    } finally {
      setReservationSubmitting(false);
    }
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
              placeholder="Поиск: модель / конфигурация / serial / ID"
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
                label="Все группы"
                activeClassName="bg-white text-zinc-950"
                idleClassName="bg-white/10 text-white/75"
              />
              {brands.map((value) => (
                <FilterPill
                  key={value}
                  active={brand === value}
                  onClick={() => setBrand(value)}
                  label={value}
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
          {filtered.map((item) => {
            const warrantyPrice = uindWarrantyPrice(item);
            const brochure =
              brochuresByModel.get(equipmentModelKey(item.model)) ??
              brochuresByModel.get(equipmentModelKey(item.configuration));

            return (
            <article
              key={item.id}
              className="rounded-[26px] border border-zinc-200 bg-white p-4 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="truncate text-lg font-semibold text-zinc-950">
                    {item.model || "—"}
                  </h2>
                  <p className="mt-1 text-sm text-zinc-500">
                    {item.configuration ?? "Конфигурация не указана"}
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
                <div className={warrantyPrice ? "grid grid-cols-2 gap-4" : ""}>
                  <div className="min-w-0">
                    <div className="text-[11px] uppercase tracking-[0.16em] text-white/55">
                      Цена с НДС
                    </div>
                    <div className="mt-1 text-2xl font-semibold leading-none">
                      {item.price_with_vat
                        ? Math.round(Number(item.price_with_vat)).toLocaleString("ru-RU", {
                            maximumFractionDigits: 0,
                          })
                        : "—"}
                    </div>
                    <div className="mt-1 text-sm text-white/60">
                      {item.contract_currency ?? "Без валюты"}
                    </div>
                  </div>

                  {warrantyPrice && (
                    <div className="min-w-0 border-l border-white/15 pl-4">
                      <div className="text-[11px] uppercase tracking-[0.12em] text-amber-300">
                        Гарантия от ЮИ
                      </div>
                      <div className="mt-1 text-lg font-semibold leading-none text-white">
                        +{warrantyPrice.toLocaleString("ru-RU")} ₽
                      </div>
                      <div className="mt-1 text-[11px] leading-4 text-white/60">
                        с НДС · приобретается дополнительно
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2">
                <InfoCell label="ID" value={item.external_id} />
                <InfoCell label="Serial number" value={item.serial_number} />
                <InfoCell label="Год производства" value={item.production_year} />
                <InfoCell label="Срок поступления на склад" value={item.arrival_date} />
                <InfoCell label="Статус техники" value={STATUS_LABEL[item.status ?? ""] ?? item.status} />
                <InfoCell label="Валюта" value={item.contract_currency} />
                <InfoCell label="Конфигурация" value={item.configuration} wide />
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

                {(photosByConfiguration.get(item.configuration ?? "")?.length ?? 0) > 0 && (
                  <button
                    type="button"
                    onClick={() =>
                      setGallery({
                        configuration: item.configuration ?? item.model ?? "Фото",
                        urls: photosByConfiguration.get(item.configuration ?? "") ?? [],
                      })
                    }
                    className="col-span-2 min-h-11 rounded-2xl bg-zinc-950 px-4 text-sm font-medium text-white transition active:scale-[0.99]"
                  >
                    Фото ({photosByConfiguration.get(item.configuration ?? "")?.length ?? 0})
                  </button>
                )}

                {brochure && (
                  <a
                    href={brochure.public_url}
                    target="_blank"
                    rel="noreferrer"
                    className="col-span-2 inline-flex min-h-11 items-center justify-center rounded-2xl bg-blue-700 px-4 text-sm font-medium text-white transition active:scale-[0.99] disabled:cursor-wait disabled:bg-blue-400"
                  >
                    Скачать брошюру
                  </a>
                )}

                <button
                  type="button"
                  onClick={() => openReservation(item)}
                  className="col-span-2 inline-flex min-h-11 items-center justify-center rounded-2xl bg-amber-400 px-4 text-sm font-semibold text-zinc-950 transition active:scale-[0.99]"
                >
                  Резерв
                </button>
              </div>
            </article>
            );
          })}
        </div>
      </div>

      {gallery && (
        <div className="fixed inset-0 z-50 bg-zinc-950/95 text-white">
          <div className="mx-auto flex h-full max-w-md flex-col">
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
              <div>
                <div className="font-semibold">{gallery.configuration}</div>
                <div className="text-xs text-white/55">{gallery.urls.length} фото</div>
              </div>
              <button
                type="button"
                onClick={() => setGallery(null)}
                className="rounded-full border border-white/20 px-4 py-2 text-sm"
              >
                Закрыть
              </button>
            </div>

            <div className="flex-1 snap-y snap-mandatory overflow-y-auto p-3">
              <div className="space-y-3">
                {gallery.urls.map((url, index) => (
                  <div key={url} className="snap-start overflow-hidden rounded-2xl bg-black">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={url}
                      alt={`${gallery.configuration}, фото ${index + 1}`}
                      loading={index === 0 ? "eager" : "lazy"}
                      className="h-auto w-full object-contain"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {reservationItem && (
        <div className="fixed inset-0 z-50 flex items-end bg-zinc-950/70 sm:items-center">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="reservation-title"
            className="mx-auto w-full max-w-md rounded-t-[30px] bg-white p-5 shadow-2xl sm:rounded-[30px]"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="text-[10px] uppercase tracking-[0.18em] text-zinc-500">
                  Запрос на резерв
                </div>
                <h2 id="reservation-title" className="mt-1 text-xl font-semibold text-zinc-950">
                  {reservationItem.model ?? "Техника"}
                </h2>
                <p className="mt-1 text-sm text-zinc-500">
                  {[reservationItem.configuration, reservationItem.external_id]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              </div>
              <button
                type="button"
                onClick={closeReservation}
                disabled={reservationSubmitting}
                className="rounded-full border border-zinc-200 px-3 py-2 text-sm text-zinc-700 disabled:opacity-50"
              >
                Закрыть
              </button>
            </div>

            {reservationSuccess ? (
              <div className="mt-5">
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-4 text-sm leading-5 text-emerald-800">
                  {reservationSuccess}
                </div>
                <button
                  type="button"
                  onClick={closeReservation}
                  className="mt-4 min-h-12 w-full rounded-2xl bg-zinc-950 px-4 text-sm font-semibold text-white"
                >
                  Готово
                </button>
              </div>
            ) : (
              <form onSubmit={handleReservationSubmit} className="mt-5 space-y-4">
                <label className="block">
                  <span className="text-sm font-medium text-zinc-900">ИНН покупателя</span>
                  <input
                    value={buyerInn}
                    onChange={(event) => setBuyerInn(event.target.value.replace(/\D/g, "").slice(0, 12))}
                    inputMode="numeric"
                    autoComplete="off"
                    placeholder="10 или 12 цифр"
                    required
                    minLength={10}
                    maxLength={12}
                    className="mt-2 w-full rounded-2xl border border-zinc-300 px-4 py-3 text-base text-zinc-950 outline-none focus:border-zinc-950"
                  />
                </label>

                <label className="block">
                  <span className="text-sm font-medium text-zinc-900">Розничная стоимость</span>
                  <div className="mt-2 flex items-center rounded-2xl border border-zinc-300 bg-white focus-within:border-zinc-950">
                    <input
                      value={retailPrice}
                      onChange={(event) => setRetailPrice(event.target.value)}
                      inputMode="decimal"
                      autoComplete="off"
                      placeholder="Например, 21 500 000"
                      required
                      className="min-w-0 flex-1 rounded-2xl px-4 py-3 text-base text-zinc-950 outline-none"
                    />
                    <span className="pr-4 text-sm font-medium text-zinc-500">
                      {reservationItem.contract_currency ?? "RUB"}
                    </span>
                  </div>
                </label>

                <label className="block">
                  <span className="text-sm font-medium text-zinc-900">Наименование дилера</span>
                  <input
                    value={dealerCompany}
                    onChange={(event) => setDealerCompany(event.target.value)}
                    autoComplete="organization"
                    placeholder="Название компании"
                    required
                    maxLength={200}
                    className="mt-2 w-full rounded-2xl border border-zinc-300 px-4 py-3 text-base text-zinc-950 outline-none focus:border-zinc-950"
                  />
                </label>

                <label className="block">
                  <span className="text-sm font-medium text-zinc-900">Телефон дилера</span>
                  <input
                    value={dealerPhone}
                    onChange={(event) => setDealerPhone(event.target.value)}
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    placeholder="+7 900 000-00-00"
                    required
                    maxLength={30}
                    className="mt-2 w-full rounded-2xl border border-zinc-300 px-4 py-3 text-base text-zinc-950 outline-none focus:border-zinc-950"
                  />
                </label>

                <label className="block">
                  <span className="text-sm font-medium text-zinc-900">Имя дилера</span>
                  <input
                    value={dealerName}
                    onChange={(event) => setDealerName(event.target.value)}
                    autoComplete="name"
                    placeholder="Имя контактного лица"
                    required
                    maxLength={150}
                    className="mt-2 w-full rounded-2xl border border-zinc-300 px-4 py-3 text-base text-zinc-950 outline-none focus:border-zinc-950"
                  />
                </label>

                {reservationError && (
                  <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {reservationError}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={reservationSubmitting}
                  className="min-h-12 w-full rounded-2xl bg-amber-400 px-4 text-sm font-semibold text-zinc-950 transition active:scale-[0.99] disabled:cursor-wait disabled:bg-amber-200"
                >
                  {reservationSubmitting ? "Отправляю запрос…" : "Отправить запрос на резерв"}
                </button>
                <p className="text-center text-xs leading-4 text-zinc-500">
                  Запрос будет сохранён в B2B Portal и отправлен ответственному сотруднику.
                </p>
              </form>
            )}
          </div>
        </div>
      )}
    </main>
  );
}

function toCompareItem(item: Item): CompareItem {
  return {
    id: item.id,
    source: "inventory",
    brand: item.brand ?? null,
    model: item.model ?? null,
    configuration: item.configuration ?? null,
    type: null,
    production_year: item.production_year ?? null,
    status: item.status ?? null,
    location: item.location ?? null,
    price_with_vat: item.price_with_vat ?? null,
    contract_currency: item.contract_currency ?? null,
    specification: item.specification ?? null,
    external_id: item.external_id ?? null,
    serial_number: item.serial_number ?? null,
    arrival_date: item.arrival_date ?? null,
    warranty: item.warranty ?? null,
    delivery_terms: null,
    delivery: null,
  };
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
  wide = false,
}: {
  label: string;
  value?: string | number | null;
  wide?: boolean;
}) {
  const text =
    typeof value === "number" ? String(value) : value?.trim() ? value : "—";

  return (
    <div className={`rounded-[18px] bg-zinc-100 px-3 py-2.5 ${wide ? "col-span-2" : ""}`}>
      <div className="text-[10px] uppercase tracking-[0.14em] text-zinc-500">
        {label}
      </div>
      <div className="mt-1 text-sm font-medium leading-5 text-zinc-900">
        {text}
      </div>
    </div>
  );
}
