import { createClient } from "@supabase/supabase-js";
import { createHash, randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ReservationPayload = {
  inventoryId?: unknown;
  buyerInn?: unknown;
  retailPrice?: unknown;
  dealerCompany?: unknown;
  dealerPhone?: unknown;
  dealerName?: unknown;
  requestKey?: unknown;
};

type InventoryItem = {
  id: string;
  model: string | null;
  configuration: string | null;
  external_id: string | null;
  serial_number: string | null;
  contract_currency: string | null;
  is_active: boolean | null;
};

function requiredEnv(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`Не задана переменная ${name}`);
  return value;
}

function serverClient() {
  return createClient(
    requiredEnv("NEXT_PUBLIC_SUPABASE_URL"),
    requiredEnv("SUPABASE_SERVICE_ROLE_KEY"),
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
}

function normalizeInn(value: unknown) {
  return String(value ?? "").replace(/\D/g, "");
}

function normalizePrice(value: unknown) {
  const normalized = String(value ?? "")
    .replace(/\s/g, "")
    .replace(",", ".")
    .replace(/[^0-9.]/g, "");
  const price = Number(normalized);
  return Number.isFinite(price) && price > 0 ? Math.round(price * 100) / 100 : null;
}

function normalizeRequiredText(value: unknown) {
  return String(value ?? "").trim().replace(/\s+/g, " ");
}

function normalizePhone(value: unknown) {
  const raw = String(value ?? "").trim();
  const digits = raw.replace(/\D/g, "");
  return raw.startsWith("+") ? `+${digits}` : digits;
}

function requestFingerprint(request: NextRequest) {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const ip = forwarded || request.headers.get("x-real-ip") || "unknown";
  const salt = requiredEnv("RESERVATION_RATE_LIMIT_SALT");
  return createHash("sha256").update(`${salt}:${ip}`).digest("hex");
}

function requestKey(value: unknown) {
  const candidate = typeof value === "string" ? value.trim() : "";
  return /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    candidate
  )
    ? candidate
    : randomUUID();
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatPrice(value: number, currency: string) {
  return `${value.toLocaleString("ru-RU", { maximumFractionDigits: 2 })} ${currency}`;
}

async function sendReservationEmail(
  requestId: string,
  item: InventoryItem,
  buyerInn: string,
  retailPrice: number,
  currency: string,
  dealerCompany: string,
  dealerPhone: string,
  dealerName: string
) {
  const apiKey = requiredEnv("RESEND_API_KEY");
  const to = process.env.RESERVATION_EMAIL_TO ?? "anton.soshnev@uind.ru";
  const from = requiredEnv("RESERVATION_EMAIL_FROM");
  const model = item.model ?? "Модель не указана";
  const subject = `Новый запрос на резерв: ${model} · ${item.external_id ?? item.serial_number ?? requestId}`;
  const rows = [
    ["Модель", model],
    ["Конфигурация", item.configuration ?? "—"],
    ["ID", item.external_id ?? "—"],
    ["Serial number", item.serial_number ?? "—"],
    ["ИНН покупателя", buyerInn],
    ["Розничная стоимость", formatPrice(retailPrice, currency)],
    ["Наименование дилера", dealerCompany],
    ["Телефон дилера", dealerPhone],
    ["Имя дилера", dealerName],
    ["Номер заявки", requestId],
  ];
  const text = ["Новый запрос на резерв из B2B Portal", "", ...rows.map(([k, v]) => `${k}: ${v}`)].join("\n");
  const htmlRows = rows
    .map(
      ([label, value]) =>
        `<tr><td style="padding:8px 12px;color:#71717a;border-bottom:1px solid #e4e4e7">${escapeHtml(label)}</td><td style="padding:8px 12px;font-weight:600;border-bottom:1px solid #e4e4e7">${escapeHtml(value)}</td></tr>`
    )
    .join("");

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [to],
      subject,
      text,
      html: `<div style="font-family:Arial,sans-serif;color:#18181b;max-width:640px"><h1 style="font-size:22px">Новый запрос на резерв</h1><p>Заявка отправлена через портал B2B Sales Tool.</p><table style="width:100%;border-collapse:collapse">${htmlRows}</table></div>`,
    }),
  });

  const result = (await response.json().catch(() => ({}))) as { id?: string; message?: string };
  if (!response.ok || !result.id) {
    throw new Error(result.message ?? `Email API: HTTP ${response.status}`);
  }
  return result.id;
}

export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (origin && origin !== request.nextUrl.origin) {
    return NextResponse.json({ ok: false, error: "Недопустимый источник запроса" }, { status: 403 });
  }

  let payload: ReservationPayload;
  try {
    payload = (await request.json()) as ReservationPayload;
  } catch {
    return NextResponse.json({ ok: false, error: "Некорректный формат запроса" }, { status: 400 });
  }

  const inventoryId = typeof payload.inventoryId === "string" ? payload.inventoryId.trim() : "";
  const buyerInn = normalizeInn(payload.buyerInn);
  const retailPrice = normalizePrice(payload.retailPrice);
  const dealerCompany = normalizeRequiredText(payload.dealerCompany);
  const dealerPhone = normalizePhone(payload.dealerPhone);
  const dealerName = normalizeRequiredText(payload.dealerName);
  const idempotencyKey = requestKey(payload.requestKey);

  if (!inventoryId) {
    return NextResponse.json({ ok: false, error: "Не выбрана техника" }, { status: 400 });
  }
  if (!/^(\d{10}|\d{12})$/.test(buyerInn)) {
    return NextResponse.json({ ok: false, error: "ИНН должен содержать 10 или 12 цифр" }, { status: 400 });
  }
  if (retailPrice == null) {
    return NextResponse.json({ ok: false, error: "Укажите корректную розничную стоимость" }, { status: 400 });
  }
  if (dealerCompany.length < 2 || dealerCompany.length > 200) {
    return NextResponse.json({ ok: false, error: "Укажите наименование дилера" }, { status: 400 });
  }
  if (!/^\+?\d{10,15}$/.test(dealerPhone)) {
    return NextResponse.json({ ok: false, error: "Укажите корректный телефон дилера" }, { status: 400 });
  }
  if (dealerName.length < 2 || dealerName.length > 150) {
    return NextResponse.json({ ok: false, error: "Укажите имя дилера" }, { status: 400 });
  }

  try {
    const client = serverClient();
    const { data: existingRequest, error: existingError } = await client
      .from("reservation_requests")
      .select("id")
      .eq("request_key", idempotencyKey)
      .maybeSingle<{ id: string }>();

    if (existingError) throw new Error(existingError.message);
    if (existingRequest) {
      return NextResponse.json({ ok: true, requestId: existingRequest.id, duplicate: true });
    }

    const fingerprint = requestFingerprint(request);
    const rateWindowStart = new Date(Date.now() - 15 * 60 * 1_000).toISOString();
    const { count: recentCount, error: rateError } = await client
      .from("reservation_requests")
      .select("id", { count: "exact", head: true })
      .eq("requester_fingerprint", fingerprint)
      .gte("created_at", rateWindowStart);

    if (rateError) throw new Error(rateError.message);
    if ((recentCount ?? 0) >= 5) {
      return NextResponse.json(
        { ok: false, error: "Слишком много запросов. Повторите через 15 минут." },
        { status: 429, headers: { "Retry-After": "900" } }
      );
    }

    const { data: item, error: itemError } = await client
      .from("inventory")
      .select("id,model,configuration,external_id,serial_number,contract_currency,is_active")
      .eq("id", inventoryId)
      .eq("is_active", true)
      .maybeSingle<InventoryItem>();

    if (itemError) throw new Error(itemError.message);
    if (!item) {
      return NextResponse.json({ ok: false, error: "Позиция не найдена или уже недоступна" }, { status: 404 });
    }

    const currency = item.contract_currency?.trim() || "RUB";
    const { data: reservation, error: insertError } = await client
      .from("reservation_requests")
      .insert({
        inventory_id: item.id,
        buyer_inn: buyerInn,
        retail_price: retailPrice,
        dealer_company: dealerCompany,
        dealer_phone: dealerPhone,
        dealer_name: dealerName,
        currency,
        model: item.model ?? "—",
        configuration: item.configuration,
        external_id: item.external_id,
        serial_number: item.serial_number,
        request_key: idempotencyKey,
        requester_fingerprint: fingerprint,
      })
      .select("id")
      .single<{ id: string }>();

    if (insertError) throw new Error(insertError.message);

    try {
      const emailId = await sendReservationEmail(
        reservation.id,
        item,
        buyerInn,
        retailPrice,
        currency,
        dealerCompany,
        dealerPhone,
        dealerName
      );
      await client
        .from("reservation_requests")
        .update({ email_status: "sent", email_provider_id: emailId, updated_at: new Date().toISOString() })
        .eq("id", reservation.id);

      return NextResponse.json({ ok: true, requestId: reservation.id });
    } catch (emailError) {
      const message = emailError instanceof Error ? emailError.message : "Ошибка отправки письма";
      await client
        .from("reservation_requests")
        .update({ email_status: "failed", email_error: message.slice(0, 500), updated_at: new Date().toISOString() })
        .eq("id", reservation.id);
      throw emailError;
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Не удалось отправить запрос на резерв";
    console.error("reservation request failed", message);
    return NextResponse.json(
      { ok: false, error: "Не удалось отправить запрос. Попробуйте ещё раз." },
      { status: 500 }
    );
  }
}
