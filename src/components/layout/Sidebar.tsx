"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Scale, FileText, Newspaper, History } from "lucide-react";
import { cn } from "@/lib/utils";

const nav = [
  { href: "/dashboard",         label: "Movimentação processual", icon: FileText  },
  { href: "/dashboard/boletim", label: "Boletim informativo",     icon: Newspaper },
  { href: "/historico",         label: "Histórico",               icon: History   },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-56 flex-shrink-0 flex flex-col border-r border-ink-100 bg-white min-h-screen">
      <div className="flex items-center gap-2.5 px-5 py-5 border-b border-ink-100">
        <div className="w-7 h-7 rounded-lg bg-brand-600 flex items-center justify-center flex-shrink-0">
          <Scale className="w-4 h-4 text-white" />
        </div>
        <div>
          <p className="text-sm font-semibold text-ink-900 leading-none">TCE-MA</p>
          <p className="text-xs text-ink-400 mt-0.5">Boletim informativo</p>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {nav.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors",
                active
                  ? "bg-brand-50 text-brand-700 font-medium"
                  : "text-ink-500 hover:text-ink-800 hover:bg-ink-50"
              )}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="px-5 py-4 border-t border-ink-100">
        <p className="text-xs text-ink-400">TCE-MA · Boletim informativo</p>
      </div>
    </aside>
  );
}
