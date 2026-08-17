"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox, Field, TextArea, TextInput } from "@/components/ui/field";

/**
 * Kontaktformular mit Spam-Schutz.
 *
 * Der Schutz besteht aus einem versteckten Honeypot-Feld und einem
 * serverseitigen Limit je IP-Adresse – ohne Captcha und ohne
 * Drittanbieter-Skripte.
 */
export function ContactForm() {
  const [values, setValues] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [privacy, setPrivacy] = useState(false);
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);

  function set<K extends keyof typeof values>(key: K, value: string) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status === "loading") return;

    setStatus("loading");
    setMessage(null);

    const formData = new FormData(event.currentTarget);

    try {
      const response = await fetch("/api/kontakt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...values,
          privacy,
          website: formData.get("website") ?? "",
        }),
      });

      const data = (await response.json()) as { error?: string; message?: string };

      if (!response.ok) {
        setStatus("error");
        setMessage(data.error ?? "Die Nachricht konnte nicht gesendet werden.");
        return;
      }

      setStatus("done");
      setMessage(data.message ?? "Danke für deine Nachricht.");
    } catch {
      setStatus("error");
      setMessage("Verbindung fehlgeschlagen. Bitte später erneut versuchen.");
    }
  }

  if (status === "done") {
    return (
      <div role="status" className="border border-gold/40 bg-gold/5 p-8">
        <p className="eyebrow mb-3">Nachricht gesendet</p>
        <h2 className="text-2xl">Danke für deine Nachricht</h2>
        <p className="mt-3 text-sm leading-relaxed text-muted">{message}</p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <Field id="kontakt-name" label="Name" required>
          {(aria) => (
            <TextInput
              {...aria}
              name="name"
              autoComplete="name"
              required
              value={values.name}
              onChange={(event) => set("name", event.target.value)}
            />
          )}
        </Field>

        <Field id="kontakt-email" label="E-Mail-Adresse" required>
          {(aria) => (
            <TextInput
              {...aria}
              type="email"
              name="email"
              inputMode="email"
              autoComplete="email"
              required
              value={values.email}
              onChange={(event) => set("email", event.target.value)}
            />
          )}
        </Field>
      </div>

      <Field
        id="kontakt-betreff"
        label="Betreff"
        required
        hint="Bei Fragen zu einer Bestellung bitte die Bestellnummer angeben."
      >
        {(aria) => (
          <TextInput
            {...aria}
            name="subject"
            required
            value={values.subject}
            onChange={(event) => set("subject", event.target.value)}
          />
        )}
      </Field>

      <Field id="kontakt-nachricht" label="Nachricht" required>
        {(aria) => (
          <TextArea
            {...aria}
            name="message"
            required
            rows={7}
            maxLength={2000}
            className="min-h-40"
            value={values.message}
            onChange={(event) => set("message", event.target.value)}
          />
        )}
      </Field>

      {/* Honeypot – für Menschen unsichtbar. */}
      <div aria-hidden="true" className="absolute left-[-9999px] h-0 w-0 overflow-hidden">
        <label htmlFor="kontakt-website">Website</label>
        <input id="kontakt-website" name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <Checkbox
        id="kontakt-datenschutz"
        checked={privacy}
        onChange={(event) => setPrivacy(event.target.checked)}
        required
        label={
          <>
            Ich habe die{" "}
            <Link
              href="/datenschutz"
              className="text-gold underline underline-offset-2 hover:text-gold-light"
            >
              Datenschutzerklärung
            </Link>{" "}
            gelesen und bin damit einverstanden, dass meine Angaben zur
            Bearbeitung der Anfrage gespeichert werden.
          </>
        }
      />

      {message && status === "error" && (
        <p
          role="alert"
          className="border border-red-900/60 bg-red-950/40 px-4 py-3 text-sm text-red-200"
        >
          {message}
        </p>
      )}

      <Button type="submit" size="lg" disabled={status === "loading"} className="self-start">
        {status === "loading" ? "Wird gesendet …" : "Nachricht senden"}
      </Button>
    </form>
  );
}
