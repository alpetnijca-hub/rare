import { redirect } from "next/navigation";
import type { Role } from "@prisma/client";
import { auth } from "@/lib/auth";

export interface AdminSessionUser {
  id: string;
  email: string;
  name: string;
  role: Role;
}

/**
 * Prüft die Sitzung in Server Components, Server Actions und Route Handlern.
 * Die Middleware schützt bereits den Pfad – diese Funktion ist die zweite,
 * verbindliche Prüfung direkt vor dem Datenzugriff.
 */
export async function getAdminUser(): Promise<AdminSessionUser | null> {
  const session = await auth();
  const user = session?.user;

  if (!user?.id || !user.role) return null;
  if (user.role !== "ADMIN" && user.role !== "STAFF") return null;

  return {
    id: user.id,
    email: user.email ?? "",
    name: user.name ?? "",
    role: user.role,
  };
}

/** Leitet zur Anmeldung um, wenn keine gültige Admin-Sitzung besteht. */
export async function requireAdmin(
  redirectTo = "/admin",
): Promise<AdminSessionUser> {
  const user = await getAdminUser();
  if (!user) {
    redirect(`/admin/anmelden?callbackUrl=${encodeURIComponent(redirectTo)}`);
  }
  return user;
}

/** Nur für Aktionen, die ausschliesslich Inhaber ausführen dürfen. */
export async function requireRole(role: Role): Promise<AdminSessionUser> {
  const user = await requireAdmin();
  if (user.role !== role && user.role !== "ADMIN") {
    redirect("/admin?fehler=keine-berechtigung");
  }
  return user;
}

/** Variante für Route Handler: liefert 401 statt einer Weiterleitung. */
export async function requireAdminApi(): Promise<
  { ok: true; user: AdminSessionUser } | { ok: false; response: Response }
> {
  const user = await getAdminUser();
  if (!user) {
    return {
      ok: false,
      response: Response.json({ error: "Nicht angemeldet." }, { status: 401 }),
    };
  }
  return { ok: true, user };
}
