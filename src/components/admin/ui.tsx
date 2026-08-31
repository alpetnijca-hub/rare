"use client";

import { useFormStatus } from "react-dom";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import type { ActionState } from "@/app/admin/state";
import { cn } from "@/lib/utils";

/** Absende-Button, der den Ladezustand des Formulars anzeigt. */
export function SubmitButton({
  children,
  pendingLabel = "Wird gespeichert …",
  variant = "primary",
  size = "md",
  fullWidth,
  className,
  name,
  value,
}: {
  children: ReactNode;
  pendingLabel?: string;
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  fullWidth?: boolean;
  className?: string;
  /**
   * Für Formulare mit mehreren Knöpfen: Der gedrückte Knopf schickt seinen
   * Wert mit, und die Aktion weiss, welcher es war. Ein verstecktes Feld
   * könnte das nicht – es wüsste nichts vom Klick.
   */
  name?: string;
  value?: string;
}) {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      variant={variant}
      size={size}
      fullWidth={fullWidth}
      disabled={pending}
      className={className}
      name={name}
      value={value}
    >
      {pending ? pendingLabel : children}
    </Button>
  );
}

/** Rückmeldung einer Server Action. */
export function FormMessage({ state }: { state: ActionState }) {
  if (!state.message) return null;

  return (
    <p
      role="status"
      className={cn(
        "border px-4 py-3 text-sm",
        state.ok
          ? "border-emerald-800/60 bg-emerald-950/30 text-emerald-200"
          : "border-red-900/60 bg-red-950/40 text-red-200",
      )}
    >
      {state.message}
    </p>
  );
}

/** Bestätigungsdialog vor destruktiven Aktionen. */
export function ConfirmSubmit({
  children,
  message,
  variant = "danger",
  size = "sm",
}: {
  children: ReactNode;
  message: string;
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
}) {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      variant={variant}
      size={size}
      disabled={pending}
      onClick={(event) => {
        if (!window.confirm(message)) event.preventDefault();
      }}
    >
      {pending ? "…" : children}
    </Button>
  );
}
