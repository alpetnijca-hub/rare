import { applyScentWorldsAction } from "@/app/admin/actions";
import { ConfirmSubmit } from "@/components/admin/ui";
import type { ScentWorldPlan } from "@/lib/scent-world-sync";

/**
 * Vorschau auf die Duftwelten.
 *
 * Bewusst erst zeigen, dann ausführen: Eine Schaltfläche, die stillschweigend
 * das halbe Sortiment umsortiert, ist unheimlich. Hier steht vorher da, welcher
 * Duft in welche Welt wandert und welche Note den Ausschlag gegeben hat.
 */
export function ScentWorldPanel({ plan }: { plan: ScentWorldPlan }) {
  const geaendert = plan.products.filter((produkt) => produkt.changed);

  return (
    <div className="flex flex-col gap-5">
      <p className="text-sm leading-relaxed text-muted">
        Der Shop schaut sich die Kopf-, Herz- und Basisnoten aller Düfte an und
        sortiert sie in Duftwelten – „Vanille, Tonkabohne, Karamell“ ergibt
        <em className="not-italic text-cream"> Süss &amp; Gourmand</em>,
        „Oud, Zeder, Vetiver“ ergibt
        <em className="not-italic text-cream"> Holzig &amp; Oud</em>. Jeder Duft
        landet in höchstens zwei Welten. Deine eigenen Zuordnungen wie „Damen“
        oder „Herren“ bleiben unangetastet.
      </p>

      {plan.products.length === 0 && plan.withoutWorld.length === 0 ? (
        <p className="border border-dashed border-line px-5 py-8 text-center text-sm text-muted">
          Noch keine eigenen Produkte vorhanden. Sobald Düfte mit Duftnoten
          angelegt sind, erscheint hier der Vorschlag.
        </p>
      ) : (
        <>
          {plan.missingCategories.length > 0 && (
            <div className="border border-line bg-charcoal px-4 py-3">
              <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted">
                Neu angelegt würden
              </p>
              <p className="mt-2 text-sm leading-relaxed text-cream">
                {plan.missingCategories.map((world) => world.name).join(", ")}
              </p>
            </div>
          )}

          {geaendert.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[36rem] border-collapse text-sm">
                <caption className="sr-only">
                  Vorgeschlagene Zuordnung der Düfte zu Duftwelten
                </caption>
                <thead>
                  <tr className="border-b border-line text-left text-xs uppercase tracking-[0.1em] text-subtle">
                    <th scope="col" className="pb-3 pr-4 font-medium">Duft</th>
                    <th scope="col" className="pb-3 pr-4 font-medium">Duftwelt</th>
                    <th scope="col" className="pb-3 font-medium">Wegen</th>
                  </tr>
                </thead>
                <tbody>
                  {geaendert.map((produkt) => (
                    <tr key={produkt.id} className="border-b border-line/60 align-top">
                      <td className="py-3 pr-4 text-cream">{produkt.name}</td>
                      <td className="py-3 pr-4 text-muted">
                        {produkt.worlds
                          .map((eintrag) => eintrag.world.name)
                          .join(", ")}
                        {produkt.removed.length > 0 && (
                          <span className="block text-xs text-subtle">
                            entfernt:{" "}
                            {produkt.removed.map((world) => world.name).join(", ")}
                          </span>
                        )}
                      </td>
                      <td className="py-3 text-xs leading-relaxed text-subtle">
                        {produkt.worlds
                          .flatMap((eintrag) => eintrag.matched)
                          .join(", ")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="border border-line bg-charcoal px-4 py-3 text-sm text-muted">
              Alle Düfte sind bereits richtig einsortiert. Es gibt nichts zu tun.
            </p>
          )}

          {plan.withoutWorld.length > 0 && (
            <p className="text-xs leading-relaxed text-subtle">
              Ohne Zuordnung bleiben:{" "}
              {plan.withoutWorld.map((produkt) => produkt.name).join(", ")}. Bei
              diesen Düften ist keine Duftnote hinterlegt, die zu einer Welt
              passt – trag im Produkt Kopf- und Herznoten wie „Zitrone“, „Rose“
              oder „Vanille“ ein.
            </p>
          )}

          {geaendert.length > 0 && (
            <form action={applyScentWorldsAction}>
              <ConfirmSubmit
                message={`${geaendert.length} Duft${
                  geaendert.length === 1 ? "" : "e"
                } neu einsortieren?`}
                variant="primary"
              >
                Duftwelten übernehmen
              </ConfirmSubmit>
            </form>
          )}
        </>
      )}
    </div>
  );
}
