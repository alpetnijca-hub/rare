import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Seitenkopf im Adminbereich. */
export function AdminPageHeader({
  title,
  description,
  breadcrumb,
  actions,
}: {
  title: string;
  description?: string;
  breadcrumb?: Array<{ href: string; label: string }>;
  actions?: ReactNode;
}) {
  return (
    <header className="mb-8">
      {breadcrumb && breadcrumb.length > 0 && (
        <nav aria-label="Brotkrumen" className="mb-3">
          <ol className="flex flex-wrap items-center gap-2 text-xs text-subtle">
            {breadcrumb.map((entry, index) => (
              <li key={entry.href} className="flex items-center gap-2">
                {index > 0 && <span aria-hidden="true">/</span>}
                <Link href={entry.href} className="transition-colors hover:text-gold-light">
                  {entry.label}
                </Link>
              </li>
            ))}
          </ol>
        </nav>
      )}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl">{title}</h1>
          {description && (
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
              {description}
            </p>
          )}
        </div>
        {actions && <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>}
      </div>
    </header>
  );
}

/** Umrandeter Inhaltsbereich. */
export function Card({
  title,
  description,
  children,
  className,
  actions,
}: {
  title?: string;
  description?: string;
  children: ReactNode;
  className?: string;
  actions?: ReactNode;
}) {
  return (
    <section className={cn("border border-line bg-charcoal", className)}>
      {(title || actions) && (
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-line px-5 py-4">
          <div>
            {title && <h2 className="text-lg">{title}</h2>}
            {description && (
              <p className="mt-1 max-w-2xl text-sm leading-relaxed text-muted">
                {description}
              </p>
            )}
          </div>
          {actions && <div className="flex gap-2">{actions}</div>}
        </div>
      )}
      <div className="p-5">{children}</div>
    </section>
  );
}

/** Kennzahl-Kachel. */
export function StatTile({
  label,
  value,
  hint,
  tone = "neutral",
  href,
}: {
  label: string;
  value: string | number;
  hint?: string;
  tone?: "neutral" | "gold" | "warning" | "success";
  href?: string;
}) {
  const tones = {
    neutral: "border-line",
    gold: "border-gold/40",
    warning: "border-amber-800/60",
    success: "border-emerald-800/60",
  };

  const valueTones = {
    neutral: "text-cream",
    gold: "text-gold-light",
    warning: "text-amber-300",
    success: "text-emerald-300",
  };

  const content = (
    <>
      <p className="text-xs uppercase tracking-[0.14em] text-subtle">{label}</p>
      <p className={cn("mt-2 font-display text-3xl tabular-nums", valueTones[tone])}>
        {value}
      </p>
      {hint && <p className="mt-1 text-xs leading-relaxed text-muted">{hint}</p>}
    </>
  );

  if (href) {
    return (
      <Link
        href={href}
        className={cn(
          "block border bg-charcoal p-5 transition-colors duration-200 hover:border-gold/60",
          tones[tone],
        )}
      >
        {content}
      </Link>
    );
  }

  return (
    <div className={cn("border bg-charcoal p-5", tones[tone])}>{content}</div>
  );
}

/** Leerer Zustand innerhalb einer Tabelle oder Liste. */
export function EmptyRow({ children }: { children: ReactNode }) {
  return (
    <div className="border border-dashed border-line px-5 py-10 text-center text-sm text-muted">
      {children}
    </div>
  );
}

/**
 * Zusammenklappbarer Bereich für Einstellungen, die man selten braucht.
 *
 * Bewusst ein natives <details>: Der Inhalt bleibt im Formular und wird
 * mitgesendet, auch wenn er zugeklappt ist. Eine Lösung, die zugeklappte
 * Felder ausblendet, würde beim Speichern stillschweigend Werte verlieren.
 */
export function AdvancedCard({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <details className="group border border-line bg-charcoal">
      <summary
        className="flex cursor-pointer list-none items-center justify-between gap-3 px-5 py-4
          transition-colors hover:bg-ink/40
          focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-gold"
      >
        <div>
          <h2 className="text-lg">{title}</h2>
          {description && (
            <p className="mt-0.5 text-sm leading-relaxed text-muted">
              {description}
            </p>
          )}
        </div>
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          aria-hidden="true"
          className="shrink-0 text-muted transition-transform duration-200 group-open:rotate-180"
        >
          <path
            d="M3 6l5 5 5-5"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </summary>
      <div className="border-t border-line px-5 py-5">{children}</div>
    </details>
  );
}
