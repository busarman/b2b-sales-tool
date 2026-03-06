"use client";

import { useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const BRANDS = ["McCormick", "Case IH", "New Holland", "SGW", "Ecolotiger"];

export default function AdminPricesPage() {
  const [brand, setBrand] = useState("McCormick");
  const [title, setTitle] = useState("");
  const [validFrom, setValidFrom] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleUpload() {
    if (!file) return alert("Выбери файл");

    setLoading(true);

    const filePath = `${brand}/${Date.now()}_${file.name}`;

    const { error: uploadError } = await supabase.storage
      .from("prices")
      .upload(filePath, file);

    if (uploadError) {
      setLoading(false);
      return alert(uploadError.message);
    }

    const { data: publicUrlData } = supabase.storage
      .from("prices")
      .getPublicUrl(filePath);

    const fileUrl = publicUrlData.publicUrl;

    // Деактивируем старые прайсы этого бренда
    await supabase
      .from("price_lists")
      .update({ is_active: false })
      .eq("brand", brand);

    // Создаём новую запись
    const { error: insertError } = await supabase
      .from("price_lists")
      .insert({
        brand,
        title,
        file_url: fileUrl,
        valid_from: validFrom || null,
        is_active: true,
      });

    setLoading(false);

    if (insertError) {
      return alert(insertError.message);
    }

    alert("Прайс загружен");
  }

  return (
    <main className="p-4 max-w-md mx-auto space-y-4">
      <h1 className="text-xl font-semibold">Загрузка прайса</h1>

      <select
        className="w-full border rounded-xl p-2"
        value={brand}
        onChange={(e) => setBrand(e.target.value)}
      >
        {BRANDS.map((b) => (
          <option key={b}>{b}</option>
        ))}
      </select>

      <input
        className="w-full border rounded-xl p-2"
        placeholder="Название"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />

      <input
        type="date"
        className="w-full border rounded-xl p-2"
        value={validFrom}
        onChange={(e) => setValidFrom(e.target.value)}
      />

      <input
        type="file"
        className="w-full"
        onChange={(e) => setFile(e.target.files?.[0] || null)}
      />

      <button
        onClick={handleUpload}
        disabled={loading}
        className="w-full bg-black text-white rounded-xl p-3"
      >
        {loading ? "Загрузка..." : "Загрузить"}
      </button>
    </main>
  );
}