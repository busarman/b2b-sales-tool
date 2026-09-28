import fs from "node:fs/promises";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

const outputDir = "/Users/antonsoshnev/Documents/Codex/2026-09-22/referenced-chatgpt-conversation-this-is-an/outputs";
const bucket = "equipment-proposals";
const documents = new Map([
  ["3020 FLEX", "Commercial_proposal_Case_IH_3020_Flex.docx"],
  ["40ft + 2355 TBT", "Commercial_proposal_Case_IH_Precision_Disk_500_и_Precision_Air_2355.docx"],
  ["CX6.90", "Commercial_proposal_New_Holland_CX6.90.docx"],
  ["CX8.80", "Коммерческое_предложение_New_Holland_CX8_80_новый_эталон.docx"],
  ["Magnum 355", "Commercial_proposal_Case_IH_Magnum_355.docx"],
  ["T7.260", "Commercial_proposal_New_Holland_T7.260_Classic.docx"],
  ["T7.260 с ПНУ+ПВОМ", "Commercial_proposal_New_Holland_T7.260_Classic_с_ПНУ_и_ПВОМ.docx"],
  ["T8.435", "Коммерческое_предложение_New_Holland_T8_435_новый_эталон.docx"],
]);

function required(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing environment variable ${name}`);
  return value;
}

function safeFileName(value) {
  return value.replace(/[\\/:*?"<>|]+/g, "_");
}

const client = createClient(
  required("NEXT_PUBLIC_SUPABASE_URL"),
  required("SUPABASE_SERVICE_ROLE_KEY"),
  { auth: { persistSession: false, autoRefreshToken: false } }
);

const { data: inventory, error: inventoryError } = await client
  .from("inventory")
  .select("id,external_id,model,configuration,is_active")
  .eq("is_active", true);
if (inventoryError) throw inventoryError;

const targets = inventory.filter((item) => documents.has(item.configuration));
const results = [];
for (const item of targets) {
  const sourceName = documents.get(item.configuration);
  const sourcePath = path.join(outputDir, sourceName);
  const contents = await fs.readFile(sourcePath);
  const storagePath = `${item.id}/commercial-proposal.docx`;
  const fileName = safeFileName(
    `Коммерческое предложение ${item.configuration} ${item.external_id}.docx`
  );
  const { error: uploadError } = await client.storage
    .from(bucket)
    .upload(storagePath, contents, {
      contentType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      cacheControl: "3600",
      upsert: true,
    });
  if (uploadError) throw new Error(`${item.external_id}: ${uploadError.message}`);
  const publicUrl = client.storage.from(bucket).getPublicUrl(storagePath).data.publicUrl;
  const { error: recordError } = await client.from("equipment_proposals").upsert(
    {
      inventory_id: item.id,
      configuration: item.configuration,
      file_name: fileName,
      storage_path: storagePath,
      public_url: publicUrl,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "inventory_id" }
  );
  if (recordError) throw new Error(`${item.external_id}: ${recordError.message}`);
  results.push({ id: item.external_id, configuration: item.configuration });
}

const byConfiguration = Object.fromEntries(
  [...documents.keys()].map((configuration) => [
    configuration,
    results.filter((item) => item.configuration === configuration).length,
  ])
);
console.log(JSON.stringify({ uploaded: results.length, byConfiguration }, null, 2));
