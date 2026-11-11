const RRC_MARKUP = 1.1;

export function rrcPrice(value?: number | null) {
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) {
    return null;
  }

  return Math.round(value * RRC_MARKUP);
}

export function formatRrcPrice(value?: number | null) {
  return value == null || !Number.isFinite(value) || value <= 0
    ? "—"
    : Math.round(value).toLocaleString("ru-RU", { maximumFractionDigits: 0 });
}
