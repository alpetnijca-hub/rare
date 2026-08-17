"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Field, TextInput } from "@/components/ui/field";

/**
 * Anmeldeformular des Adminbereichs.
 *
 * Die Fehlermeldung ist bewusst unspezifisch: Sie verrät nicht, ob eine
 * E-Mail-Adresse existiert (kein Enumerieren von Konten).
 */
export function LoginForm({
  callbackUrl,
  initialError,
}: {
  callbackUrl: string;
  initialError?: string;
}) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(
    initialError ? "Anmeldung nicht möglich. Bitte erneut versuchen." : null,
  );

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (submitting) return;

    setSubmitting(true);
    setError(null);

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (!result || result.error) {
      setError("E-Mail-Adresse oder Passwort ist nicht korrekt.");
      setSubmitting(false);
      return;
    }

    router.push(callbackUrl);
    router.refresh();
  }

  return (
    <form
      onSubmit={onSubmit}
      noValidate
      className="flex flex-col gap-5 border border-line bg-charcoal p-7"
    >
      <Field id="admin-email" label="E-Mail-Adresse" required>
        {(aria) => (
          <TextInput
            {...aria}
            type="email"
            name="email"
            autoComplete="username"
            required
            autoFocus
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        )}
      </Field>

      <Field id="admin-passwort" label="Passwort" required>
        {(aria) => (
          <TextInput
            {...aria}
            type="password"
            name="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        )}
      </Field>

      {error && (
        <p
          role="alert"
          className="border border-red-900/60 bg-red-950/40 px-4 py-3 text-sm text-red-200"
        >
          {error}
        </p>
      )}

      <Button type="submit" size="lg" fullWidth disabled={submitting}>
        {submitting ? "Wird geprüft …" : "Anmelden"}
      </Button>
    </form>
  );
}
