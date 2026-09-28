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
  const manifestPath = path.resolve(required("PROPOSALS_MANIFEST"));
  const manifest = JSON.parse(await fs.readFile(manifestPath, "utf8"));
  const client = createClient(
    required("NEXT_PUBLIC_SUPABASE_URL"),
    required("SUPABASE_SERVICE_ROLE_KEY"),
    { auth: { persistSession: false, autoRefreshToken: false } }
  );

  let uploaded = 0;
  for (const proposal of manifest) {
    const contents = await fs.readFile(proposal.file);
    const downloadName = safeFileName(
      `Коммерческое предложение ${proposal.configuration} ${proposal.external_id ?? proposal.serial_number ?? proposal.inventory_id}.docx`
    );
    const storagePath = `${proposal.inventory_id}/commercial-proposal.docx`;
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
        inventory_id: proposal.inventory_id,
        configuration: proposal.configuration,
        file_name: downloadName,
        storage_path: storagePath,
        public_url: publicUrl,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "inventory_id" }
    );
    if (recordError) throw recordError;
    uploaded += 1;
    console.log(`${uploaded}/${manifest.length}: ${proposal.configuration} (${proposal.external_id})`);
  }

  console.log(`Uploaded: ${uploaded}`);
}

main();
