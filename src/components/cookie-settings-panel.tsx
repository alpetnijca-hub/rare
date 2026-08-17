"use client";

import { Button } from "@/components/ui/button";
import { openCookieSettings } from "@/components/cookie-consent";
import { optionalServices } from "@/config/cookies";

/**
 * Öffnet die Einwilligungsverwaltung erneut.
 * Wird nur angezeigt, wenn tatsächlich einwilligungspflichtige Dienste
 * konfiguriert sind.
 */
export function CookieSettingsPanel() {
  return (
    <div className="border border-line bg-charcoal p-6">
      <p className="mb-4 text-sm leading-relaxed text-muted">
        Folgende Dienste laden wir nur mit deiner Einwilligung:
      </p>

      <ul className="mb-6 flex flex-col gap-3">
        {optionalServices.map((service) => (
          <li key={service.key} className="border-b border-line/60 pb-3 last:border-0">
            <p className="text-sm text-cream">{service.name}</p>
            <p className="text-xs leading-relaxed text-subtle">
              {service.purpose} · Anbieter: {service.provider} · Speicherdauer:{" "}
              {service.duration} · Verarbeitung: {service.processingCountry}
            </p>
          </li>
        ))}
      </ul>

      <Button onClick={() => openCookieSettings()}>
        Auswahl ändern
      </Button>
    </div>
  );
}
