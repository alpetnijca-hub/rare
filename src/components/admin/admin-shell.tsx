"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { signOut } from "next-auth/react";
import type { AdminSessionUser } from "@/lib/auth-guard";
import { cn } from "@/lib/utils";

interface NavItem {
  href: string;
  label: string;
  exact?: boolean;
  badge?: "orders" | "stock";
}

const navigation: NavItem[] = [
  { href: "/admin", label: "Übersicht", exact: true },
  { href: "/admin/bestellungen", label: "Bestellungen", badge: "orders" },
  { href: "/admin/produkte", label: "Produkte" },
  { href: "/admin/lager", label: "Lager", badge: "stock" },
  { href: "/admin/kategorien", label: "Kategorien" },
  { href: "/admin/rabattcodes", label: "Rabattcodes" },
];

export function AdminShell({
  user,
  openOrders,
  lowStockCount,
  children,
}: {
  user: AdminSessionUser;
  openOrders: number;
  lowStockCount: number;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  function isActive(href: string, exact?: boolean) {
    return exact ? pathname === href : pathname.startsWith(href);
  }

  function badgeValue(badge?: string) {
    if (badge === "orders") return openOrders;
    if (badge === "stock") return lowStockCount;
    return 0;
  }

  const navItems = (
    <ul className="flex flex-col gap-1">
      {navigation.map((item) => {
        const active = isActive(item.href, item.exact);
        const count = badgeValue(item.badge);

        return (
          <li key={item.href}>
            <Link
              href={item.href}
              onClick={() => setMenuOpen(false)}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex min-h-11 items-center justify-between gap-3 border-l-2 px-4 text-sm transition-colors duration-200",
                active
                  ? "border-gold bg-gold/8 text-gold-light"
                  : "border-transparent text-muted hover:border-line-strong hover:text-cream",
              )}
            >
              <span>{item.label}</span>
              {count > 0 && (
                <span
                  className={cn(
                    "min-w-6 px-1.5 py-0.5 text-center text-[11px] tabular-nums",
                    item.badge === "stock"
                      ? "bg-amber-950/60 text-amber-300"
                      : "bg-gold/15 text-gold-light",
                  )}
                >
                  {count}
                </span>
              )}
            </Link>
          </li>
        );
      })}
    </ul>
  );

  return (
    <div className="flex min-h-dvh flex-col lg:flex-row">
      {/* Kopfzeile auf kleinen Bildschirmen */}
      <div className="flex items-center justify-between border-b border-line bg-charcoal px-4 py-3 lg:hidden">
        <Link href="/admin" className="flex items-baseline gap-2">
          <span className="font-display text-lg tracking-[0.25em] text-gold">RARE</span>
          <span className="text-[10px] tracking-[0.2em] text-subtle">ADMIN</span>
        </Link>

        <button
          type="button"
          onClick={() => setMenuOpen((open) => !open)}
          aria-expanded={menuOpen}
          aria-controls="admin-navigation"
          className="flex size-11 items-center justify-center text-cream hover:text-gold"
        >
          <span className="sr-only">Menü {menuOpen ? "schliessen" : "öffnen"}</span>
          <svg width="20" height="14" viewBox="0 0 20 14" fill="none" aria-hidden="true">
            {menuOpen ? (
              <path d="M2 2l16 10M18 2L2 12" stroke="currentColor" strokeWidth="1.4" />
            ) : (
              <path d="M0 1h20M0 7h20M0 13h20" stroke="currentColor" strokeWidth="1.4" />
            )}
          </svg>
        </button>
      </div>

      {/* Seitenleiste */}
      <nav
        id="admin-navigation"
        aria-label="Adminnavigation"
        className={cn(
          "shrink-0 border-line bg-charcoal lg:sticky lg:top-0 lg:h-dvh lg:w-64 lg:border-r",
          menuOpen ? "block border-b" : "hidden lg:block",
        )}
      >
        <div className="flex h-full flex-col">
          <div className="hidden border-b border-line px-4 py-6 lg:block">
            <Link href="/admin" className="flex flex-col">
              <span className="font-display text-xl tracking-[0.28em] text-gold">
                RARE
              </span>
              <span className="text-[10px] tracking-[0.3em] text-subtle">
                ADMIN-DASHBOARD
              </span>
            </Link>
          </div>

          <div className="flex-1 overflow-y-auto py-4">{navItems}</div>

          <div className="border-t border-line p-4">
            <p className="truncate text-sm text-cream">{user.name}</p>
            <p className="truncate text-xs text-subtle">{user.email}</p>
            <p className="mt-1 text-[11px] uppercase tracking-wider text-gold">
              {user.role === "ADMIN" ? "Administrator" : "Mitarbeitend"}
            </p>

            <div className="mt-4 flex flex-col gap-2">
              <Link
                href="/"
                target="_blank"
                className="text-xs text-muted underline underline-offset-4 hover:text-gold-light"
              >
                Shop ansehen ↗
              </Link>
              <button
                type="button"
                onClick={() => signOut({ callbackUrl: "/admin/anmelden" })}
                className="self-start text-xs text-muted underline underline-offset-4 hover:text-red-400"
              >
                Abmelden
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="min-w-0 flex-1 px-4 py-8 md:px-8 md:py-10">{children}</main>
    </div>
  );
}
