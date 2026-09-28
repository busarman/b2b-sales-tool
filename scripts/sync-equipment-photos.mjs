import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { createClient } from "@supabase/supabase-js";

const sourceRoot =
  process.env.EQUIPMENT_PHOTOS_DIR ??
  "/Users/antonsoshnev/Desktop/Фото техники";
const bucket = "equipment-photos";
const imagePattern = /\.(jpe?g|png|webp|heic)$/i;
const onlyConfigurations = new Set(
  (process.env.EQUIPMENT_PHOTOS_ONLY ?? "")
    .split("|")
    .map((value) => value.trim())
    .filter(Boolean)
);

function required(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing environment variable: ${name}`);
  return value;
}

function folderKey(configuration) {
  return Buffer.from(configuration, "utf8").toString("base64url");
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
      const delay = 750 * 2 ** (attempt - 1);
      console.warn(`${label}: повтор ${attempt}/${attempts - 1} через ${delay} мс`);
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
  const folders = entries.filter(
    (entry) =>
      entry.isDirectory() &&
      (onlyConfigurations.size === 0 || onlyConfigurations.has(entry.name))
  );
  let uploaded = 0;

  for (const folder of folders) {
    const configuration = folder.name;
    const directory = path.join(sourceRoot, configuration);
    const files = (await fs.readdir(directory, { withFileTypes: true }))
      .filter((entry) => entry.isFile() && imagePattern.test(entry.name))
      .map((entry) => entry.name)
      .sort((a, b) => a.localeCompare(b, "ru", { numeric: true }));
    const prefix = folderKey(configuration);

    const existing = await withRetry(`${configuration}: чтение`, () =>
      client.storage.from(bucket).list(prefix, { limit: 1000 })
    );
    const oldPaths = (existing.data ?? []).map((item) => `${prefix}/${item.name}`);
    if (oldPaths.length) {
      await withRetry(`${configuration}: очистка`, () =>
        client.storage.from(bucket).remove(oldPaths)
      );
    }

    await withRetry(`${configuration}: очистка записей`, () =>
      client.from("equipment_photos").delete().eq("configuration", configuration)
    );

    for (const [index, fileName] of files.entries()) {
      const inputPath = path.join(directory, fileName);
      const output = await sharp(inputPath)
        .rotate()
        .resize({ width: 1600, height: 1200, fit: "inside", withoutEnlargement: true })
        .webp({ quality: 82 })
        .toBuffer();
      const storagePath = `${prefix}/${String(index + 1).padStart(3, "0")}.webp`;
      await withRetry(`${configuration}: фото ${index + 1}`, () =>
        client.storage.from(bucket).upload(storagePath, output, {
          contentType: "image/webp",
          cacheControl: "3600",
          upsert: true,
        })
      );
      const publicUrl = client.storage.from(bucket).getPublicUrl(storagePath).data.publicUrl;
      await withRetry(`${configuration}: запись ${index + 1}`, () =>
        client.from("equipment_photos").insert({
          configuration,
          storage_path: storagePath,
          public_url: publicUrl,
          sort_order: index,
        })
      );
      uploaded += 1;
      await wait(150);
    }

    console.log(`${configuration}: ${files.length}`);
  }

  console.log(`Uploaded: ${uploaded}`);
}

main();
