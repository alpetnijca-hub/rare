import type { Metadata } from "next";
import Link from "next/link";
import { ButtonLink } from "@/components/ui/button";
import { decantCategory } from "@/lib/decants";

export const metadata: Metadata = {
  title: "Seite nicht gefunden",
  robots: { index: false, follow: true },
};

const suggestions = [
  { href: "/shop", label: "Alle Düfte", hint: "Das komplette Sortiment" },
  {
    href: `/shop?kategorie=${decantCategory.slug}`,
    label: decantCategory.name,
    hint: "Ab 2 ml zum Testen",
  },
  { href: "/kontakt", label: "Kontakt", hint: "Wir helfen persönlich weiter" },
];

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col">
      <div className="container-shop flex flex-1 items-center py-20">
        <div className="mx-auto w-full max-w-2xl text-center">
          <p className="font-display text-7xl text-gold md:text-8xl">404</p>

          <h1 className="mt-6 text-3xl md:text-4xl">
            Diese Seite gibt es nicht
          </h1>

          <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-muted md:text-base">
            Vielleicht wurde der Duft aus dem Sortiment genommen oder die
            Adresse hat sich geändert. Über die Links unten findest du zurück.
          </p>

          <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
            <ButtonLink href="/" size="lg">
              Zur Startseite
            </ButtonLink>
            <ButtonLink href="/shop" variant="secondary" size="lg">
              Zum Shop
            </ButtonLink>
          </div>

          <ul className="mx-auto mt-14 grid max-w-lg gap-3 text-left sm:grid-cols-2">
            {suggestions.map((entry) => (
              <li key={entry.href}>
                <Link
                  href={entry.href}
                  className="block border border-line bg-charcoal p-4 transition-colors duration-200 hover:border-gold/50"
                >
                  <span className="block text-sm text-cream">{entry.label}</span>
                  <span className="mt-0.5 block text-xs text-subtle">
                    {entry.hint}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
