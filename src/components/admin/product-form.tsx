"use client";

import { useActionState } from "react";
import Link from "next/link";
import { idleState } from "@/app/admin/state";
import { saveProductAction } from "@/app/admin/actions";
import { FormMessage, SubmitButton } from "@/components/admin/ui";
import { AdvancedCard, Card } from "@/components/admin/layout-parts";
import { NewProductImages } from "@/components/admin/new-product-images";
import { commonSizes } from "@/config/product-defaults";
import { Checkbox, Field, Select, TextArea, TextInput } from "@/components/ui/field";
import { familyLabels, fragranceFamilies, kindLabels, productKinds } from "@/lib/catalog";
import { slugify } from "@/lib/utils";
import {
  alternativeNotice,
  defaultUsage,
  ingredientsTemplate,
} from "@/config/product-defaults";

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
  cloudinaryEnabled,
}: {
  values: ProductFormValues;
  categories: Array<{ id: string; name: string; kind: string }>;
  /** Steuert, ob der Direktupload angeboten wird. */
  cloudinaryEnabled: boolean;
}) {
  const action = saveProductAction.bind(null, values.id ?? null);
  const [state, formAction] = useActionState(action, idleState);

  return (
    <form action={formAction} className="flex flex-col gap-6">
      <Card title="Grunddaten">
        <div className="flex flex-col gap-5">
          <div>
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
            hint="Vorausgefüllt mit den üblichen Warnhinweisen. Die INCI-Liste oben musst du je Duft von der Verpackung übernehmen."
          >
            {(aria) => (
              <TextArea
                {...aria}
                name="ingredients"
                rows={7}
                defaultValue={values.ingredients || (values.id ? "" : ingredientsTemplate)}
              />
            )}
          </Field>

          <Field
            id="usage"
            label="Anwendungshinweise"
            hint="Vorausgefüllt – passt für die meisten Düfte."
          >
            {(aria) => (
              <TextArea
                {...aria}
                name="usage"
                rows={4}
                defaultValue={values.usage || (values.id ? "" : defaultUsage)}
              />
            )}
          </Field>

          <Field
            id="legalNotice"
            label="Rechtlicher Hinweis"
            hint="Vorausgefüllt mit dem Standardtext für Duftalternativen. Bei Originalware kannst du das Feld leeren."
          >
            {(aria) => (
              <TextArea
                {...aria}
                name="legalNotice"
                rows={4}
                defaultValue={values.legalNotice || (values.id ? "" : alternativeNotice)}
              />
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

      {/* Bilder und erste Größe nur beim Anlegen. Beim Bearbeiten gibt es
          dafür weiter unten die vollständigen Verwaltungen. */}
      {!values.id && (
        <>
          <Card
            title="Bilder"
            description="Das erste Bild ist das Hauptbild und erscheint auf der Produktkarte."
          >
            <NewProductImages cloudinaryEnabled={cloudinaryEnabled} />
          </Card>

          <Card
            title="Erste Größe"
            description="Damit ist der Duft sofort bestellbar. Weitere Größen kannst du direkt danach ergänzen."
          >
            <div className="flex flex-col gap-5">
              <div>
                <p className="mb-2 text-xs font-medium uppercase tracking-[0.14em] text-muted">
                  Gängige Größen
                </p>
                <div className="flex flex-wrap gap-2">
                  {commonSizes.map((vorgabe) => (
                    <button
                      key={vorgabe.label}
                      type="button"
                      onClick={() => {
                        const setze = (id: string, wert: string) => {
                          const feld =
                            document.querySelector<HTMLInputElement>(`#${id}`);
                          if (feld) feld.value = wert;
                        };
                        setze("firstSize", vorgabe.label);
                        setze("firstVolumeMl", String(vorgabe.volumeMl));
                        const probe =
                          document.querySelector<HTMLInputElement>(
                            "#firstIsSample",
                          );
                        if (probe) probe.checked = vorgabe.isSample;
                      }}
                      className="border border-line px-3 py-1.5 text-xs text-cream transition-colors
                        hover:border-gold hover:text-gold-light
                        focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
                    >
                      {vorgabe.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Field id="firstSize" label="Größe" error={state.fields?.firstSize}>
                  {(aria) => (
                    <TextInput {...aria} name="firstSize" placeholder="50 ml" />
                  )}
                </Field>

                <Field
                  id="firstVolumeMl"
                  label="Volumen in ml"
                  error={state.fields?.firstVolumeMl}
                >
                  {(aria) => (
                    <TextInput
                      {...aria}
                      name="firstVolumeMl"
                      inputMode="numeric"
                      placeholder="50"
                    />
                  )}
                </Field>

                <Field
                  id="firstPrice"
                  label="Preis in CHF"
                  error={state.fields?.firstPrice}
                >
                  {(aria) => (
                    <TextInput {...aria} name="firstPrice" placeholder="49.90" />
                  )}
                </Field>

                <Field id="firstStock" label="Bestand">
                  {(aria) => (
                    <TextInput
                      {...aria}
                      name="firstStock"
                      inputMode="numeric"
                      placeholder="0"
                    />
                  )}
                </Field>
              </div>

              <Checkbox
                id="firstIsSample"
                name="firstIsSample"
                label="Probe oder Abfüllung zum Testen"
                hint="Erscheint auf der Produktseite unter „Zum Testen“ statt bei den Flakons."
              />

              <p className="text-xs leading-relaxed text-subtle">
                Die Felder dürfen leer bleiben – dann legst du die Größen im
                nächsten Schritt an. Die Artikelnummer vergibt der Shop
                automatisch.
              </p>
            </div>
          </Card>
        </>
      )}

      <AdvancedCard
        title="Weitere Einstellungen"
        description="Sichtbarkeit, Kennzeichnungen, Adresse und Suchmaschinen – alles hat sinnvolle Voreinstellungen."
      >
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-4">
            <Checkbox
              id="isActive"
              name="isActive"
              defaultChecked={values.isActive}
              label="Im Shop sichtbar"
              hint="Ausgeschaltet bleibt der Duft nur für dich sichtbar – praktisch, solange du noch Fotos oder Preise nachträgst."
            />
            <Checkbox
              id="isAlternative"
              name="isAlternative"
              defaultChecked={values.isAlternative}
              label="Duftalternative – kein Originalprodukt"
              hint="Blendet auf der Produktseite den rechtlichen Hinweis ein, dass es sich um ein eigenständiges Erzeugnis handelt."
            />
            <Checkbox
              id="isBestseller"
              name="isBestseller"
              defaultChecked={values.isBestseller}
              label="Als Bestseller kennzeichnen"
              hint="Erscheint dann auf der Startseite."
            />
            <Checkbox
              id="isNew"
              name="isNew"
              defaultChecked={values.isNew}
              label="Als „Neu“ kennzeichnen"
            />
            <Checkbox
              id="isDemo"
              name="isDemo"
              defaultChecked={values.isDemo}
              label="Demo-Datensatz"
              hint="Nur für Beispielinhalte. Solche Produkte lassen sich auf der Übersicht gesammelt entfernen."
            />
          </div>

          <Field
            id="slug"
            label="Adresse der Produktseite"
            required
            error={state.fields?.slug}
            hint="Wird automatisch aus dem Namen gebildet: /produkt/dein-slug"
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

          <Field
            id="metaTitle"
            label="Seitentitel für Suchmaschinen"
            hint="Leer lassen, um den Produktnamen zu verwenden."
          >
            {(aria) => (
              <TextInput {...aria} name="metaTitle" maxLength={70} defaultValue={values.metaTitle} />
            )}
          </Field>

          <Field
            id="metaDesc"
            label="Beschreibung für Suchmaschinen"
            hint="Erscheint in den Suchergebnissen. Leer lassen ist in Ordnung."
          >
            {(aria) => (
              <TextArea {...aria} name="metaDesc" maxLength={180} rows={3} defaultValue={values.metaDesc} />
            )}
          </Field>
        </div>
      </AdvancedCard>

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
