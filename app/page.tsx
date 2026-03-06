import Link from "next/link";

const sections = [
  {
    href: "/inventory",
    title: "Наличие техники",
    subtitle: "Быстрый доступ к актуальным позициям",
    badge: "Работает",
    emoji: "🚜",
    active: true,
  },
  {
    href: "/prices",
    title: "Прайсы",
    subtitle: "Цены и коммерческие ориентиры",
    badge: "Работает",
    emoji: "💰",
    active: true,
  },
  {
    href: "/compare",
    title: "Сравнение",
    subtitle: "Сопоставление моделей и преимуществ",
    badge: "Скоро",
    emoji: "⚖️",
    active: false,
  },
  {
    href: "/docs",
    title: "Документы",
    subtitle: "Спецификации, материалы и файлы",
    badge: "Скоро",
    emoji: "📄",
    active: false,
  },
];

export default function HomePage() {
  return (
    <main className="min-h-dvh bg-zinc-950 text-white">
      <div className="mx-auto max-w-6xl px-4 pb-10 pt-6 md:px-6">
        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <section className="rounded-[32px] border border-white/10 bg-gradient-to-br from-zinc-900 via-zinc-950 to-black p-6 shadow-2xl md:p-8">
            <div className="text-xs uppercase tracking-[0.22em] text-white/45">
              B2B SALES TOOL
            </div>

            <h1 className="mt-4 max-w-2xl text-4xl font-semibold leading-tight md:text-5xl">
              Портал для дилеров и продаж техники
            </h1>

            <p className="mt-4 max-w-2xl text-base leading-7 text-white/65">
              Единая рабочая точка для наличия, прайсов, сравнений и материалов
              по технике. Быстрый доступ к данным без лишних действий.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/inventory"
                className="rounded-2xl bg-white px-5 py-3 text-sm font-medium text-zinc-950 transition hover:bg-zinc-200"
              >
                Открыть наличие
              </Link>

              <Link
                href="/prices"
                className="rounded-2xl border border-white/15 px-5 py-3 text-sm font-medium text-white/90 transition hover:bg-white/5"
              >
                Открыть прайсы
              </Link>
            </div>

            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              <StatCard value="24/7" label="доступ к данным" />
              <StatCard value="Mobile" label="удобно с телефона" />
              <StatCard value="Fast" label="быстрый поиск" />
            </div>
          </section>

          <section className="rounded-[32px] border border-white/10 bg-white/5 p-6 shadow-xl backdrop-blur md:p-8">
            <div className="text-sm font-medium text-white">Что уже доступно</div>

            <div className="mt-5 space-y-3">
              <FeatureRow text="Наличие техники по брендам и статусам" />
              <FeatureRow text="Поиск по модели, serial и ID" />
              <FeatureRow text="Переход к спецификации из карточки" />
              <FeatureRow text="Мобильный доступ для быстрых переговоров" />
            </div>

            <div className="mt-8 rounded-[24px] border border-white/10 bg-black/30 p-4">
              <div className="text-xs uppercase tracking-[0.18em] text-white/40">
                Основной сценарий
              </div>
              <div className="mt-2 text-lg font-medium">
                Открыть наличие → найти модель → показать цену и спецификацию
              </div>
            </div>
          </section>
        </div>

        <section className="mt-8">
          <div className="mb-4 text-xs uppercase tracking-[0.22em] text-white/40">
            Разделы
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {sections.map((section) =>
              section.active ? (
                <Link
                  key={section.href}
                  href={section.href}
                  className="group rounded-[28px] border border-white/10 bg-white/[0.06] p-5 shadow-lg transition hover:-translate-y-0.5 hover:bg-white/[0.08]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="text-3xl">{section.emoji}</div>
                    <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-medium text-emerald-300">
                      {section.badge}
                    </span>
                  </div>

                  <div className="mt-8 text-2xl font-semibold leading-tight">
                    {section.title}
                  </div>

                  <div className="mt-3 text-sm leading-6 text-white/60">
                    {section.subtitle}
                  </div>

                  <div className="mt-8 text-sm font-medium text-white/90">
                    Открыть →
                  </div>
                </Link>
              ) : (
                <div
                  key={section.href}
                  className="rounded-[28px] border border-white/10 bg-white/[0.04] p-5 opacity-75"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="text-3xl">{section.emoji}</div>
                    <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white/60">
                      {section.badge}
                    </span>
                  </div>

                  <div className="mt-8 text-2xl font-semibold leading-tight">
                    {section.title}
                  </div>

                  <div className="mt-3 text-sm leading-6 text-white/55">
                    {section.subtitle}
                  </div>

                  <div className="mt-8 text-sm font-medium text-white/40">
                    Скоро
                  </div>
                </div>
              )
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

function StatCard({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-[22px] border border-white/10 bg-white/5 p-4">
      <div className="text-2xl font-semibold">{value}</div>
      <div className="mt-1 text-sm text-white/55">{label}</div>
    </div>
  );
}

function FeatureRow({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-white/8 bg-white/[0.04] p-3">
      <div className="mt-0.5 text-emerald-300">•</div>
      <div className="text-sm leading-6 text-white/75">{text}</div>
    </div>
  );
}