"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";

/**
 * Legt das allererste Administratorkonto an.
 *
 * Sicherheitsanker ist die Bedingung "es gibt noch kein einziges Konto".
 * Sie wird nicht nur beim Anzeigen der Seite geprüft, sondern noch einmal
 * hier – Server Actions sind ein eigener Einstiegspunkt und dürfen sich
 * niemals darauf verlassen, dass vorher eine Seite gerendert wurde.
 */

export interface SetupState {
  ok: boolean;
  message?: string;
  fields?: Record<string, string>;
}

export const idleSetupState: SetupState = { ok: false };

const minPasswordLength = 12;

export async function createFirstAdmin(
  _previous: SetupState,
  formData: FormData,
): Promise<SetupState> {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const passwordRepeat = String(formData.get("passwordRepeat") ?? "");

  const fields: Record<string, string> = {};

  if (name.length < 2) {
    fields.name = "Bitte einen Namen eintragen.";
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    fields.email = "Bitte eine gültige E-Mail-Adresse eintragen.";
  }
  if (password.length < minPasswordLength) {
    fields.password = `Mindestens ${minPasswordLength} Zeichen.`;
  }
  if (password !== passwordRepeat) {
    fields.passwordRepeat = "Die beiden Passwörter stimmen nicht überein.";
  }

  if (Object.keys(fields).length > 0) {
    return { ok: false, message: "Bitte die markierten Felder prüfen.", fields };
  }

  const passwordHash = await hashPassword(password);

  try {
    await prisma.$transaction(async (tx) => {
      // Erneute Prüfung innerhalb der Transaktion: Zwei gleichzeitige
      // Aufrufe dürfen nicht zwei Konten anlegen.
      const existing = await tx.user.count();
      if (existing > 0) {
        throw new Error("ALREADY_SET_UP");
      }

      await tx.user.create({
        data: { name, email, passwordHash, role: "ADMIN", isActive: true },
      });
    });
  } catch (error) {
    if (error instanceof Error && error.message === "ALREADY_SET_UP") {
      return {
        ok: false,
        message:
          "Es besteht bereits ein Konto. Die Ersteinrichtung ist damit abgeschlossen.",
      };
    }

    console.error(
      "[einrichtung] Konto konnte nicht angelegt werden:",
      error instanceof Error ? error.message : "unbekannt",
    );
    return {
      ok: false,
      message:
        "Das Konto konnte nicht angelegt werden. Läuft die Datenbank und sind die Tabellen angelegt?",
    };
  }

  redirect("/admin/anmelden");
}
