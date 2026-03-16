import Link from "next/link";

const SCENARIOS = [
  "Быстро проверить наличие по РФ и найти ближайшую позицию под клиента.",
  "Сверить локальное наличие с глобальным CNHi SPOT, если нужна альтернатива.",
  "Собрать до 3 позиций в сравнение и обсудить разницу по цене и параметрам.",
];

export default function HomePage() {
  return (
    <main className="min-h-dvh bg-zinc-100 pb-8">
      <section className="bg-zinc-950 text-white">
        <div className="mx-auto max-w-md px-4 pb-7 pt-8">
          <div className="text-[10px] uppercase tracking-[0.22em] text-white/45">
            B2B SALES TOOL
          </div>

          <h1 className="mt-3 text-3xl font-semibold leading-tight">
            Портал дилера
          </h1>

          <p className="mt-3 max-w-sm text-sm leading-6 text-white/65">
            Быстрый доступ к наличию, CNHi SPOT и сравнению позиций для
            ежедневной работы с клиентами.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-md px-4 py-4">
        <div className="-mt-6 grid gap-4">
          <LauncherCard
            href="/inventory"
            eyebrow="Наличие по РФ"
            title="Техника в наличии"
            description="Поиск, фильтры по брендам и статусам, цена, спецификация и быстрое добавление в сравнение."
            buttonLabel="Открыть наличие"
          />

          <LauncherCard
            href="/prices"
            eyebrow="Глобальный stock"
            title="Техника CNHi SPOT"
            description="Проверка SPOT-позиций по брендам и моделям с тем же компактным мобильным паттерном."
            buttonLabel="Открыть SPOT"
          />

          <LauncherCard
            href="/compare"
            eyebrow="Работа с клиентом"
            title="Сравнение"
            description="Собери до 3 позиций из наличия и покажи клиенту разницу в одном экране."
            buttonLabel="Открыть сравнение"
          />
        </div>

        <section className="mt-5 rounded-[28px] border border-zinc-200 bg-white p-5 shadow-sm">
          <div className="text-[11px] uppercase tracking-[0.18em] text-zinc-400">
            Сценарии
          </div>

          <div className="mt-3 space-y-2">
            {SCENARIOS.map((scenario, index) => (
              <div
                key={scenario}
                className="rounded-[20px] bg-zinc-50 px-4 py-3 text-sm leading-5 text-zinc-700"
              >
                {index + 1}. {scenario}
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}

function LauncherCard({
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
      className="rounded-[30px] border border-zinc-200 bg-white p-5 shadow-sm transition active:scale-[0.99]"
    >
      <div className="text-[11px] uppercase tracking-[0.18em] text-zinc-400">
        {eyebrow}
      </div>

      <div className="mt-2 text-2xl font-semibold leading-tight text-zinc-950">
        {title}
      </div>

      <div className="mt-2 text-sm leading-6 text-zinc-500">{description}</div>

      <div className="mt-5 inline-flex min-h-11 items-center rounded-2xl bg-zinc-950 px-4 text-sm font-medium text-white">
        {buttonLabel}
      </div>
    </Link>
  );
}
