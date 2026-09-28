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
