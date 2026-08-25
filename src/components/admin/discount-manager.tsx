"use client";

import { useActionState, useState } from "react";
import { idleState } from "@/app/admin/state";
import { deleteDiscountAction, saveDiscountAction, toggleDiscountAction } from "@/app/admin/actions";
import { ConfirmSubmit, FormMessage, SubmitButton } from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox, Field, Select, TextInput } from "@/components/ui/field";
import { centsToInput, formatPrice } from "@/lib/money";

export interface DiscountRow {
  id: string;
  code: string;
  description: string;
  type: string;
  value: number;
  minSubtotalCents: number;
  maxRedemptions: number | null;
  usedCount: number;
  startsAt: string;
  endsAt: string;
  isActive: boolean;
}

function describe(code: DiscountRow): string {
  switch (code.type) {
    case "PERCENT":
      return `${(code.value / 100).toLocaleString("de-CH", { maximumFractionDigits: 2 })} % Rabatt`;
    case "FIXED":
      return `${formatPrice(code.value)} Rabatt`;
    case "FREE_SHIPPING":
      return "Gratisversand";
    default:
      return code.type;
  }
}

function DiscountForm({
  code,
  onDone,
}: {
  code?: DiscountRow;
  onDone?: () => void;
}) {
  const action = saveDiscountAction.bind(null, code?.id ?? null);
  const [state, formAction] = useActionState(action, idleState);
  const [type, setType] = useState(code?.type ?? "PERCENT");

  return (
    <form action={formAction} className="flex flex-col gap-5 border border-line bg-elevated p-5">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Field
          id={`code-${code?.id ?? "neu"}`}
          label="Code"
          required
          error={state.fields?.code}
          hint="Wird automatisch in Grossbuchstaben gespeichert"
        >
          {(aria) => (
            <TextInput
              {...aria}
              name="code"
              required
              placeholder="WILLKOMMEN10"
              className="uppercase"
              defaultValue={code?.code}
            />
          )}
        </Field>

        <Field id={`type-${code?.id ?? "neu"}`} label="Rabattart" required>
          {(aria) => (
            <Select
              {...aria}
              name="type"
              value={type}
              onChange={(event) => setType(event.target.value)}
            >
              <option value="PERCENT">Prozentrabatt</option>
              <option value="FIXED">Fester Betrag</option>
              <option value="FREE_SHIPPING">Gratisversand</option>
            </Select>
          )}
        </Field>

        {type === "PERCENT" && (
          <Field
            id={`valuePercent-${code?.id ?? "neu"}`}
            label="Rabatt in Prozent"
            required
            error={state.fields?.value}
          >
            {(aria) => (
              <TextInput
                {...aria}
                name="valuePercent"
                inputMode="decimal"
                required
                placeholder="10"
                defaultValue={code?.type === "PERCENT" ? String(code.value / 100) : ""}
              />
            )}
          </Field>
        )}

        {type === "FIXED" && (
          <Field
            id={`valueAmount-${code?.id ?? "neu"}`}
            label="Rabattbetrag (€)"
            required
            error={state.fields?.value}
          >
            {(aria) => (
              <TextInput
                {...aria}
                name="valueAmount"
                inputMode="decimal"
                required
                placeholder="5.00"
                defaultValue={code?.type === "FIXED" ? centsToInput(code.value) : ""}
              />
            )}
          </Field>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Field
          id={`minSubtotal-${code?.id ?? "neu"}`}
          label="Mindestbestellwert (€)"
          hint="0 = kein Mindestwert"
        >
          {(aria) => (
            <TextInput
              {...aria}
              name="minSubtotal"
              inputMode="decimal"
              placeholder="0.00"
              defaultValue={code ? centsToInput(code.minSubtotalCents) : ""}
            />
          )}
        </Field>

        <Field
          id={`maxRedemptions-${code?.id ?? "neu"}`}
          label="Maximale Einlösungen"
          hint="Leer = unbegrenzt"
        >
          {(aria) => (
            <TextInput
              {...aria}
              name="maxRedemptions"
              inputMode="numeric"
              defaultValue={code?.maxRedemptions ?? ""}
            />
          )}
        </Field>

        <Field id={`startsAt-${code?.id ?? "neu"}`} label="Gültig ab">
          {(aria) => <TextInput {...aria} type="date" name="startsAt" defaultValue={code?.startsAt} />}
        </Field>

        <Field id={`endsAt-${code?.id ?? "neu"}`} label="Gültig bis">
          {(aria) => <TextInput {...aria} type="date" name="endsAt" defaultValue={code?.endsAt} />}
        </Field>
      </div>

      <Field id={`description-${code?.id ?? "neu"}`} label="Interne Beschreibung">
        {(aria) => (
          <TextInput
            {...aria}
            name="description"
            placeholder="Newsletter-Aktion Frühling"
            defaultValue={code?.description}
          />
        )}
      </Field>

      <Checkbox
        id={`isActive-${code?.id ?? "neu"}`}
        name="isActive"
        defaultChecked={code?.isActive ?? true}
        label="Code ist einlösbar"
      />

      <FormMessage state={state} />

      <div className="flex gap-3">
        <SubmitButton size="sm">
          {code ? "Code speichern" : "Code anlegen"}
        </SubmitButton>
        {onDone && (
          <Button variant="ghost" size="sm" onClick={onDone}>
            Schliessen
          </Button>
        )}
      </div>
    </form>
  );
}

export function DiscountManager({ codes }: { codes: DiscountRow[] }) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [adding, setAdding] = useState(codes.length === 0);

  return (
    <div className="flex flex-col gap-5">
      {codes.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[46rem] border-collapse text-sm">
            <caption className="sr-only">
              Rabattcodes mit Bedingungen und Einlösungen
            </caption>
            <thead>
              <tr className="border-b border-line text-left text-xs uppercase tracking-[0.1em] text-subtle">
                <th scope="col" className="pb-3 pr-4 font-medium">Code</th>
                <th scope="col" className="pb-3 pr-4 font-medium">Rabatt</th>
                <th scope="col" className="pb-3 pr-4 font-medium">Mindestwert</th>
                <th scope="col" className="pb-3 pr-4 text-right font-medium">Eingelöst</th>
                <th scope="col" className="pb-3 pr-4 font-medium">Zeitraum</th>
                <th scope="col" className="pb-3 pr-4 font-medium">Status</th>
                <th scope="col" className="pb-3 font-medium">
                  <span className="sr-only">Aktionen</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {codes.map((code) => (
                <tr key={code.id} className="border-b border-line/60">
                  <td className="py-3 pr-4">
                    <span className="font-mono text-cream">{code.code}</span>
                    {code.description && (
                      <span className="block text-xs text-subtle">
                        {code.description}
                      </span>
                    )}
                  </td>
                  <td className="py-3 pr-4 text-muted">{describe(code)}</td>
                  <td className="py-3 pr-4 tabular-nums text-muted">
                    {code.minSubtotalCents > 0
                      ? formatPrice(code.minSubtotalCents)
                      : "—"}
                  </td>
                  <td className="py-3 pr-4 text-right tabular-nums text-muted">
                    {code.usedCount}
                    {code.maxRedemptions !== null && (
                      <span className="text-subtle"> / {code.maxRedemptions}</span>
                    )}
                  </td>
                  <td className="py-3 pr-4 text-xs text-subtle">
                    {code.startsAt || "sofort"} – {code.endsAt || "unbefristet"}
                  </td>
                  <td className="py-3 pr-4">
                    <Badge tone={code.isActive ? "success" : "neutral"}>
                      {code.isActive ? "Aktiv" : "Deaktiviert"}
                    </Badge>
                  </td>
                  <td className="py-3">
                    <div className="flex flex-wrap justify-end gap-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() =>
                          setEditingId(editingId === code.id ? null : code.id)
                        }
                      >
                        {editingId === code.id ? "Schliessen" : "Bearbeiten"}
                      </Button>

                      <form action={toggleDiscountAction}>
                        <input type="hidden" name="discountId" value={code.id} />
                        <SubmitButton variant="ghost" size="sm" pendingLabel="…">
                          {code.isActive ? "Deaktivieren" : "Aktivieren"}
                        </SubmitButton>
                      </form>

                      <form action={deleteDiscountAction}>
                        <input type="hidden" name="discountId" value={code.id} />
                        <ConfirmSubmit
                          message={`Code „${code.code}“ löschen? Bereits verwendete Codes werden nur deaktiviert.`}
                        >
                          Löschen
                        </ConfirmSubmit>
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editingId && (
        <DiscountForm
          code={codes.find((entry) => entry.id === editingId)}
          onDone={() => setEditingId(null)}
        />
      )}

      {adding ? (
        <DiscountForm onDone={() => setAdding(false)} />
      ) : (
        <Button variant="secondary" size="sm" onClick={() => setAdding(true)}>
          Neuen Code anlegen
        </Button>
      )}
    </div>
  );
}
