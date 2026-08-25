"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useCart } from "@/components/cart/cart-provider";
import { CurrencySwitcher } from "@/components/currency/currency-switcher";
import { cn } from "@/lib/utils";
import { siteConfig } from "@/config/site";

const navigation = [
  { href: "/shop", label: "Alle Düfte" },
  { href: "/shop?kategorie=damen", label: "Damen" },
  { href: "/shop?kategorie=herren", label: "Herren" },
  { href: "/shop?kategorie=unisex", label: "Unisex" },
  { href: "/shop?kategorie=sets", label: "Sets" },
];

function CartCount() {
  const { itemCount, ready } = useCart();
  if (!ready || itemCount === 0) return null;

  return (
    <span
      className="absolute -right-2 -top-1.5 flex size-4.5 items-center justify-center
        rounded-full bg-gold text-[10px] font-bold text-ink tabular-nums"
      aria-hidden="true"
    >
      {itemCount > 99 ? "99+" : itemCount}
    </span>
  );
}

function CartLabel() {
  const { itemCount, ready } = useCart();
  return (
    <span className="sr-only">
      Warenkorb{ready && itemCount > 0 ? `, ${itemCount} Artikel` : ", leer"}
    </span>
  );
}

export function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Hintergrund wird beim Scrollen undurchsichtig.
  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 8);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Hintergrund sperren, solange das mobile Menü offen ist.
  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  // Menü mit Escape schliessen.
  useEffect(() => {
    if (!menuOpen) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setMenuOpen(false);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [menuOpen]);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 border-b transition-colors duration-300",
        scrolled || menuOpen
          ? "border-line bg-ink/95 backdrop-blur-md"
          : "border-transparent bg-ink/70 backdrop-blur-sm",
      )}
    >
      {/* Servicezeile */}
      <div className="hidden border-b border-line/60 bg-charcoal/60 md:block">
        <div className="container-shop flex h-9 items-center justify-between text-[11px] tracking-wide text-subtle">
          <p>Versicherter Versand · Sichere Bezahlung · Persönliche Beratung</p>
          <div className="flex items-center gap-5">
            <CurrencySwitcher label="Anzeigewährung wählen" />
            <Link href="/versand" className="transition-colors hover:text-gold-light">
              Versand &amp; Lieferung
            </Link>
            <Link href="/kontakt" className="transition-colors hover:text-gold-light">
              Kontakt
            </Link>
            <a
              href={siteConfig.social.instagram}
              target="_blank"
              rel="noopener noreferrer"
              className="transition-colors hover:text-gold-light"
            >
              {siteConfig.social.instagramHandle}
            </a>
          </div>
        </div>
      </div>

      <div className="container-shop flex h-16 items-center justify-between gap-4 md:h-20">
        {/* Mobiles Menü */}
        <button
          type="button"
          onClick={() => setMenuOpen((open) => !open)}
          aria-expanded={menuOpen}
          aria-controls="mobile-navigation"
          className="-ml-2 flex size-11 items-center justify-center text-cream transition-colors hover:text-gold lg:hidden"
        >
          <span className="sr-only">
            {menuOpen ? "Menü schliessen" : "Menü öffnen"}
          </span>
          <svg
            width="20"
            height="14"
            viewBox="0 0 20 14"
            fill="none"
            aria-hidden="true"
          >
            {menuOpen ? (
              <>
                <path d="M2 2l16 10M18 2L2 12" stroke="currentColor" strokeWidth="1.4" />
              </>
            ) : (
              <>
                <path d="M0 1h20M0 7h20M0 13h20" stroke="currentColor" strokeWidth="1.4" />
              </>
            )}
          </svg>
        </button>

        {/* Wortmarke */}
        <Link
          href="/"
          className="group flex flex-col items-center lg:items-start"
          aria-label={`${siteConfig.name} – zur Startseite`}
        >
          <span className="font-display text-xl leading-none tracking-[0.3em] text-gold transition-colors group-hover:text-gold-light md:text-2xl">
            RARE
          </span>
          <span className="text-[9px] tracking-[0.45em] text-muted md:text-[10px]">
            SCENTS
          </span>
        </Link>

        {/* Hauptnavigation */}
        <nav aria-label="Hauptnavigation" className="hidden lg:block">
          <ul className="flex items-center gap-7">
            {navigation.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="relative py-2 text-[13px] tracking-wide text-cream transition-colors
                    after:absolute after:bottom-0 after:left-0 after:h-px after:w-0 after:bg-gold
                    after:transition-[width] after:duration-300 hover:text-gold-light hover:after:w-full"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Aktionen */}
        <div className="flex items-center gap-1">
          <Link
            href="/shop"
            className="flex size-11 items-center justify-center text-cream transition-colors hover:text-gold"
          >
            <span className="sr-only">Düfte suchen</span>
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
              <circle cx="7.5" cy="7.5" r="5.5" stroke="currentColor" strokeWidth="1.4" />
              <path d="M11.5 11.5 16.5 16.5" stroke="currentColor" strokeWidth="1.4" />
            </svg>
          </Link>

          <Link
            href="/warenkorb"
            className="relative flex size-11 items-center justify-center text-cream transition-colors hover:text-gold"
          >
            <CartLabel />
            <svg width="18" height="19" viewBox="0 0 18 19" fill="none" aria-hidden="true">
              <path
                d="M1 5.5h16l-1.2 12H2.2L1 5.5Z"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinejoin="round"
              />
              <path
                d="M6 7V4.5a3 3 0 1 1 6 0V7"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinecap="round"
              />
            </svg>
            <CartCount />
          </Link>
        </div>
      </div>

      {/* Mobiles Menü – Inhalt */}
      <div
        id="mobile-navigation"
        hidden={!menuOpen}
        className="border-t border-line bg-ink lg:hidden"
      >
        <nav aria-label="Mobile Navigation" className="container-shop py-4">
          <ul className="flex flex-col">
            {navigation.map((item) => (
              <li key={item.href} className="border-b border-line/70 last:border-0">
                <Link
                  href={item.href}
                  onClick={() => setMenuOpen(false)}
                  className="flex min-h-13 items-center text-[15px] text-cream transition-colors hover:text-gold-light"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>

          <div className="mt-5 border-t border-line pt-5">
            <CurrencySwitcher label="Anzeigewährung" showLabel />
          </div>

          <div
            className="mt-5 flex flex-col gap-3 border-t border-line pt-5 text-sm text-muted"
            onClick={() => setMenuOpen(false)}
          >
            <Link href="/kontakt" className="transition-colors hover:text-gold-light">
              Kontakt
            </Link>
            <Link href="/versand" className="transition-colors hover:text-gold-light">
              Versand &amp; Lieferung
            </Link>
            <Link href="/faq" className="transition-colors hover:text-gold-light">
              Häufige Fragen
            </Link>
            <a
              href={siteConfig.social.instagram}
              target="_blank"
              rel="noopener noreferrer"
              className="transition-colors hover:text-gold-light"
            >
              Instagram {siteConfig.social.instagramHandle}
            </a>
          </div>
        </nav>
      </div>
    </header>
  );
}
