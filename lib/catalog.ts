import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { rrcPrice } from "@/app/lib/pricing";

const inventoryFields = "id,brand,model,configuration,production_year,location,status,status_priority,external_id,serial_number,arrival_date,contract_currency,price_with_vat,specification,warranty";
const spotFields = "id,external_id,brand,type,model,production_year,status,contract_currency,price_with_vat,delivery_terms,delivery,specification";

export async function catalogResponse(source: "inventory" | "spot") {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) throw new Error("Catalog configuration is missing");
    const client = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const signal = AbortSignal.timeout(10_000);
    const query = source === "inventory"
      ? client.from("inventory").select(inventoryFields).eq("is_active", true).order("status_priority")
      : client.from("cnhi_spot").select(spotFields).eq("is_active", true).order("brand").order("model");
    const [equipment, photos, brochures] = await Promise.all([
      query.abortSignal(signal),
      source === "inventory"
        ? client.from("equipment_photos").select("configuration,public_url,sort_order").order("sort_order").abortSignal(signal)
        : Promise.resolve({ data: [], error: null }),
      source === "inventory"
        ? client.from("equipment_brochures").select("model_key,file_name,public_url").abortSignal(signal)
        : Promise.resolve({ data: [], error: null }),
    ]);
    if (equipment.error || photos.error || brochures.error) {
      throw new Error("Catalog query failed");
    }
    const items = (equipment.data ?? []).map((item) => {
      const { price_with_vat, ...publicFields } = item;
      return { ...publicFields, rrc_with_vat: rrcPrice(price_with_vat) };
    });
    return NextResponse.json(
      { items, photos: photos.data, brochures: brochures.data },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch {
    console.error("Catalog unavailable", source);
    return NextResponse.json(
      { error: "Не удалось загрузить каталог. Попробуйте ещё раз." },
      { status: 503, headers: { "Cache-Control": "no-store" } }
    );
  }
}
