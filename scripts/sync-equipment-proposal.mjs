import fs from "node:fs/promises";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

const bucket = "equipment-proposals";

function required(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing environment variable: ${name}`);
  return value;
}

function safeFileName(value) {
  return value.replace(/[\\/:*?"<>|]+/g, "_");
}

async function main() {
  const inventoryId = required("PROPOSAL_INVENTORY_ID");
  const sourceFile = path.resolve(required("PROPOSAL_FILE"));
  const client = createClient(
    required("NEXT_PUBLIC_SUPABASE_URL"),
    required("SUPABASE_SERVICE_ROLE_KEY"),
    { auth: { persistSession: false, autoRefreshToken: false } }
  );

  const { data: item, error: itemError } = await client
    .from("inventory")
    .select("id,model,configuration,external_id,serial_number")
    .eq("id", inventoryId)
    .single();
  if (itemError) throw itemError;

  const contents = await fs.readFile(sourceFile);
  const configuration = item.configuration ?? item.model ?? "equipment";
  const downloadName = safeFileName(
    `Коммерческое предложение ${configuration} ${item.external_id ?? item.serial_number ?? inventoryId}.docx`
  );
  // Storage object keys stay ASCII-only for predictable public URLs.
  // The human-readable Cyrillic filename is stored separately in the table.
  const storagePath = `${inventoryId}/commercial-proposal.docx`;

  const { data: current } = await client
    .from("equipment_proposals")
    .select("storage_path")
    .eq("inventory_id", inventoryId)
    .maybeSingle();
  if (current?.storage_path && current.storage_path !== storagePath) {
    const { error } = await client.storage.from(bucket).remove([current.storage_path]);
    if (error) throw error;
  }

  const { error: uploadError } = await client.storage
    .from(bucket)
    .upload(storagePath, contents, {
      contentType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      cacheControl: "3600",
      upsert: true,
    });
  if (uploadError) throw uploadError;

  const publicUrl = client.storage.from(bucket).getPublicUrl(storagePath).data.publicUrl;
  const { error: recordError } = await client.from("equipment_proposals").upsert(
    {
      inventory_id: inventoryId,
      configuration,
      file_name: downloadName,
      storage_path: storagePath,
      public_url: publicUrl,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "inventory_id" }
  );
  if (recordError) throw recordError;

  console.log(`Proposal uploaded for ${configuration} (${item.external_id ?? inventoryId})`);
}

main();
