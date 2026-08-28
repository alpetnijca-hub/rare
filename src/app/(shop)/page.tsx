import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { ButtonLink } from "@/components/ui/button";
import { ProductCard } from "@/components/product/product-card";
import { siteConfig } from "@/config/site";
import { getBestsellers, getCategories, getNewArrivals } from "@/lib/products";
import { amountUntilFreeShipping } from "@/lib/shipping";
import { Money } from "@/components/currency/money";
import { prisma } from "@/lib/prisma";
import { demoDataStatus } from "@/lib/demo-seed";
import { productImageUrl } from "@/lib/product-image";

export const metadata: Metadata = {
  title: `${siteConfig.name} – Parfüms, Duftalternativen & Abfüllungen`,
  description:
    "Ausgewählte Parfüms, Duftalternativen und Abfüllungen in Größen von 2 ml bis 100 ml. Sichere Bezahlung, schneller Versand und persönliche Beratung.",
  alternates: { canonical: "/" },
};

// Lagerbestände ändern sich – die Startseite wird regelmässig neu erzeugt.
export const revalidate = 60;

const advantages = [
  {
    title: "Sichere Bezahlung",
    text: "Kreditkarte, Debitkarte, Apple Pay und Google Pay – abgewickelt über Stripe. Deine Zahlungsdaten erreichen unsere Server nie.",
    icon: (
      <>
        <rect x="2" y="6" width="24" height="17" rx="2" stroke="currentColor" strokeWidth="1.4" />
        <path d="M2 11h24" stroke="currentColor" strokeWidth="1.4" />
        <path d="M6 17h6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      </>
    ),
  },
  {
    title: "Schneller Versand",
    text: "Lagerware verlässt uns in 1–2 Werktagen, versichert und mit Sendungsnummer. Die Lieferzeit steht bei jedem Artikel.",
    icon: (
      <>
        <path d="M2 8h14v11H2z" stroke="currentColor" strokeWidth="1.4" />
        <path d="M16 12h5l4 4v3h-9z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
        <circle cx="7" cy="21" r="2.2" stroke="currentColor" strokeWidth="1.4" />
        <circle cx="20" cy="21" r="2.2" stroke="currentColor" strokeWidth="1.4" />
      </>
    ),
  },
  {
    title: "Persönliche Betreuung",
    text: "Hinter dem Shop stehen zwei Menschen, keine Hotline. Schreib uns – wir helfen bei der Auswahl und melden uns zügig zurück.",
    icon: (
      <>
        <circle cx="14" cy="10" r="5" stroke="currentColor" strokeWidth="1.4" />
        <path d="M4 24c0-5 4.5-8 10-8s10 3 10 8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      </>
    ),
  },
  {
    title: "Ehrliche Angaben",
    text: "Duftalternativen kennzeichnen wir klar als solche. Keine irreführenden Markenversprechen, keine erfundenen Bewertungen.",
    icon: (
      <>
        <path d="M14 3l10 4v7c0 6-4.2 10.4-10 12-5.8-1.6-10-6-10-12V7z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
        <path d="M9.5 13.5l3 3 6-6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
      </>
    ),
  },
];

function SectionHeading({
  eyebrow,
  title,
  description,
  href,
  linkLabel,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  href?: string;
  linkLabel?: string;
}) {
  return (
    <div className="mb-10 flex flex-col gap-4 md:mb-12 md:flex-row md:items-end md:justify-between">
      <div className="max-w-2xl">
        <p className="eyebrow mb-3">{eyebrow}</p>
        <h2 className="text-3xl md:text-4xl">{title}</h2>
        {description && (
          <p className="mt-3 text-sm leading-relaxed text-muted md:text-base">
            {description}
          </p>
        )}
      </div>
      {href && linkLabel && (
        <Link
          href={href}
          className="group shrink-0 self-start text-sm text-gold transition-colors hover:text-gold-light md:self-auto"
        >
          {linkLabel}
          <span className="ml-2 inline-block transition-transform duration-300 group-hover:translate-x-1">
            →
          </span>
        </Link>
      )}
    </div>
  );
}

export default async function HomePage() {
  const [bestsellers, newArrivals, categories, demoStatus] = await Promise.all([
    getBestsellers(4),
    getNewArrivals(4),
    getCategories(),
    demoDataStatus(prisma),
  ]);
  const demoProducts = demoStatus.demoProducts;

  // Grosse Kacheln nur für die Zielgruppen. Die Duftwelten kämen sonst als
  // zehn weitere Kacheln dazu und die Startseite bestünde nur noch aus
  // Kategorien; sie stehen deshalb als Textzeile darunter.
  const zielgruppen = categories.filter((category) => category.kind === "GENDER");
  const duftwelten = categories.filter((category) => category.kind !== "GENDER");

  const freeShippingFrom = amountUntilFreeShipping(0, "standard");

  return (
    <>
      {/* ---------------------------------------------------------------- */}
      {/* Hero                                                              */}
      {/* ---------------------------------------------------------------- */}
      <section className="relative isolate overflow-hidden border-b border-line">
        <div className="absolute inset-0 -z-10">
          <Image
            src="/produkte/hero.jpg"
            alt=""
            aria-hidden="true"
            fill
            priority
            sizes="100vw"
            className="object-cover object-right"
          />
          <div
            className="absolute inset-0 bg-linear-to-r from-ink via-ink/85 to-ink/30"
            aria-hidden="true"
          />
        </div>

        <div className="container-shop flex min-h-[78vh] flex-col justify-center py-20 md:min-h-[82vh] md:py-28">
          <div className="max-w-xl animate-rise">
            <p className="eyebrow mb-5">Parfüms · Abfüllungen · Duftproben</p>

            <h1 className="text-4xl leading-[1.08] sm:text-5xl md:text-6xl">
              Düfte, die man
              <span className="block text-gold">nicht überall findet</span>
            </h1>

            <p className="mt-6 max-w-lg text-base leading-relaxed text-muted md:text-lg">
              Wir sind zwei Duftliebhaber aus {siteConfig.countryName} und stellen
              eine kleine, sorgfältig geprüfte Auswahl zusammen: eigenständige
              Parfüms, klar gekennzeichnete Duftalternativen und Abfüllungen ab
              2 ml. So kannst du in Ruhe testen, bevor du dich für einen
              ganzen Flakon entscheidest.
            </p>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <ButtonLink href="/shop" size="lg">
                Düfte entdecken
              </ButtonLink>
              <ButtonLink href="/shop?probe=1" variant="secondary" size="lg">
                Düfte mit Probengröße
              </ButtonLink>
            </div>

            <dl className="mt-12 grid max-w-md grid-cols-3 gap-6 border-t border-line pt-7 text-sm">
              <div>
                <dt className="text-[11px] uppercase tracking-[0.14em] text-subtle">
                  Größen
                </dt>
                <dd className="mt-1 font-display text-xl text-cream">2–100 ml</dd>
              </div>
              <div>
                <dt className="text-[11px] uppercase tracking-[0.14em] text-subtle">
                  Lieferung
                </dt>
                <dd className="mt-1 font-display text-xl text-cream">
                  3 Tage – 2 Wochen
                </dd>
              </div>
              <div>
                <dt className="text-[11px] uppercase tracking-[0.14em] text-subtle">
                  Gratis ab
                </dt>
                <dd className="mt-1 font-display text-xl text-cream">
                  {freeShippingFrom ? <Money cents={freeShippingFrom} /> : "—"}
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* Vorteile                                                          */}
      {/* ---------------------------------------------------------------- */}
      <section aria-labelledby="vorteile" className="border-b border-line bg-charcoal">
        <h2 id="vorteile" className="sr-only">
          Unsere Vorteile
        </h2>
        <div className="container-shop grid gap-8 py-14 sm:grid-cols-2 lg:grid-cols-4 lg:gap-10">
          {advantages.map((advantage) => (
            <div key={advantage.title} className="flex flex-col gap-3">
              <svg
                width="28"
                height="28"
                viewBox="0 0 28 28"
                fill="none"
                aria-hidden="true"
                className="text-gold"
              >
                {advantage.icon}
              </svg>
              <h3 className="font-sans text-sm font-semibold uppercase tracking-[0.1em] text-cream">
                {advantage.title}
              </h3>
              <p className="text-sm leading-relaxed text-muted">{advantage.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* Bestseller                                                        */}
      {/* ---------------------------------------------------------------- */}
      {bestsellers.length > 0 && (
        <section aria-labelledby="bestseller" className="container-shop py-20 md:py-24">
          <div id="bestseller">
            <SectionHeading
              eyebrow="Meistgekauft"
              title="Unsere Bestseller"
              description="Diese Düfte werden am häufigsten bestellt – und am häufigsten nachbestellt."
              href="/shop?sortierung=beliebt"
              linkLabel="Alle ansehen"
            />
          </div>
          <div className="grid grid-cols-2 gap-4 md:gap-6 lg:grid-cols-4">
            {bestsellers.map((item, index) => (
              <ProductCard
                key={item.product.id}
                item={item}
                priority={index < 2}
              />
            ))}
          </div>
        </section>
      )}

      {/* ---------------------------------------------------------------- */}
      {/* Kategorien                                                        */}
      {/* ---------------------------------------------------------------- */}
      {zielgruppen.length > 0 && (
        <section
          aria-labelledby="kategorien"
          className="border-y border-line bg-charcoal"
        >
          <div className="container-shop py-20 md:py-24">
            <div id="kategorien">
              <SectionHeading
                eyebrow="Sortiment"
                title="Nach Kategorie stöbern"
                description="Such dir aus, wonach dir ist – jede Kategorie führt direkt in den passenden Teil des Sortiments."
              />
            </div>

            <ul
              className="grid gap-4 sm:grid-cols-2 md:gap-5 lg:grid-cols-3"
            >
              {zielgruppen.map((category) => (
                <li key={category.id}>
                  <Link
                    href={`/shop?kategorie=${category.slug}`}
                    className="group relative flex aspect-4/5 flex-col justify-end overflow-hidden
                      border border-line bg-ink p-6 transition-colors duration-300
                      hover:border-gold/50 focus-visible:border-gold/50"
                  >
                    {category.heroImageUrl ? (
                      <Image
                        src={productImageUrl(category.heroImageUrl, "card")}
                        alt=""
                        aria-hidden="true"
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        className="object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                    ) : (
                      /* Ohne hinterlegtes Bild bleibt die Kachel eine ruhige
                         Farbfläche statt eines leeren Rahmens. */
                      <div
                        aria-hidden="true"
                        className="absolute inset-0 bg-linear-to-br from-elevated via-charcoal to-ink"
                      />
                    )}

                    {/* Nur der untere Teil wird abgedunkelt – oben bleibt das
                        Bild sichtbar. */}
                    <div
                      className="absolute inset-x-0 bottom-0 h-3/5 bg-linear-to-t from-ink via-ink/75 to-transparent"
                      aria-hidden="true"
                    />

                    <div className="relative">
                      <h3 className="font-display text-2xl text-cream transition-colors group-hover:text-gold-light md:text-[1.75rem]">
                        {category.name}
                      </h3>
                      {category.description && (
                        <p className="mt-1.5 text-sm leading-snug text-muted">
                          {category.description}
                        </p>
                      )}
                      <span className="mt-4 inline-flex items-center gap-2 text-xs uppercase tracking-[0.14em] text-gold">
                        Ansehen
                        <span
                          aria-hidden="true"
                          className="transition-transform duration-300 group-hover:translate-x-1"
                        >
                          →
                        </span>
                      </span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>

            {duftwelten.length > 0 && (
              <div className="mt-10 border-t border-line pt-8">
                <p className="eyebrow mb-4">Oder nach Duftwelt</p>
                <ul className="flex flex-wrap gap-2.5">
                  {duftwelten.map((category) => (
                    <li key={category.id}>
                      <Link
                        href={`/shop?kategorie=${category.slug}`}
                        className="inline-flex min-h-11 items-center border border-line px-4 text-sm
                          text-muted transition-colors hover:border-gold/50 hover:text-gold-light
                          focus-visible:border-gold/50"
                      >
                        {category.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </section>
      )}

      {/* ---------------------------------------------------------------- */}
      {/* Neu eingetroffen                                                  */}
      {/* ---------------------------------------------------------------- */}
      {newArrivals.length > 0 && (
        <section aria-labelledby="neu" className="container-shop py-20 md:py-24">
          <div id="neu">
            <SectionHeading
              eyebrow="Frisch im Sortiment"
              title="Neu eingetroffen"
              description="Zuletzt aufgenommen – meist in kleiner Stückzahl."
              href="/shop?sortierung=neu"
              linkLabel="Alle Neuheiten"
            />
          </div>
          <div className="grid grid-cols-2 gap-4 md:gap-6 lg:grid-cols-4">
            {newArrivals.map((item) => (
              <ProductCard key={item.product.id} item={item} />
            ))}
          </div>
        </section>
      )}

      {/* ---------------------------------------------------------------- */}
      {/* Über uns / Vertrauen                                              */}
      {/* ---------------------------------------------------------------- */}
      <section aria-labelledby="ueber-uns" className="border-y border-line bg-charcoal">
        <div className="container-shop grid gap-12 py-20 md:grid-cols-2 md:items-center md:gap-16 md:py-24">
          <div>
            <p className="eyebrow mb-3">Über uns</p>
            <h2 id="ueber-uns" className="text-3xl md:text-4xl">
              Zwei Menschen, ein sorgfältig geführtes Sortiment
            </h2>
            <div className="mt-5 flex flex-col gap-4 text-sm leading-relaxed text-muted md:text-base">
              <p>
                {siteConfig.name} wird von zwei Geschäftspartnern geführt. Wir
                riechen jeden Duft selbst, bevor er ins Sortiment kommt, füllen
                unsere Abfüllungen von Hand ab und verpacken jede Bestellung
                persönlich.
              </p>
              <p>
                Wir sagen klar, was du bekommst: Produkte, die wir als
                Duftalternative führen, sind eigenständige Erzeugnisse und keine
                Originalware. Wir verwenden keine fremden Markenlogos und
                versprechen keine Gleichheit mit geschützten Düften.
              </p>
              <p>
                Fragen zu einem Duft, einer Größe oder deiner Bestellung? Schreib
                uns – wir antworten {siteConfig.supportResponseTime}.
              </p>
            </div>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <ButtonLink href="/kontakt" variant="secondary">
                Kontakt aufnehmen
              </ButtonLink>
              <ButtonLink href="/faq" variant="ghost">
                Häufige Fragen
              </ButtonLink>
            </div>
          </div>

          {/* Instagram */}
          <div className="border border-line bg-ink p-8 md:p-10">
            <p className="eyebrow mb-3">Instagram</p>
            <h3 className="text-2xl">Neue Düfte zuerst auf Instagram</h3>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              Dort zeigen wir Neuzugänge, Abfüllungen in Arbeit und beantworten
              Fragen zu einzelnen Düften – oft schneller als per E-Mail.
            </p>
            <a
              href={siteConfig.social.instagram}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-7 inline-flex min-h-11 items-center gap-3 border border-line-strong px-5
                text-sm text-cream transition-colors duration-200 hover:border-gold hover:text-gold-light"
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
                <rect x="1" y="1" width="16" height="16" rx="4.5" stroke="currentColor" strokeWidth="1.3" />
                <circle cx="9" cy="9" r="3.6" stroke="currentColor" strokeWidth="1.3" />
                <circle cx="13.4" cy="4.6" r="1" fill="currentColor" />
              </svg>
              {siteConfig.social.instagramHandle}
              <span className="sr-only">(öffnet in neuem Tab)</span>
            </a>
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* Demo-Hinweis – nur solange erfundene Produkte im Shop stehen.     */}
      {/* Er verschwindet von selbst, sobald die Demo-Inhalte entfernt sind, */}
      {/* und käme zurück, falls sie je wieder eingespielt werden.          */}
      {/* ---------------------------------------------------------------- */}
      {demoProducts > 0 && (
        <section className="container-shop py-14">
          <div className="border border-gold/25 bg-gold/5 p-6 md:p-8">
            <p className="eyebrow mb-2">Hinweis zur Demo-Fassung</p>
            <p className="text-sm leading-relaxed text-muted">
              Dieser Shop enthält noch Demo-Produkte mit erfundenen Namen und
              selbst gezeichneten Abbildungen. Sie lassen sich im internen
              Bereich mit einem Klick entfernen.
            </p>
          </div>
        </section>
      )}
    </>
  );
}
