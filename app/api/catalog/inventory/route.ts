import { catalogResponse } from "@/lib/catalog";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function GET() {
  return catalogResponse("inventory");
}
