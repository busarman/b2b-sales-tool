import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-dvh bg-zinc-950 text-white">
      <div className="mx-auto max-w-md px-4 pb-10 pt-8">
        <div className="text-xs uppercase tracking-[0.2em] text-white/40">
          B2B SALES TOOL
        </div>

        <h1 className="mt-3 text-3xl font-semibold">
          Портал продаж техники
        </h1>

        <p className="mt-2 text-sm leading-6 text-white/60">
          Быстрый доступ к актуальной технике в наличии по РФ и к глобальному
          CNHi SPOT для дилеров.
        </p>

        <div className="mt-8 space-y-4">
          <Link
            href="/inventory"
            className="block rounded-3xl bg-white p-5 text-zinc-950 shadow-sm"
          >
            <div className="text-xs uppercase tracking-[0.16em] text-zinc-400">
              Основной раздел
            </div>

            <div className="mt-2 text-xl font-semibold">
              Техника в наличии
            </div>

            <div className="mt-2 text-sm leading-6 text-zinc-500">
              Актуальные позиции по РФ. Поиск, фильтры по брендам и статусу
              поставки, цена и спецификация.
            </div>

            <div className="mt-4 inline-flex rounded-2xl bg-zinc-950 px-4 py-2 text-sm font-medium text-white">
              Открыть
            </div>
          </Link>

          <Link
            href="/prices"
            className="block rounded-3xl bg-white p-5 text-zinc-950 shadow-sm"
          >
            <div className="text-xs uppercase tracking-[0.16em] text-zinc-400">
              CNHi Global
            </div>

            <div className="mt-2 text-xl font-semibold">
              Техника CNHi SPOT
            </div>

            <div className="mt-2 text-sm leading-6 text-zinc-500">
              Глобально доступная техника CNHi для дилеров. Позиции не
              закреплены за рынком и могут быть проданы до момента подтверждения.
            </div>

            <div className="mt-4 inline-flex rounded-2xl bg-zinc-950 px-4 py-2 text-sm font-medium text-white">
              Открыть
            </div>
          </Link>
        </div>

        <div className="mt-6 rounded-3xl border border-white/10 bg-white/5 p-4 text-sm leading-6 text-white/70">
          Для тестовой версии доступны два рабочих сценария:
          <br />
          1. Подбор техники из наличия в РФ
          <br />
          2. Проверка глобального CNHi SPOT
        </div>
      </div>
    </main>
  );
}