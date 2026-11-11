import readExcelFile from "read-excel-file/node";
import { NextRequest, NextResponse } from "next/server";
import { transformStockWorkbook } from "@/lib/stock-sync/transform";
import {
  applyStockSync,
  loadBrandResolver,
  previewStockSync,
  stockSyncClient,
} from "@/lib/stock-sync/supabase";
import { downloadYandexFile, findLatestStockWorkbook } from "@/lib/stock-sync/yandex";
import type { WorkbookSheet } from "@/lib/stock-sync/types";
import { sendSyncAlert } from "@/lib/stock-sync/alert";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function authorized(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return (
    request.headers.get("authorization") === `Bearer ${secret}` ||
    request.headers.get("x-sync-secret") === secret
  );
}

function envNumber(name: string, fallback: number) {
  const parsed = Number(process.env[name]);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export async function GET(request: NextRequest) {
  if (!authorized(request)) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const token = process.env.YANDEX_DISK_OAUTH_TOKEN;
    if (!token) throw new Error("Не задана переменная YANDEX_DISK_OAUTH_TOKEN");

    const publicKey = process.env.YANDEX_DISK_PUBLIC_KEY;
    const directory =
      process.env.YANDEX_DISK_STOCK_PATH ?? (publicKey ? "/CNH" : "disk:/PQ dealers/CNH");
    const vatMultiplier = envNumber("STOCK_VAT_MULTIPLIER", 1.22);
    const latest = await findLatestStockWorkbook(token, directory, publicKey);
    const workbookBuffer = await downloadYandexFile(token, latest.path, publicKey);
    const sheets = (await readExcelFile(workbookBuffer)) as WorkbookSheet[];
    const resolver = await loadBrandResolver();
    const transformed = transformStockWorkbook(sheets, resolver, vatMultiplier);

    if (transformed.issues.length > 0) {
      return NextResponse.json(
        {
          ok: false,
          mode: "validation",
          sourceFile: latest.name,
          inventoryRows: transformed.inventory.length,
          spotRows: transformed.spot.length,
          issues: transformed.issues.slice(0, 100),
        },
        { status: 422 }
      );
    }

    const preview = await previewStockSync(transformed.inventory, transformed.spot);
    const maxRemovalShare = envNumber("STOCK_MAX_REMOVAL_SHARE", 0.5);
    const removalBlocked =
      (preview.inventory.current > 0 &&
        preview.inventory.removed / preview.inventory.current > maxRemovalShare) ||
      (preview.spot.current > 0 &&
        preview.spot.removed / preview.spot.current > maxRemovalShare);

    const apply = process.env.STOCK_SYNC_APPLY === "true";
    if (apply && removalBlocked) {
      return NextResponse.json(
        { ok: false, mode: "safety-block", sourceFile: latest.name, preview },
        { status: 409 }
      );
    }

    const result = apply
      ? await applyStockSync(transformed.inventory, transformed.spot, latest.name)
      : null;

    let prices: Record<string, unknown> = { status: "failed", error: "Price source is not configured" };
    const pricesDirectory = process.env.YANDEX_DISK_PRICES_PATH;
    if (pricesDirectory) {
      try {
        const accessUntil = process.env.YANDEX_PRICES_ACCESS_UNTIL;
        if (accessUntil && (!/^\d{4}-\d{2}-\d{2}$/.test(accessUntil) || new Date().toISOString().slice(0, 10) > accessUntil)) {
          throw new Error("Срок доступа к прайсу истёк: требуется обновить доступ");
        }
        const pricesKey = process.env.YANDEX_DISK_PRICES_PUBLIC_KEY || undefined;
        const priceFile = await findLatestStockWorkbook(token, pricesDirectory, pricesKey, /^PQ PL for dealers_\d{8}\.xlsx$/i);
        const priceBuffer = await downloadYandexFile(token, priceFile.path, pricesKey);
        const priceSheets = (await readExcelFile(priceBuffer)) as WorkbookSheet[];
        const priceRows = transformStockWorkbook(priceSheets, resolver, vatMultiplier);
        if (priceRows.issues.length || [...priceRows.inventory, ...priceRows.spot].some((row) => row.price_with_vat == null || !row.contract_currency)) {
          throw new Error("Прайс не прошёл проверку структуры, идентификации или цен");
        }
        let priceResult = null;
        if (apply) {
          const response = await stockSyncClient().rpc("apply_equipment_price_sync", {
            p_inventory: priceRows.inventory,
            p_spot: priceRows.spot,
            p_source_file: priceFile.name,
          });
          if (response.error) throw new Error(response.error.message);
          priceResult = response.data;
        }
        prices = { status: apply ? "applied" : "preview", sourceFile: priceFile.name, result: priceResult };
      } catch (error) {
        console.error("price sync failed");
        prices = { status: "failed", error: error instanceof Error ? error.message : "Price sync failed" };
      }
    }

    const alert = prices.status === "failed" ? await sendSyncAlert() : null;
    console.info("stock sync complete", JSON.stringify({ sourceFile: latest.name, mode: apply ? "applied" : "preview", priceStatus: prices.status, alert }));
    return NextResponse.json({
      ok: prices.status !== "failed",
      mode: apply ? "applied" : "preview",
      sourceFile: latest.name,
      sourceModifiedAt: latest.modified ?? null,
      sourceSize: latest.size ?? null,
      preview,
      result,
      prices,
      alert,
    }, { status: prices.status === "failed" ? 503 : 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown sync error";
    console.error("stock sync failed", message);
    const alert = await sendSyncAlert();
    return NextResponse.json({ ok: false, error: "Не удалось подтвердить обновление источника", alert }, { status: 503 });
  }
}
