"use client";

import { useId, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Checkbox, TextInput } from "@/components/ui/field";

/**
 * Newsletter-Anmeldung mit ausdrücklicher Einwilligung (Opt-in).
 * Ohne gesetztes Häkchen wird nichts gespeichert. Die Bestätigung erfolgt
 * anschliessend per Double-Opt-in-E-Mail.
 */
export function NewsletterForm() {
  const emailId = useId();
  const consentId = useId();

  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status === "loading") return;

    setStatus("loading");
    setMessage(null);

    const formData = new FormData(event.currentTarget);

    try {
      const response = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          consent,
          website: formData.get("website") ?? "",
        }),
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
          "Fast fertig: Bitte bestätige die Anmeldung über den Link in der E-Mail.",
      );
      setEmail("");
      setConsent(false);
    } catch {
      setStatus("error");
      setMessage("Verbindung fehlgeschlagen. Bitte später erneut versuchen.");
    }
  }

  if (status === "done") {
    return (
      <div
        role="status"
        className="border border-gold/40 bg-gold/5 p-6"
      >
        <p className="eyebrow mb-2">Bestätigung ausstehend</p>
        <p className="text-sm leading-relaxed text-cream">{message}</p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="flex-1">
          <label htmlFor={emailId} className="sr-only">
            E-Mail-Adresse für den Newsletter
          </label>
          <TextInput
            id={emailId}
            name="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            required
            placeholder="deine@email.ch"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            aria-invalid={status === "error"}
            aria-describedby={message ? `${emailId}-message` : undefined}
          />
        </div>
        <Button
          type="submit"
          size="md"
          disabled={status === "loading"}
          className="sm:w-auto"
        >
          {status === "loading" ? "Wird gesendet …" : "Anmelden"}
        </Button>
      </div>

      {/* Honeypot – für Menschen unsichtbar, Bots füllen es aus. */}
      <div aria-hidden="true" className="absolute left-[-9999px] h-0 w-0 overflow-hidden">
        <label htmlFor="newsletter-website">Website</label>
        <input id="newsletter-website" name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <Checkbox
        id={consentId}
        name="consent"
        checked={consent}
        onChange={(event) => setConsent(event.target.checked)}
        required
        label={
          <>
            Ich möchte den Newsletter erhalten und bin damit einverstanden, dass
            meine E-Mail-Adresse zu diesem Zweck gespeichert wird. Die
            Einwilligung kann ich jederzeit widerrufen. Weitere Informationen in
            der{" "}
            <Link href="/datenschutz" className="text-gold underline underline-offset-2 hover:text-gold-light">
              Datenschutzerklärung
            </Link>
            .
          </>
        }
      />

      {message && (
        <p
          id={`${emailId}-message`}
          role="alert"
          className="text-xs font-medium text-red-400"
        >
          {message}
        </p>
      )}
    </form>
  );
}
