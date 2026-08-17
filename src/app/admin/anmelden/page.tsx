import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/admin/login-form";
import { getAdminUser } from "@/lib/auth-guard";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: "Anmeldung",
  robots: { index: false, follow: false },
};

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string; error?: string }>;
}) {
  const { callbackUrl, error } = await searchParams;

  // Bereits angemeldet? Direkt ins Dashboard.
  const user = await getAdminUser();
  if (user) redirect(callbackUrl ?? "/admin");

  return (
    <div className="flex min-h-dvh items-center justify-center bg-ink px-5 py-16">
      <div className="w-full max-w-md">
        <div className="mb-10 text-center">
          <p className="font-display text-2xl tracking-[0.3em] text-gold">RARE</p>
          <p className="text-[10px] tracking-[0.45em] text-muted">SCENTS</p>
          <h1 className="mt-8 text-3xl">Interner Bereich</h1>
          <p className="mt-3 text-sm text-muted">
            Bitte melde dich mit deinen Zugangsdaten an.
          </p>
        </div>

        <LoginForm callbackUrl={callbackUrl ?? "/admin"} initialError={error} />

        <p className="mt-8 text-center text-xs leading-relaxed text-subtle">
          Dieser Bereich ist ausschliesslich für Mitarbeitende von{" "}
          {siteConfig.name}. Zugriffe werden protokolliert.
        </p>
      </div>
    </div>
  );
}
