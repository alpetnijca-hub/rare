"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Field, TextInput } from "@/components/ui/field";
import { createFirstAdmin } from "@/app/admin/einrichtung/actions";
import { idleSetupState } from "@/app/admin/einrichtung/state";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" fullWidth disabled={pending}>
      {pending ? "Konto wird angelegt …" : "Konto anlegen"}
    </Button>
  );
}

/** Formular der Ersteinrichtung. */
export function SetupForm() {
  const [state, formAction] = useActionState(createFirstAdmin, idleSetupState);

  return (
    <form
      action={formAction}
      className="flex flex-col gap-5 border border-line bg-charcoal p-7"
    >
      <Field
        id="setup-name"
        label="Name"
        required
        error={state.fields?.name}
      >
        {(aria) => (
          <TextInput
            {...aria}
            name="name"
            autoComplete="name"
            required
            autoFocus
            defaultValue="Alvin Ramdedovic"
          />
        )}
      </Field>

      <Field
        id="setup-email"
        label="E-Mail-Adresse"
        required
        error={state.fields?.email}
        hint="Damit meldest du dich künftig an."
      >
        {(aria) => (
          <TextInput
            {...aria}
            type="email"
            name="email"
            autoComplete="username"
            required
          />
        )}
      </Field>

      <Field
        id="setup-password"
        label="Passwort"
        required
        error={state.fields?.password}
        hint="Mindestens 12 Zeichen. Nutze am besten einen Passwortmanager."
      >
        {(aria) => (
          <TextInput
            {...aria}
            type="password"
            name="password"
            autoComplete="new-password"
            required
            minLength={12}
          />
        )}
      </Field>

      <Field
        id="setup-password-repeat"
        label="Passwort wiederholen"
        required
        error={state.fields?.passwordRepeat}
      >
        {(aria) => (
          <TextInput
            {...aria}
            type="password"
            name="passwordRepeat"
            autoComplete="new-password"
            required
            minLength={12}
          />
        )}
      </Field>

      {state.message && (
        <p
          role="alert"
          className="border border-red-900/60 bg-red-950/40 px-4 py-3 text-sm text-red-200"
        >
          {state.message}
        </p>
      )}

      <SubmitButton />
    </form>
  );
}
