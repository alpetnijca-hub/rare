import Link from "next/link";
import {
  AdminPageHeader,
  Card,
  EmptyRow,
  StatTile,
} from "@/components/admin/layout-parts";
import { minViewsForRate, productInterest } from "@/lib/product-stats";

export const dynamic = "force-dynamic";

const ZEITRAUM_TAGE = 30;

export default async function AdminInterestPage() {
  const zeilen = await productInterest(ZEITRAUM_TAGE);

  const aufrufe = zeilen.reduce((summe, zeile) => summe + zeile.views, 0);
  const warenkorb = zeilen.reduce((summe, zeile) => summe + zeile.cartAdds, 0);
  const verkauft = zeilen.reduce((summe, zeile) => summe + zeile.sold, 0);

  // Die eigentlich interessante Liste: viel angeschaut, selten im Warenkorb.
  // Dort steckt entweder ein Preis, der nicht passt, eine fehlende Abfüllung
  // oder eine Beschreibung, die nicht überzeugt.
  const auffaellig = zeilen
    .filter((zeile) => zeile.cartRate !== null && zeile.cartRate < 5)
    .slice(0, 3);

  return (
    <div className="flex flex-col gap-8">
      <AdminPageHeader
        title="Interesse"
        description={`Was in den letzten ${ZEITRAUM_TAGE} Tagen angeschaut wurde – und was davon im Warenkorb gelandet ist.`}
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatTile label="Seitenaufrufe" value={aufrufe} />
        <StatTile
          label="In den Warenkorb"
          value={warenkorb}
          tone="gold"
          hint={
            aufrufe > 0
              ? `${Math.round((warenkorb / aufrufe) * 100)} von 100 Aufrufen`
              : undefined
          }
        />
        <StatTile label="Verkaufte Stück" value={verkauft} tone="success" />
      </div>

      {auffaellig.length > 0 && (
        <Card
          title="Angeschaut, aber nicht mitgenommen"
          description="Diese Düfte werden oft aufgerufen und landen fast nie im Warenkorb. Ein Blick auf Preis, Abfüllgrößen und Beschreibung lohnt sich."
        >
          <ul className="flex flex-col gap-2 text-sm">
            {auffaellig.map((zeile) => (
              <li key={zeile.productId} className="text-cream">
                {zeile.name}{" "}
                <span className="text-subtle">
                  – {zeile.views} Aufrufe, {zeile.cartAdds}× im Warenkorb
                </span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <Card
        title="Alle Düfte"
        description="Nach Aufrufen sortiert."
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[40rem] border-collapse text-sm">
            <caption className="sr-only">
              Aufrufe, Warenkorb-Einträge und Verkäufe je Duft
            </caption>
            <thead>
              <tr className="border-b border-line text-left text-xs uppercase tracking-[0.1em] text-subtle">
                <th scope="col" className="pb-3 pr-4 font-medium">Duft</th>
                <th scope="col" className="pb-3 pr-4 text-right font-medium">Aufrufe</th>
                <th scope="col" className="pb-3 pr-4 text-right font-medium">Warenkorb</th>
                <th scope="col" className="pb-3 pr-4 text-right font-medium">Quote</th>
                <th scope="col" className="pb-3 text-right font-medium">Verkauft</th>
              </tr>
            </thead>
            <tbody>
              {zeilen.length === 0 ? (
                <EmptyRow>
                  Noch keine Aufrufe erfasst. Die Zählung beginnt mit dem
                  nächsten Besuch einer Produktseite.
                </EmptyRow>
              ) : (
                zeilen.map((zeile) => (
                  <tr key={zeile.productId} className="border-b border-line/60">
                    <td className="py-3 pr-4 text-cream">
                      <Link
                        href={`/produkt/${zeile.slug}`}
                        className="underline underline-offset-2 hover:text-gold-light"
                      >
                        {zeile.name}
                      </Link>
                      {!zeile.isActive && (
                        <span className="ml-2 text-xs text-subtle">(versteckt)</span>
                      )}
                    </td>
                    <td className="py-3 pr-4 text-right tabular-nums text-muted">
                      {zeile.views}
                    </td>
                    <td className="py-3 pr-4 text-right tabular-nums text-muted">
                      {zeile.cartAdds}
                    </td>
                    <td className="py-3 pr-4 text-right tabular-nums text-muted">
                      {/* Unter der Mindestzahl an Aufrufen ein Strich: „33 %“
                          bei drei Aufrufen sieht nach Erkenntnis aus und ist
                          keine. */}
                      {zeile.cartRate === null ? "–" : `${zeile.cartRate} %`}
                    </td>
                    <td className="py-3 text-right tabular-nums text-muted">
                      {zeile.sold}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <p className="text-xs leading-relaxed text-subtle">
        Gezählt werden nur Zahlen: kein Cookie, keine IP-Adresse, keine
        Kennung. Ein Duft zählt einmal je Besuch – wer ihn beim selben Besuch
        mehrmals öffnet, erhöht die Zahl nicht. Wer morgen wiederkommt, zählt
        wieder. Für den Vergleich zwischen Düften reicht das; eine
        Besucherzählung ist es nicht. Eine Quote erscheint erst ab{" "}
        {minViewsForRate} Aufrufen.
      </p>
    </div>
  );
}
