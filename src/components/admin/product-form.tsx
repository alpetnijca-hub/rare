"use client";

import { useActionState } from "react";
import Link from "next/link";
import { idleState } from "@/app/admin/state";
import { saveProductAction } from "@/app/admin/actions";
import { FormMessage, SubmitButton } from "@/components/admin/ui";
import { Card } from "@/components/admin/layout-parts";
import { Checkbox, Field, Select, TextArea, TextInput } from "@/components/ui/field";
import { familyLabels, fragranceFamilies, kindLabels, productKinds } from "@/lib/catalog";
import { slugify } from "@/lib/utils";

export interface ProductFormValues {
  id?: string;
  name: string;
  slug: string;
  subtitle: string;
  description: string;
  scentProfile: string;
  fragranceFamily: string;
  kind: string;
  topNotes: string;
  heartNotes: string;
  baseNotes: string;
  ingredients: string;
  usage: string;
  legalNotice: string;
  isAlternative: boolean;
  isDemo: boolean;
  isActive: boolean;
  isBestseller: boolean;
  isNew: boolean;
  popularity: number;
  metaTitle: string;
  metaDesc: string;
  categoryIds: string[];
}

export const emptyProduct: ProductFormValues = {
  name: "",
  slug: "",
  subtitle: "",
  description: "",
  scentProfile: "",
  fragranceFamily: "FLORAL",
  kind: "PARFUM",
  topNotes: "",
  heartNotes: "",
  baseNotes: "",
  ingredients: "",
  usage: "",
  legalNotice: "",
  isAlternative: false,
  isDemo: false,
  isActive: true,
  isBestseller: false,
  isNew: true,
  popularity: 0,
  metaTitle: "",
  metaDesc: "",
  categoryIds: [],
};

export function ProductForm({
  values,
  categories,
}: {
  values: ProductFormValues;
  categories: Array<{ id: string; name: string; kind: string }>;
}) {
  const action = saveProductAction.bind(null, values.id ?? null);
  const [state, formAction] = useActionState(action, idleState);

  return (
    <form action={formAction} className="flex flex-col gap-6">
      <Card title="Grunddaten">
        <div className="flex flex-col gap-5">
          <div className="grid gap-5 md:grid-cols-2">
            <Field id="name" label="Produktname" required error={state.fields?.name}>
              {(aria) => (
                <TextInput
                  {...aria}
                  name="name"
                  required
                  defaultValue={values.name}
                  onChange={(event) => {
                    // Slug nur bei neuen Produkten automatisch mitführen.
                    if (values.id) return;
                    const slugField =
                      document.querySelector<HTMLInputElement>("#slug");
                    if (slugField && !slugField.dataset.touched) {
                      slugField.value = slugify(event.target.value);
                    }
                  }}
                />
              )}
            </Field>

            <Field
              id="slug"
              label="URL-Kürzel (Slug)"
              required
              error={state.fields?.slug}
              hint="Erscheint in der Adresse: /produkt/dein-slug"
            >
              {(aria) => (
                <TextInput
                  {...aria}
                  name="slug"
                  required
                  defaultValue={values.slug}
                  onInput={(event) => {
                    event.currentTarget.dataset.touched = "true";
                  }}
                />
              )}
            </Field>
          </div>

          <Field
            id="subtitle"
            label="Kurzbeschreibung"
            error={state.fields?.subtitle}
            hint="Eine Zeile für Produktkarten, max. 160 Zeichen"
          >
            {(aria) => (
              <TextInput {...aria} name="subtitle" maxLength={160} defaultValue={values.subtitle} />
            )}
          </Field>

          <Field
            id="description"
            label="Ausführliche Beschreibung"
            required
            error={state.fields?.description}
            hint="Absätze durch Zeilenumbrüche trennen"
          >
            {(aria) => (
              <TextArea
                {...aria}
                name="description"
                required
                rows={8}
                className="min-h-48"
                defaultValue={values.description}
              />
            )}
          </Field>

          <div className="grid gap-5 md:grid-cols-3">
            <Field id="fragranceFamily" label="Duftfamilie" required>
              {(aria) => (
                <Select {...aria} name="fragranceFamily" defaultValue={values.fragranceFamily}>
                  {fragranceFamilies.map((family) => (
                    <option key={family} value={family}>
                      {familyLabels[family]}
                    </option>
                  ))}
                </Select>
              )}
            </Field>

            <Field id="kind" label="Produktart" required>
              {(aria) => (
                <Select {...aria} name="kind" defaultValue={values.kind}>
                  {productKinds.map((kind) => (
                    <option key={kind} value={kind}>
                      {kindLabels[kind]}
                    </option>
                  ))}
                </Select>
              )}
            </Field>

            <Field
              id="popularity"
              label="Beliebtheitswert"
              hint="Höher = weiter vorn bei Sortierung nach Beliebtheit"
            >
              {(aria) => (
                <TextInput
                  {...aria}
                  name="popularity"
                  inputMode="numeric"
                  defaultValue={String(values.popularity)}
                />
              )}
            </Field>
          </div>

          <Field
            id="scentProfile"
            label="Duftrichtung in Worten"
            hint="z. B. „Warm-orientalisch mit Amber und Vanille“"
          >
            {(aria) => (
              <TextInput {...aria} name="scentProfile" defaultValue={values.scentProfile} />
            )}
          </Field>
        </div>
      </Card>

      <Card
        title="Duftnoten"
        description="Mehrere Noten mit Komma trennen, z. B. „Bergamotte, Zitrone, Pfeffer“."
      >
        <div className="grid gap-5 md:grid-cols-3">
          <Field id="topNotes" label="Kopfnote">
            {(aria) => <TextInput {...aria} name="topNotes" defaultValue={values.topNotes} />}
          </Field>
          <Field id="heartNotes" label="Herznote">
            {(aria) => <TextInput {...aria} name="heartNotes" defaultValue={values.heartNotes} />}
          </Field>
          <Field id="baseNotes" label="Basisnote">
            {(aria) => <TextInput {...aria} name="baseNotes" defaultValue={values.baseNotes} />}
          </Field>
        </div>
      </Card>

      <Card title="Pflichtangaben und Hinweise">
        <div className="flex flex-col gap-5">
          <Field
            id="ingredients"
            label="Inhaltsstoffe und Pflichtangaben"
            hint="INCI-Liste sowie Warn- und Gefahrenhinweise"
          >
            {(aria) => (
              <TextArea {...aria} name="ingredients" rows={6} defaultValue={values.ingredients} />
            )}
          </Field>

          <Field id="usage" label="Anwendungshinweise">
            {(aria) => <TextArea {...aria} name="usage" rows={4} defaultValue={values.usage} />}
          </Field>

          <Field
            id="legalNotice"
            label="Rechtlicher Hinweis"
            hint="Bei Duftalternativen zwingend ausfüllen – wird auf der Produktseite angezeigt."
          >
            {(aria) => (
              <TextArea {...aria} name="legalNotice" rows={4} defaultValue={values.legalNotice} />
            )}
          </Field>
        </div>
      </Card>

      <Card title="Kategorien">
        <fieldset>
          <legend className="sr-only">Kategorien zuordnen</legend>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((category) => (
              <label
                key={category.id}
                className="flex cursor-pointer items-center gap-3 border border-line px-3 py-2.5 text-sm text-cream transition-colors hover:border-line-strong"
              >
                <input
                  type="checkbox"
                  name="categoryIds"
                  value={category.id}
                  defaultChecked={values.categoryIds.includes(category.id)}
                  className="size-4 shrink-0 cursor-pointer appearance-none border border-line-strong bg-ink
                    checked:border-gold checked:bg-gold
                    focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
                />
                <span>
                  {category.name}
                  <span className="ml-2 text-xs text-subtle">
                    {category.kind === "GENDER" ? "Zielgruppe" : "Art"}
                  </span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>
      </Card>

      <Card title="Kennzeichnung und Sichtbarkeit">
        <div className="flex flex-col gap-4">
          <Checkbox
            id="isActive"
            name="isActive"
            defaultChecked={values.isActive}
            label="Im Shop sichtbar"
          />
          <Checkbox
            id="isBestseller"
            name="isBestseller"
            defaultChecked={values.isBestseller}
            label="Als Bestseller kennzeichnen (erscheint auf der Startseite)"
          />
          <Checkbox
            id="isNew"
            name="isNew"
            defaultChecked={values.isNew}
            label="Als „Neu“ kennzeichnen"
          />
          <Checkbox
            id="isAlternative"
            name="isAlternative"
            defaultChecked={values.isAlternative}
            label="Duftalternative – kein Originalprodukt (blendet den rechtlichen Hinweis auf der Produktseite ein)"
          />
          <Checkbox
            id="isDemo"
            name="isDemo"
            defaultChecked={values.isDemo}
            label="Demo-Datensatz (wird im Shop als Demo gekennzeichnet)"
          />
        </div>
      </Card>

      <Card title="Suchmaschinen (SEO)">
        <div className="flex flex-col gap-5">
          <Field
            id="metaTitle"
            label="Seitentitel"
            hint="Leer lassen, um den Produktnamen zu verwenden. Ideal bis 60 Zeichen."
          >
            {(aria) => (
              <TextInput {...aria} name="metaTitle" maxLength={70} defaultValue={values.metaTitle} />
            )}
          </Field>

          <Field
            id="metaDesc"
            label="Meta-Beschreibung"
            hint="Erscheint in den Suchergebnissen. Ideal 120–160 Zeichen."
          >
            {(aria) => (
              <TextArea {...aria} name="metaDesc" maxLength={180} rows={3} defaultValue={values.metaDesc} />
            )}
          </Field>
        </div>
      </Card>

      <FormMessage state={state} />

      <div className="flex flex-wrap gap-3">
        <SubmitButton size="lg">
          {values.id ? "Änderungen speichern" : "Produkt anlegen"}
        </SubmitButton>
        <Link
          href="/admin/produkte"
          className="flex min-h-13 items-center px-5 text-sm text-muted underline underline-offset-4 hover:text-gold-light"
        >
          Abbrechen
        </Link>
      </div>

      {!values.id && (
        <p className="text-sm text-muted">
          Größen, Preise und Lagerbestände legst du im nächsten Schritt an –
          direkt nach dem Speichern.
        </p>
      )}
    </form>
  );
}
