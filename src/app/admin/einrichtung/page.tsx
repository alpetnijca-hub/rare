import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SetupForm } from "@/components/admin/setup-form";
import { needsInitialSetup } from "@/lib/setup";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: "Ersteinrichtung",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function SetupPage() {
  // Sobald ein Konto existiert, verschwindet diese Seite spurlos.
  if (!(await needsInitialSetup())) notFound();

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
