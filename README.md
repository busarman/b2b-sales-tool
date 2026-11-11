This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Daily stock sync

`GET /api/cron/sync-stock` downloads the latest `PQ for dealers_YYYYMMDD.xlsx`
from a private or shared Yandex Disk folder, validates the `Append1` and
`CNH_Spot_Предложение` sheets, and compares them with Supabase. The endpoint is
protected by `CRON_SECRET`.

The sync stays read-only while `STOCK_SYNC_APPLY=false`. Set it to `true` only
after applying `supabase/migrations/20260922090000_stock_sync.sql` and reviewing
a successful preview response. Set `NEXT_PUBLIC_STOCK_SYNC_ACTIVE=true` in the
same deployment so the catalog hides records that disappeared from the source file.

The public catalog is served by `/api/catalog/inventory` and `/api/catalog/spot`.
These return RRC (dealer price including VAT × 1.10, rounded to a whole unit),
without exposing source dealer-price fields. Anonymous database reads of the
source tables, price lists, reservations and retired proposals are disabled.
Photo and brochure downloads remain public. Warranty prices are separate.

`MATERIALS_PUBLIC_URL` must point to the intended materials folder. A personal
Yandex `/client/shared` page must not be used. Without a configured link the
materials tile is displayed as unavailable.

### Separate price lists

The stock source no longer supplies prices. A stock refresh preserves saved
prices and does not mean they were refreshed. Price imports have separate
`price_source_file`, `price_synced_at`, and `equipment_price_sync_runs` audit data.

For an OAuth-accessible private price folder, configure `YANDEX_DISK_PRICES_PATH`
and optionally `YANDEX_DISK_PRICES_PUBLIC_KEY`. The cron then reads the newest
`PQ PL for dealers_YYYYMMDD.xlsx`, validates it and applies prices atomically.
Its `prices.status` explicitly reports `not_configured`, `preview`, `applied`,
or `failed`; a configured price-import failure returns HTTP 503 even if the
availability refresh succeeded. Browser access with a folder password does not
establish OAuth/API access and must be verified before enabling this setting.

Until that access is available, download the current authorized price workbook
and run `npm run sync:prices -- --file '/path/PQ PL for dealers_YYYYMMDD.xlsx'`
with server-side Supabase credentials. This is a read-only preview. Add `--apply`
only after reviewing it. The importer checks active IDs, models and serial
numbers, uses explicit VAT-inclusive prices, preserves zero as unavailable,
and refuses files older than the last successful price import. Never put
passwords, service keys or downloaded price workbooks in Git.

For a shared folder, set `YANDEX_DISK_PUBLIC_KEY` to its permanent link and
`YANDEX_DISK_STOCK_PATH` to the path inside it (for example, `/CNH`).

Required server-side variables are listed in `.env.example`. Never expose the
Yandex OAuth token, Supabase service-role key, or cron secret through
`NEXT_PUBLIC_*` variables.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
