"use client";

import { useState } from "react";

const PORTAL_URL = "https://b2b-sales-tool.vercel.app";

export function SharePortalButton() {
  const [copied, setCopied] = useState(false);

  async function handleShare() {
    const shareData = {
      title: "B2B Sales Tool",
      text: "Портал дилера B2B Sales Tool",
      url: PORTAL_URL,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
        return;
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
      }
    }

    try {
      await navigator.clipboard.writeText(PORTAL_URL);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt("Скопируйте ссылку на портал", PORTAL_URL);
    }
  }

  return (
    <button
      type="button"
      onClick={handleShare}
      className="mt-5 inline-flex min-h-11 items-center justify-center rounded-2xl border border-white/20 bg-white px-4 text-sm font-medium text-zinc-950 transition active:scale-[0.99]"
    >
      {copied ? "Ссылка скопирована" : "Поделиться порталом"}
    </button>
  );
}
