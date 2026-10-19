const RRC_MARKUP = 1.1;

export function rrcPrice(value?: number | null) {
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) {
    return null;
  }

  return Math.round(value * RRC_MARKUP);
}

export function formatRrcPrice(value?: number | null) {
  const price = rrcPrice(value);
  return price == null
    ? "—"
    : price.toLocaleString("ru-RU", { maximumFractionDigits: 0 });
}
