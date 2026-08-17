"use client";

import Link from "next/link";
import { useId, useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox, TextInput } from "@/components/ui/field";

/**
 * Benachrichtigung, sobald eine Größe wieder verfügbar ist.
 * Es wird genau eine E-Mail versendet – keine fortlaufende Werbung.
 */
export function BackInStockForm({
  variantId,
  productName,
  size,
}: {
  variantId: string;
  productName: string;
  size: string;
}) {
  const emailId = useId();
  const consentId = useId();

  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (status === "loading") return;

    setStatus("loading");
    setMessage(null);

    try {
      const response = await fetch("/api/benachrichtigung", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, variantId, consent }),
      });

      const data = (await response.json()) as { error?: string; message?: string };

      if (!response.ok) {
        setStatus("error");
        setMessage(data.error ?? "Die Anmeldung hat nicht funktioniert.");
        return;
      }

      setStatus("done");
      setMessage(
        data.message ??
          "Wir melden uns per E-Mail, sobald diese Größe wieder verfügbar ist.",
      );
    } catch {
      setStatus("error");
      setMessage("Verbindung fehlgeschlagen. Bitte später erneut versuchen.");
    }
  }

  if (status === "done") {
    return (
      <div role="status" className="border border-gold/40 bg-gold/5 p-5">
        <p className="eyebrow mb-2">Vorgemerkt</p>
        <p className="text-sm leading-relaxed text-cream">{message}</p>
      </div>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      noValidate
      className="flex flex-col gap-4 border border-line bg-charcoal p-5"
    >
      <div>
        <p className="eyebrow mb-2">Benachrichtigung</p>
        <p className="text-sm leading-relaxed text-muted">
          Wir schreiben dir einmalig, sobald {productName} in der Größe {size}{" "}
          wieder verfügbar ist.
        </p>
      </div>

      <div className="flex flex-col gap-2.5 sm:flex-row">
        <div className="flex-1">
          <label htmlFor={emailId} className="sr-only">
            E-Mail-Adresse für die Benachrichtigung
          </label>
          <TextInput
            id={emailId}
            type="email"
            inputMode="email"
            autoComplete="email"
            required
            placeholder="deine@email.ch"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            aria-invalid={status === "error"}
          />
        </div>
        <Button type="submit" variant="secondary" disabled={status === "loading"}>
          {status === "loading" ? "Wird gesendet …" : "Benachrichtigen"}
        </Button>
      </div>

      <Checkbox
        id={consentId}
        checked={consent}
        onChange={(event) => setConsent(event.target.checked)}
        required
        label={
          <>
            Ich bin damit einverstanden, dass meine E-Mail-Adresse für diese
            einmalige Benachrichtigung gespeichert wird (
            <Link
              href="/datenschutz"
              className="text-gold underline underline-offset-2 hover:text-gold-light"
            >
              Datenschutz
            </Link>
            ).
          </>
        }
      />

      {message && status === "error" && (
        <p role="alert" className="text-xs font-medium text-red-400">
          {message}
        </p>
      )}
    </form>
  );
}
