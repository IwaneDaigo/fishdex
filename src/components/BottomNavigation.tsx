"use client";

import Link from "next/link";
import { Home, Library, PlusCircle } from "lucide-react";
import { usePathname } from "next/navigation";

const items = [
  { href: "/", label: "ホーム", icon: Home },
  { href: "/identify", label: "登録", icon: PlusCircle },
  { href: "/dex", label: "図鑑", icon: Library }
];

export function BottomNavigation() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-white/80 bg-foam/95 px-4 pb-3 pt-2 shadow-soft backdrop-blur md:hidden">
      <div className="mx-auto grid max-w-sm grid-cols-3 gap-2">
        {items.map((item) => {
          const active = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
          const Icon = item.icon;
          return (
            <Link
              className={`focus-ring flex flex-col items-center gap-1 rounded-xl px-2 py-2 text-xs font-bold ${
                active ? "bg-abyss text-white" : "text-slate-600"
              }`}
              href={item.href}
              key={item.href}
            >
              <Icon size={20} aria-hidden />
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
