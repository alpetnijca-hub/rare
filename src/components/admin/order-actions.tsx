"use client";

import { useActionState } from "react";
import {
  createShipmentAction,
  idleState,
  resendConfirmationAction,
  updateOrderStatusAction,
} from "@/app/admin/actions";
import { FormMessage, SubmitButton } from "@/components/admin/ui";
import { Field, Select, TextInput } from "@/components/ui/field";
import { Checkbox } from "@/components/ui/field";
import { nextOrderStatuses, orderStatusLabels } from "@/lib/catalog";

/** Statuswechsel einer Bestellung. */
export function OrderStatusForm({
  orderId,
  currentStatus,
}: {
  orderId: string;
  currentStatus: string;
}) {
  const [state, formAction] = useActionState(updateOrderStatusAction, idleState);
  const options = nextOrderStatuses[currentStatus] ?? [];

  if (options.length === 0) {
    return (
      <p className="text-sm text-muted">
        Für den Status „{orderStatusLabels[currentStatus]}“ sind keine weiteren
        Schritte vorgesehen.
      </p>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="orderId" value={orderId} />

      <Field id="order-status" label="Neuer Status" required>
        {(aria) => (
          <Select {...aria} name="status" defaultValue={options[0]} required>
            {options.map((option) => (
              <option key={option} value={option}>
                {orderStatusLabels[option]}
              </option>
            ))}
          </Select>
        )}
      </Field>

      <Field
        id="order-reason"
        label="Grund"
        hint="Wird bei Stornierungen in die Kunden-E-Mail übernommen."
      >
        {(aria) => <TextInput {...aria} name="reason" maxLength={200} />}
      </Field>

      <FormMessage state={state} />

      <SubmitButton variant="secondary" pendingLabel="Wird aktualisiert …">
        Status ändern
      </SubmitButton>

      <p className="text-xs leading-relaxed text-subtle">
        Storno und Erstattung buchen den Lagerbestand automatisch zurück. Die
        eigentliche Geldrückzahlung wird im Stripe-Dashboard ausgelöst.
      </p>
    </form>
  );
}

/** Sendungsnummer erfassen und Versandbestätigung senden. */
export function ShipmentForm({ orderId }: { orderId: string }) {
  const [state, formAction] = useActionState(createShipmentAction, idleState);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="orderId" value={orderId} />

      <Field
        id="carrier"
        label="Versanddienstleister"
        required
        error={state.fields?.carrier}
      >
        {(aria) => (
          <TextInput
            {...aria}
            name="carrier"
            required
            placeholder="z. B. Schweizerische Post"
            defaultValue="Schweizerische Post"
          />
        )}
      </Field>

      <Field
        id="trackingNumber"
        label="Sendungsnummer"
        required
        error={state.fields?.trackingNumber}
      >
        {(aria) => (
          <TextInput {...aria} name="trackingNumber" required placeholder="99.00.000000.00000000" />
        )}
      </Field>

      <Field
        id="trackingUrl"
        label="Link zur Sendungsverfolgung"
        error={state.fields?.trackingUrl}
        hint="Vollständige URL inklusive https://"
      >
        {(aria) => <TextInput {...aria} type="url" name="trackingUrl" />}
      </Field>

      <Checkbox
        id="notifyCustomer"
        name="notifyCustomer"
        defaultChecked
        label="Versandbestätigung per E-Mail an den Kunden senden"
      />

      <FormMessage state={state} />

      <SubmitButton pendingLabel="Wird gespeichert …">
        Versand erfassen
      </SubmitButton>
    </form>
  );
}

/** Bestätigungsmail erneut versenden. */
export function ResendConfirmationForm({ orderId }: { orderId: string }) {
  const [state, formAction] = useActionState(resendConfirmationAction, idleState);

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <input type="hidden" name="orderId" value={orderId} />
      <FormMessage state={state} />
      <SubmitButton variant="ghost" size="sm" pendingLabel="Wird gesendet …">
        Bestätigungsmail erneut senden
      </SubmitButton>
    </form>
  );
}
