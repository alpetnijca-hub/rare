"use client";

import { useActionState, useState } from "react";
import {
  deleteCategoryAction,
  idleState,
  saveCategoryAction,
} from "@/app/admin/actions";
import { ConfirmSubmit, FormMessage, SubmitButton } from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox, Field, Select, TextArea, TextInput } from "@/components/ui/field";

export interface CategoryRow {
  id: string;
  name: string;
  slug: string;
  description: string;
  kind: string;
  sortOrder: number;
  isActive: boolean;
  productCount: number;
}

function CategoryForm({
  category,
  onDone,
}: {
  category?: CategoryRow;
  onDone?: () => void;
}) {
  const action = saveCategoryAction.bind(null, category?.id ?? null);
  const [state, formAction] = useActionState(action, idleState);

  return (
    <form action={formAction} className="flex flex-col gap-5 border border-line bg-elevated p-5">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Field id={`cat-name-${category?.id ?? "neu"}`} label="Name" required error={state.fields?.name}>
          {(aria) => <TextInput {...aria} name="name" required defaultValue={category?.name} />}
        </Field>

        <Field
          id={`cat-slug-${category?.id ?? "neu"}`}
          label="Slug"
          required
          error={state.fields?.slug}
          hint="Erscheint im Filter-Link"
        >
          {(aria) => <TextInput {...aria} name="slug" required defaultValue={category?.slug} />}
        </Field>

        <Field id={`cat-kind-${category?.id ?? "neu"}`} label="Art" required>
          {(aria) => (
            <Select {...aria} name="kind" defaultValue={category?.kind ?? "GENDER"}>
              <option value="GENDER">Zielgruppe (Damen / Herren / Unisex)</option>
              <option value="TYPE">Produktart (Abfüllungen / Sets)</option>
            </Select>
          )}
        </Field>

        <Field id={`cat-sort-${category?.id ?? "neu"}`} label="Reihenfolge">
          {(aria) => (
            <TextInput
              {...aria}
              name="sortOrder"
              inputMode="numeric"
              defaultValue={category?.sortOrder ?? 0}
            />
          )}
        </Field>
      </div>

      <Field id={`cat-desc-${category?.id ?? "neu"}`} label="Beschreibung">
        {(aria) => (
          <TextArea {...aria} name="description" rows={2} defaultValue={category?.description} />
        )}
      </Field>

      <Checkbox
        id={`cat-active-${category?.id ?? "neu"}`}
        name="isActive"
        defaultChecked={category?.isActive ?? true}
        label="Kategorie im Shop anzeigen"
      />

      <FormMessage state={state} />

      <div className="flex gap-3">
        <SubmitButton size="sm">
          {category ? "Kategorie speichern" : "Kategorie anlegen"}
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

export function CategoryManager({ categories }: { categories: CategoryRow[] }) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);

  return (
    <div className="flex flex-col gap-5">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[40rem] border-collapse text-sm">
          <caption className="sr-only">Kategorien mit Anzahl zugeordneter Produkte</caption>
          <thead>
            <tr className="border-b border-line text-left text-xs uppercase tracking-[0.1em] text-subtle">
              <th scope="col" className="pb-3 pr-4 font-medium">Name</th>
              <th scope="col" className="pb-3 pr-4 font-medium">Slug</th>
              <th scope="col" className="pb-3 pr-4 font-medium">Art</th>
              <th scope="col" className="pb-3 pr-4 text-right font-medium">Produkte</th>
              <th scope="col" className="pb-3 pr-4 font-medium">Status</th>
              <th scope="col" className="pb-3 font-medium">
                <span className="sr-only">Aktionen</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {categories.map((category) => (
              <tr key={category.id} className="border-b border-line/60">
                <td className="py-3 pr-4 text-cream">{category.name}</td>
                <td className="py-3 pr-4 font-mono text-xs text-subtle">
                  {category.slug}
                </td>
                <td className="py-3 pr-4 text-xs text-muted">
                  {category.kind === "GENDER" ? "Zielgruppe" : "Produktart"}
                </td>
                <td className="py-3 pr-4 text-right tabular-nums text-muted">
                  {category.productCount}
                </td>
                <td className="py-3 pr-4">
                  <Badge tone={category.isActive ? "success" : "neutral"}>
                    {category.isActive ? "Aktiv" : "Inaktiv"}
                  </Badge>
                </td>
                <td className="py-3">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() =>
                        setEditingId(editingId === category.id ? null : category.id)
                      }
                    >
                      {editingId === category.id ? "Schliessen" : "Bearbeiten"}
                    </Button>

                    <form action={deleteCategoryAction}>
                      <input type="hidden" name="categoryId" value={category.id} />
                      <ConfirmSubmit
                        message={
                          category.productCount > 0
                            ? `„${category.name}“ ist ${category.productCount} Produkten zugeordnet. Die Zuordnung geht verloren. Wirklich löschen?`
                            : `Kategorie „${category.name}“ wirklich löschen?`
                        }
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

      {editingId && (
        <CategoryForm
          category={categories.find((entry) => entry.id === editingId)}
          onDone={() => setEditingId(null)}
        />
      )}

      {adding ? (
        <CategoryForm onDone={() => setAdding(false)} />
      ) : (
        <Button variant="secondary" size="sm" onClick={() => setAdding(true)}>
          Neue Kategorie
        </Button>
      )}
    </div>
  );
}
