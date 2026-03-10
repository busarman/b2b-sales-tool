import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-dvh bg-zinc-100 pb-10">
      <div className="bg-zinc-950 text-white shadow-sm">
        <div className="mx-auto max-w-md px-4 pb-6 pt-8">
          <div className="text-[11px] uppercase tracking-[0.22em] text-white/40">
            B2B SALES TOOL
          </div>

          <h1 className="mt-3 text-3xl font-semibold leading-tight">
            Портал дилера
          </h1>

          <p className="mt-3 text-sm leading-6 text-white/65">
            Быстрый доступ к наличию техники, глобальному CNHi SPOT и сравнению
            позиций для работы с клиентом.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-md px-4 py-4">
        <div className="grid gap-4">
          <PortalCard
            href="/inventory"
            eyebrow="Основной раздел"
            title="Техника в наличии"
            description="РФ наличие, поиск, фильтры по брендам и статусу, цена и спецификация."
            buttonLabel="Открыть наличие"
          />

          <PortalCard
            href="/prices"
            eyebrow="Global stock"
            title="Техника CNHi SPOT"
            description="Глобально доступные позиции CNHi для дилеров. Могут быть проданы до подтверждения."
            buttonLabel="Открыть SPOT"
          />

          <PortalCard
            href="/compare"
            eyebrow="Sales tool"
            title="Сравнение"
            description="Сравнивай до 3 позиций из наличия в одном экране и показывай клиенту разницу."
            buttonLabel="Открыть сравнение"
          />
        </div>

        <div className="mt-5 rounded-[28px] border border-zinc-200 bg-white p-4 shadow-sm">
          <div className="text-xs uppercase tracking-[0.16em] text-zinc-400">
            Сценарии
          </div>

          <div className="mt-3 space-y-3 text-sm text-zinc-700">
            <div className="rounded-2xl bg-zinc-50 px-4 py-3">
              1. Найти технику в наличии по бренду, статусу или модели
            </div>

            <div className="rounded-2xl bg-zinc-50 px-4 py-3">
              2. Проверить альтернативы в глобальном CNHi SPOT
            </div>

            <div className="rounded-2xl bg-zinc-50 px-4 py-3">
              3. Сравнить позиции и подготовить аргументацию для клиента
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

function PortalCard({
  href,
  eyebrow,
  title,
  description,
  buttonLabel,
}: {
  href: string;
  eyebrow: string;
  title: string;
  description: string;
  buttonLabel: string;
}) {
  return (
    <Link
      href={href}
      className="rounded-[28px] bg-white p-5 shadow-sm ring-1 ring-zinc-200 transition active:scale-[0.99]"
    >
      <div className="text-xs uppercase tracking-[0.16em] text-zinc-400">
        {eyebrow}
      </div>

      <div className="mt-2 text-2xl font-semibold text-zinc-950">
        {title}
      </div>

      <div className="mt-2 text-sm leading-6 text-zinc-500">
        {description}
      </div>

      <div className="mt-5 inline-flex rounded-2xl bg-zinc-950 px-4 py-2 text-sm font-medium text-white">
        {buttonLabel}
      </div>
    </Link>
  );
}