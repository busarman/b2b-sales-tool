import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-dvh overflow-hidden bg-zinc-950 text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(161,161,170,0.2),transparent_45%),radial-gradient(circle_at_90%_80%,rgba(113,113,122,0.16),transparent_45%)]" />

      <div className="relative mx-auto max-w-md px-4 pb-10 pt-6 sm:pt-8 lg:max-w-6xl lg:pb-12 lg:pt-10">
        <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
          <section
            className="reveal-up rounded-3xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur sm:p-6 lg:p-7"
            style={{ animationDelay: "40ms" }}
          >
            <div className="text-xs uppercase tracking-[0.2em] text-white/45">
              B2B SALES TOOL
            </div>
            <h1 className="mt-3 text-3xl font-semibold leading-tight sm:mt-4 sm:text-4xl lg:text-5xl">
              Портал продаж техники
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-white/70 sm:mt-4 sm:text-base sm:leading-7">
              Единая точка доступа к актуальному наличию по РФ и глобальному
              CNHi SPOT для дилерской сети.
            </p>
            <div className="mt-6 grid gap-3 text-sm text-white/80 sm:mt-8 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                Поиск и фильтры по брендам, статусам и параметрам техники.
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                Оперативный доступ к рынку SPOT и сравнительный отбор позиций.
              </div>
            </div>
          </section>

          <section className="grid gap-4">
            <Link
              href="/inventory"
              className="card-lift reveal-up block rounded-3xl p-5 text-zinc-950 sm:p-6"
              style={{ animationDelay: "120ms" }}
            >
              <div className="text-xs uppercase tracking-[0.16em] text-zinc-400">
                Основной раздел
              </div>
              <div className="mt-2 text-2xl font-semibold">Техника в наличии</div>
              <div className="mt-3 text-sm leading-6 text-zinc-500">
                Позиции по РФ, статусы поставки, цена и спецификации.
              </div>
              <div className="mt-5 inline-flex rounded-2xl bg-zinc-950 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800">
                Открыть
              </div>
            </Link>

            <Link
              href="/prices"
              className="card-lift reveal-up block rounded-3xl p-5 text-zinc-950 sm:p-6"
              style={{ animationDelay: "170ms" }}
            >
              <div className="text-xs uppercase tracking-[0.16em] text-zinc-400">
                CNHi Global
              </div>
              <div className="mt-2 text-2xl font-semibold">Техника CNHi SPOT</div>
              <div className="mt-3 text-sm leading-6 text-zinc-500">
                Глобально доступные позиции, не закрепленные за рынком.
              </div>
              <div className="mt-5 inline-flex rounded-2xl bg-zinc-950 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800">
                Открыть
              </div>
            </Link>
          </section>
        </div>

        <div
          className="reveal-up mt-5 max-w-3xl rounded-3xl border border-white/10 bg-white/5 p-4 text-sm leading-6 text-white/75 sm:mt-6 sm:leading-7"
          style={{ animationDelay: "220ms" }}
        >
          Для тестовой версии доступны два рабочих сценария:
          <br />
          1. Подбор техники из наличия в РФ.
          <br />
          2. Проверка глобального CNHi SPOT.
        </div>
      </div>
    </main>
  );
}
