import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SetupForm } from "@/components/admin/setup-form";
import { getSetupStatus } from "@/lib/setup";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: "Ersteinrichtung",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function SetupPage() {
  const status = await getSetupStatus();

  // Sobald ein Konto existiert, verschwindet diese Seite spurlos.
  if (status.state === "done") notFound();

  // Datenbankprobleme werden hier ausdrücklich angezeigt. Beim ersten
  // Deployment ist das der häufigste Fehler, und ohne Terminal wäre er
  // sonst nicht auffindbar.
  if (status.state === "unavailable") {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-ink px-5 py-16">
        <div className="w-full max-w-lg">
          <div className="mb-8 text-center">
            <p className="font-display text-2xl tracking-[0.3em] text-gold">
              RARE
            </p>
            <p className="text-[10px] tracking-[0.45em] text-muted">SCENTS</p>
          </div>

          <div className="border border-amber-800/60 bg-amber-950/25 p-6">
            <h1 className="mb-3 text-xl text-amber-200">
              Die Datenbank ist nicht erreichbar
            </h1>
            <p className="mb-4 text-sm leading-relaxed text-amber-100/85">
              Die Ersteinrichtung kann erst starten, wenn die Datenbank
              antwortet. Gemeldete Ursache:
            </p>
            <p className="mb-5 border-l-2 border-amber-700/60 bg-ink/40 py-2 pl-4 font-mono text-xs leading-relaxed text-amber-100">
              {status.reason}
            </p>
            <p className="text-sm leading-relaxed text-amber-100/85">
              Prüfe in den Projekteinstellungen die Variablen{" "}
              <code className="text-amber-200">DATABASE_URL</code> und{" "}
              <code className="text-amber-200">DIRECT_URL</code>. Nach einer
              Änderung ist ein erneutes Deployment nötig, damit sie greift.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-ink px-5 py-16">
      <div className="w-full max-w-md">
        <div className="mb-10 text-center">
          <p className="font-display text-2xl tracking-[0.3em] text-gold">RARE</p>
          <p className="text-[10px] tracking-[0.45em] text-muted">SCENTS</p>
          <h1 className="mt-8 text-3xl">Ersteinrichtung</h1>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            Es besteht noch kein Zugang zum internen Bereich. Lege hier dein
            Administratorkonto an.
          </p>
        </div>

        <SetupForm />

        <p className="mt-8 text-center text-xs leading-relaxed text-subtle">
          Diese Seite ist nur erreichbar, solange kein einziges Konto existiert.
          Danach ist sie automatisch nicht mehr aufrufbar. Richte den Zugang
          deshalb <strong className="font-medium text-muted">sofort</strong> nach
          dem ersten Deployment ein.
        </p>

        <p className="mt-4 text-center text-xs text-subtle">
          {siteConfig.name}
        </p>
      </div>
    </div>
  );
}
