import Link from "next/link";
import { siteConfig } from "@/config/site";
import { NewsletterForm } from "@/components/newsletter-form";
import { CurrencySwitcher } from "@/components/currency/currency-switcher";
import { isVatRegistered, taxConfig } from "@/config/site";
import { formatTaxRate } from "@/lib/money";

const shopLinks = [
  { href: "/shop", label: "Alle Düfte" },
  { href: "/shop?kategorie=damen", label: "Damen" },
  { href: "/shop?kategorie=herren", label: "Herren" },
  { href: "/shop?kategorie=unisex", label: "Unisex" },
  { href: "/shop?kategorie=sets", label: "Geschenksets" },
];

const serviceLinks = [
  { href: "/kontakt", label: "Kontakt" },
  { href: "/faq", label: "Häufige Fragen" },
  { href: "/versand", label: "Versand & Lieferung" },
  { href: "/rueckgabe", label: "Rückgabe & Erstattung" },
  { href: "/bestellung", label: "Bestellung verfolgen" },
];

const legalLinks = [
  { href: "/impressum", label: "Impressum" },
  { href: "/datenschutz", label: "Datenschutz" },
  { href: "/agb", label: "AGB" },
  { href: "/widerruf", label: "Rückgaberecht" },
  { href: "/cookie-einstellungen", label: "Cookie-Einstellungen" },
];

function FooterColumn({
  title,
  links,
}: {
  title: string;
  links: Array<{ href: string; label: string }>;
}) {
  return (
    <div>
      <h2 className="eyebrow mb-4">{title}</h2>
      <ul className="flex flex-col gap-2.5">
        {links.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className="text-sm text-muted transition-colors duration-200 hover:text-gold-light"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function Footer() {
  return (
    <footer className="mt-24 border-t border-line bg-charcoal">
      {/* Newsletter */}
      <div className="border-b border-line">
        <div className="container-shop grid gap-8 py-14 md:grid-cols-2 md:items-center md:gap-16">
          <div>
            <p className="eyebrow mb-3">Newsletter</p>
            <h2 className="mb-3 text-2xl md:text-3xl">
              Neue Düfte zuerst entdecken
            </h2>
            <p className="max-w-md text-sm leading-relaxed text-muted">
              Gelegentliche Nachrichten zu neuen Abfüllungen, limitierten
              Sets und Wiederverfügbarkeiten. Keine Werbeflut, jederzeit
              abbestellbar.
            </p>
          </div>
          <NewsletterForm />
        </div>
      </div>

      {/* Spalten */}
      <div className="container-shop grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <Link href="/" className="inline-flex flex-col">
            <span className="font-display text-xl tracking-[0.3em] text-gold">
              RARE
            </span>
            <span className="text-[10px] tracking-[0.45em] text-muted">
              SCENTS
            </span>
          </Link>
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted">
            {siteConfig.description}
          </p>
          <a
            href={siteConfig.social.instagram}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-5 inline-flex items-center gap-2.5 text-sm text-cream transition-colors hover:text-gold-light"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
              <rect
                x="1"
                y="1"
                width="16"
                height="16"
                rx="4.5"
                stroke="currentColor"
                strokeWidth="1.3"
              />
              <circle cx="9" cy="9" r="3.6" stroke="currentColor" strokeWidth="1.3" />
              <circle cx="13.4" cy="4.6" r="1" fill="currentColor" />
            </svg>
            {siteConfig.social.instagramHandle}
          </a>
        </div>

        <FooterColumn title="Sortiment" links={shopLinks} />
        <FooterColumn title="Service" links={serviceLinks} />

        <div>
          <h2 className="eyebrow mb-4">Kontakt</h2>
          <address className="not-italic text-sm leading-relaxed text-muted">
            {siteConfig.legalName}
            <br />
            {siteConfig.contact.street}
            <br />
            {siteConfig.contact.postalCode} {siteConfig.contact.city}
            <br />
            {siteConfig.contact.country}
            <br />
            <a
              href={`mailto:${siteConfig.contact.email}`}
              className="mt-2 inline-block transition-colors hover:text-gold-light"
            >
              {siteConfig.contact.email}
            </a>
          </address>
          <p className="mt-4 text-xs leading-relaxed text-subtle">
            Erreichbar {siteConfig.supportHours}. Wir antworten{" "}
            {siteConfig.supportResponseTime}.
          </p>
        </div>
      </div>

      {/* Vertrauenszeile */}
      <div className="border-t border-line">
        <div className="container-shop flex flex-wrap items-center justify-center gap-x-8 gap-y-3 py-6 text-[11px] uppercase tracking-[0.14em] text-subtle">
          <span>SSL-verschlüsselt</span>
          <span aria-hidden="true">·</span>
          <span>Zahlung über Stripe</span>
          <span aria-hidden="true">·</span>
          <span>Karte · Apple Pay · Google Pay</span>
          <span aria-hidden="true">·</span>
          <span>Versicherter Versand</span>
        </div>
      </div>

      {/* Rechtliches */}
      <div className="border-t border-line bg-ink">
        <div className="container-shop flex flex-col gap-5 py-7">
          <nav aria-label="Rechtliche Hinweise">
            <ul className="flex flex-wrap gap-x-6 gap-y-2">
              {legalLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-xs text-muted transition-colors hover:text-gold-light"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
            <p className="text-xs leading-relaxed text-subtle">
              © {new Date().getFullYear()} {siteConfig.legalName}. Alle Preise
              in Schweizer Franken{" "}
              {isVatRegistered
                ? `inklusive ${formatTaxRate(taxConfig.rateBp)} MwSt.`
                : "– keine MwSt., da nicht mehrwertsteuerpflichtig"}
              , zuzüglich Versandkosten.
            </p>
            <CurrencySwitcher label="Anzeigewährung" showLabel />
          </div>

          <p className="max-w-4xl text-xs leading-relaxed text-subtle">
            <strong className="font-medium text-muted">
              Hinweis zu Duftalternativen:
            </strong>{" "}
            Als „Duftalternative“ oder „inspiriert von“ gekennzeichnete Produkte
            sind eigenständige Erzeugnisse und stehen in keiner Verbindung zu
            den Herstellern der genannten Duftrichtungen. Alle erwähnten Marken
            sind Eigentum ihrer jeweiligen Inhaber. Es besteht keine
            Zusammenarbeit, Lizenzierung oder Zugehörigkeit.
          </p>
        </div>
      </div>
    </footer>
  );
}
