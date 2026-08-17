"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  consentStorageKey,
  consentVersion,
  optionalServices,
} from "@/config/cookies";

/**
 * Einwilligungsverwaltung.
 *
 * Das Banner erscheint ausschliesslich dann, wenn in `src/config/cookies.ts`
 * tatsächlich nicht notwendige Dienste eingetragen sind. Analyse- und
 * Marketingskripte dürfen erst nach einer Einwilligung geladen werden –
 * dafür steht `useConsent()` bereit.
 */

export interface ConsentState {
  version: number;
  decidedAt: string;
  /** Erlaubte Dienstschlüssel. */
  granted: string[];
}

function readConsent(): ConsentState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(consentStorageKey);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ConsentState;
    if (parsed.version !== consentVersion) return null;
    if (!Array.isArray(parsed.granted)) return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeConsent(granted: string[]): ConsentState {
  const state: ConsentState = {
    version: consentVersion,
    decidedAt: new Date().toISOString(),
    granted,
  };
  try {
    window.localStorage.setItem(consentStorageKey, JSON.stringify(state));
    window.dispatchEvent(new CustomEvent("consent-change", { detail: state }));
  } catch {
    // Kein Speicher verfügbar – die Auswahl gilt dann nur für diesen Besuch.
  }
  return state;
}

/**
 * Prüft, ob ein bestimmter Dienst geladen werden darf.
 * In Komponenten verwenden, die externe Skripte einbinden.
 */
export function useConsent(serviceKey: string): boolean {
  const [granted, setGranted] = useState(false);

  useEffect(() => {
    function sync() {
      setGranted(readConsent()?.granted.includes(serviceKey) ?? false);
    }
    sync();
    window.addEventListener("consent-change", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("consent-change", sync);
      window.removeEventListener("storage", sync);
    };
  }, [serviceKey]);

  return granted;
}

/** Öffnet die Einstellungen erneut – z. B. von der Seite /cookie-einstellungen. */
export function openCookieSettings() {
  window.dispatchEvent(new CustomEvent("open-cookie-settings"));
}

export function CookieConsent() {
  const [visible, setVisible] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selection, setSelection] = useState<Record<string, boolean>>({});

  const hasOptional = optionalServices.length > 0;

  const initSelection = useCallback(() => {
    const current = readConsent();
    const next: Record<string, boolean> = {};
    for (const service of optionalServices) {
      next[service.key] = current?.granted.includes(service.key) ?? false;
    }
    setSelection(next);
  }, []);

  // Wie beim Warenkorb: Der gespeicherte Einwilligungsstand steht erst im
  // Browser zur Verfügung, deshalb wird er nach dem Mounten gelesen.
  useEffect(() => {
    if (!hasOptional) return;
    if (readConsent() === null) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      initSelection();
      setVisible(true);
    }
  }, [hasOptional, initSelection]);

  // Erneutes Öffnen über die Seite "Cookie-Einstellungen".
  useEffect(() => {
    function onOpen() {
      initSelection();
      setDetailsOpen(true);
      setVisible(true);
    }
    window.addEventListener("open-cookie-settings", onOpen);
    return () => window.removeEventListener("open-cookie-settings", onOpen);
  }, [initSelection]);

  if (!hasOptional || !visible) return null;

  function acceptAll() {
    writeConsent(optionalServices.map((service) => service.key));
    setVisible(false);
  }

  function rejectAll() {
    writeConsent([]);
    setVisible(false);
  }

  function saveSelection() {
    writeConsent(
      Object.entries(selection)
        .filter(([, allowed]) => allowed)
        .map(([key]) => key),
    );
    setVisible(false);
  }

  return (
    <div
      role="dialog"
      aria-modal="false"
      aria-labelledby="cookie-consent-title"
      className="fixed inset-x-0 bottom-0 z-[60] border-t border-gold/30 bg-charcoal/98 backdrop-blur-md"
    >
      <div className="container-shop py-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between lg:gap-10">
          <div className="max-w-2xl">
            <h2 id="cookie-consent-title" className="mb-2 text-lg">
              Deine Auswahl zu Cookies
            </h2>
            <p className="text-sm leading-relaxed text-muted">
              Technisch notwendige Cookies setzen wir immer – ohne sie
              funktionieren Warenkorb und Bezahlung nicht. Zusätzlich möchten
              wir optionale Dienste einsetzen. Diese laden wir ausschliesslich
              mit deiner Einwilligung. Details findest du in der{" "}
              <Link
                href="/datenschutz"
                className="text-gold underline underline-offset-2 hover:text-gold-light"
              >
                Datenschutzerklärung
              </Link>
              .
            </p>

            {detailsOpen && (
              <ul className="mt-5 flex flex-col gap-3 border-t border-line pt-5">
                {optionalServices.map((service) => (
                  <li key={service.key} className="flex items-start gap-3">
                    <input
                      id={`consent-${service.key}`}
                      type="checkbox"
                      checked={selection[service.key] ?? false}
                      onChange={(event) =>
                        setSelection((current) => ({
                          ...current,
                          [service.key]: event.target.checked,
                        }))
                      }
                      className="mt-1 size-4.5 shrink-0 cursor-pointer appearance-none border border-line-strong
                        bg-ink checked:border-gold checked:bg-gold
                        focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
                    />
                    <label
                      htmlFor={`consent-${service.key}`}
                      className="cursor-pointer text-sm text-cream"
                    >
                      <span className="font-medium">{service.name}</span>
                      <span className="block text-xs leading-relaxed text-subtle">
                        {service.purpose} · Anbieter: {service.provider} ·
                        Speicherdauer: {service.duration} · Verarbeitung:{" "}
                        {service.processingCountry}
                      </span>
                    </label>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="flex shrink-0 flex-col gap-2.5 sm:flex-row lg:flex-col lg:w-56">
            <Button onClick={acceptAll} size="md" fullWidth>
              Alle akzeptieren
            </Button>
            <Button onClick={rejectAll} variant="secondary" size="md" fullWidth>
              Nur notwendige
            </Button>
            {detailsOpen ? (
              <Button onClick={saveSelection} variant="ghost" size="md" fullWidth>
                Auswahl speichern
              </Button>
            ) : (
              <Button
                onClick={() => setDetailsOpen(true)}
                variant="ghost"
                size="md"
                fullWidth
              >
                Einstellungen
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
