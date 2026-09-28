import fs from "node:fs/promises";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

const sourceRoot =
  process.env.EQUIPMENT_BROCHURES_DIR ??
  "/Users/antonsoshnev/Desktop/Брошюры техники";
const bucket = "equipment-brochures";
const onlyModels = new Set(
  (process.env.EQUIPMENT_BROCHURES_ONLY ?? "")
    .split("|")
    .map((value) => value.trim())
    .filter(Boolean)
);

function required(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing environment variable: ${name}`);
  return value;
}

function modelKey(value) {
  return value.toUpperCase().replace(/[^A-ZА-ЯЁ0-9]/g, "");
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function withRetry(label, operation, attempts = 5) {
  let lastError;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const result = await operation();
      if (result?.error) throw result.error;
      return result;
    } catch (error) {
      lastError = error;
      if (attempt === attempts) break;
      const delay = 1_000 * 2 ** (attempt - 1);
      console.warn(`${label}: повтор ${attempt}/${attempts - 1}`);
      await wait(delay);
    }
  }

  throw lastError;
}

async function main() {
  const client = createClient(
    required("NEXT_PUBLIC_SUPABASE_URL"),
    required("SUPABASE_SERVICE_ROLE_KEY"),
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
  const entries = await fs.readdir(sourceRoot, { withFileTypes: true });
  let uploaded = 0;

  for (const folder of entries.filter(
    (entry) =>
      entry.isDirectory() && (onlyModels.size === 0 || onlyModels.has(entry.name))
  )) {
    const directory = path.join(sourceRoot, folder.name);
    const pdfs = (await fs.readdir(directory, { withFileTypes: true }))
      .filter((entry) => entry.isFile() && /\.pdf$/i.test(entry.name))
      .sort((a, b) => a.name.localeCompare(b.name, "ru", { numeric: true }));

    if (pdfs.length === 0) continue;
    if (pdfs.length > 1) {
      throw new Error(`${folder.name}: оставьте в папке только одну актуальную PDF-брошюру`);
    }

    const key = modelKey(folder.name);
    const fileName = pdfs[0].name;
    const contents = await fs.readFile(path.join(directory, fileName));
    const storagePath = `${key}/brochure.pdf`;
    await withRetry(`${folder.name}: загрузка`, () =>
      client.storage.from(bucket).upload(storagePath, contents, {
          contentType: "application/pdf",
          cacheControl: "3600",
          upsert: true,
        })
    );

    const publicUrl = client.storage.from(bucket).getPublicUrl(storagePath).data.publicUrl;
    await withRetry(`${folder.name}: запись`, () =>
      client.from("equipment_brochures").upsert(
        {
          model_key: key,
          model_name: folder.name,
          file_name: fileName,
          storage_path: storagePath,
          public_url: publicUrl,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "model_key" }
      )
    );

    uploaded += 1;
    console.log(`${folder.name}: ${fileName}`);
  }

  console.log(`Uploaded brochures: ${uploaded}`);
}

await main();
