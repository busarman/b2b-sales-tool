export const BRAND_GROUPS = ["CNH", "McCormick", "SGW", "ECOLOTIGER"] as const;

export type BrandGroup = (typeof BRAND_GROUPS)[number];
