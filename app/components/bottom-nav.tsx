"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/inventory", label: "Наличие" },
  { href: "/prices", label: "Прайсы" },
  { href: "/compare", label: "Сравнение" },
  { href: "/docs", label: "Документы" },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <div className="fixed bottom-0 left-0 right-0 border-t border-zinc-200 bg-white/95 backdrop-blur">
      <div className="mx-auto grid max-w-md grid-cols-4 gap-1 px-2 py-2">
        {items.map((item) => {
          const active = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`rounded-2xl px-2 py-3 text-center text-xs font-medium ${
                active ? "bg-zinc-950 text-white" : "text-zinc-500"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}