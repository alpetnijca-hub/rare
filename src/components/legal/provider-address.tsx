import { Fragment } from "react";
import {
  addressOnRequestNote,
  postalAddressLines,
  siteConfig,
} from "@/config/site";

/**
 * Anbieterangaben für Impressum, AGB und Datenschutzerklärung.
 *
 * Steht in `src/config/site.ts` eine Postanschrift, wird sie ausgegeben.
 * Ist dort keine hinterlegt, erscheint stattdessen der Hinweis, dass wir die
 * Anschrift auf Anfrage nennen. Dadurch bleibt der Wortlaut auf allen
 * Rechtsseiten identisch.
 */
export function ProviderAddress({ withNote = true }: { withNote?: boolean }) {
  return (
    <>
      <p>
        {siteConfig.legalName}
        {postalAddressLines.map((line) => (
          <Fragment key={line}>
            <br />
            {line}
          </Fragment>
        ))}
        <br />
        E-Mail:{" "}
        <a
          href={`mailto:${siteConfig.contact.email}`}
          className="text-gold underline underline-offset-2 hover:text-gold-light"
        >
          {siteConfig.contact.email}
        </a>
      </p>
      {withNote && postalAddressLines.length === 0 && (
        <p className="text-xs text-subtle">{addressOnRequestNote}</p>
      )}
    </>
  );
}
