import type { ReactNode } from "react";
import Link from "next/link";

/**
 * Einheitliches Layout für Rechts- und Serviceseiten.
 *
 * Der Hinweis oben ist bewusst deutlich sichtbar und kennt zwei Stufen:
 *
 *   "placeholder" – der Text enthält noch Platzhalter und ist unfertig.
 *   "review"      – der Text ist auf dieses Unternehmen zugeschnitten,
 *                   ersetzt aber weiterhin keine Rechtsberatung.
 *
 * Keine der beiden Stufen behauptet Rechtssicherheit. Genau das ist der
 * Punkt: Automatisch erzeugte Rechtstexte sind nie geprüft.
 */
export type LegalNotice = "placeholder" | "review" | "none";

export function LegalPage({
  title,
  intro,
  lastUpdated,
  notice = "placeholder",
  children,
}: {
  title: string;
  intro?: string;
  lastUpdated?: string;
  notice?: LegalNotice;
  children: ReactNode;
}) {
  return (
    <div className="container-shop py-12 md:py-16">
      <div className="mx-auto max-w-3xl">
        <header className="mb-10">
          <p className="eyebrow mb-3">Rechtliches &amp; Service</p>
          <h1 className="text-4xl md:text-5xl">{title}</h1>
          {intro && (
            <p className="mt-4 text-sm leading-relaxed text-muted md:text-base">
              {intro}
            </p>
          )}
          {lastUpdated && (
            <p className="mt-3 text-xs text-subtle">Stand: {lastUpdated}</p>
          )}
        </header>

        {notice === "placeholder" && (
          <aside
            role="note"
            className="mb-10 border border-amber-800/60 bg-amber-950/25 p-5 md:p-6"
          >
            <p className="mb-2 text-sm font-medium text-amber-200">
              Platzhaltertext – vor Veröffentlichung ersetzen und prüfen lassen
            </p>
            <p className="text-sm leading-relaxed text-amber-100/85">
              Dieser Text ist eine Vorlage zur Orientierung und{" "}
              <strong className="font-medium">nicht rechtssicher</strong>. Er
              wurde nicht auf euren konkreten Fall geprüft. Alle Rechtstexte,
              Produktangaben, Markennennungen, Duftvergleiche und
              Kennzeichnungspflichten – insbesondere nach Kosmetikverordnung,
              Preisbekanntgabeverordnung, Fernabsatzrecht und Datenschutzrecht
              – müssen vor dem Livegang durch eine fachkundige Person geprüft
              und an euer Unternehmen angepasst werden.
            </p>
          </aside>
        )}

        {notice === "review" && (
          <aside
            role="note"
            className="mb-10 border border-amber-800/60 bg-amber-950/25 p-5 md:p-6"
          >
            <p className="mb-2 text-sm font-medium text-amber-200">
              Vor dem Livegang juristisch prüfen lassen
            </p>
            <p className="text-sm leading-relaxed text-amber-100/85">
              Dieser Text wurde auf dieses Unternehmen zugeschnitten, ist aber{" "}
              <strong className="font-medium">
                nicht automatisch rechtssicher
              </strong>{" "}
              und ersetzt keine Rechtsberatung. Rechtstexte, Produktangaben,
              Markennennungen, Duftvergleiche und Kennzeichnungspflichten –
              insbesondere nach Kosmetikrecht, Preisbekanntgabeverordnung,
              Lebensmittel- und Gebrauchsgegenständerecht, Fernabsatzrecht
              sowie revDSG und DSGVO – müssen vor der Veröffentlichung von
              einer fachkundigen Person geprüft werden.
            </p>
          </aside>
        )}

        <div className="legal-content flex flex-col gap-8">{children}</div>

        <footer className="mt-14 border-t border-line pt-8">
          <p className="text-sm text-muted">
            Fragen zu diesen Angaben? Schreib uns über die{" "}
            <Link
              href="/kontakt"
              className="text-gold underline underline-offset-2 hover:text-gold-light"
            >
              Kontaktseite
            </Link>
            .
          </p>
        </footer>
      </div>
    </div>
  );
}

/** Abschnitt einer Rechtsseite. */
export function LegalSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section>
      <h2 className="mb-3 text-xl md:text-2xl">{title}</h2>
      <div className="flex flex-col gap-3 text-sm leading-relaxed text-muted md:text-[15px]">
        {children}
      </div>
    </section>
  );
}

/** Aufzählung mit goldenen Punkten. */
export function LegalList({ items }: { items: ReactNode[] }) {
  return (
    <ul className="flex flex-col gap-2">
      {items.map((item, index) => (
        <li key={index} className="flex gap-3">
          <span className="mt-2 size-1 shrink-0 bg-gold" aria-hidden="true" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

/** Hervorgehobener Kasten, z. B. für das Muster-Widerrufsformular. */
export function LegalBox({
  title,
  children,
}: {
  title?: string;
  children: ReactNode;
}) {
  return (
    <div className="border border-line bg-charcoal p-5 md:p-6">
      {title && <h3 className="mb-3 font-sans text-sm font-semibold uppercase tracking-[0.1em] text-cream">{title}</h3>}
      <div className="flex flex-col gap-3 text-sm leading-relaxed text-muted">
        {children}
      </div>
    </div>
  );
}
