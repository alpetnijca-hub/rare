import { prisma } from "@/lib/prisma";

/**
 * Ersteinrichtung.
 *
 * Solange noch kein einziges Benutzerkonto existiert, ist der Adminbereich
 * unbenutzbar – ohne Terminalzugang gäbe es keinen Weg hinein. Für genau
 * diesen Fall gibt es die Seite `/admin/einrichtung`.
 *
 * Sie schaltet sich selbst ab, sobald ein Konto angelegt wurde: Es ist
 * bewusst kein Token nötig, sondern die Bedingung "es gibt noch niemanden".
 * Deshalb gilt: **direkt nach dem ersten Deployment einrichten.**
 */

export type SetupStatus =
  /** Es gibt noch kein Konto – das Formular wird angezeigt. */
  | { state: "needed" }
  /** Es gibt bereits ein Konto – die Seite verschwindet. */
  | { state: "done" }
  /**
   * Die Datenbank ist nicht erreichbar oder die Tabellen fehlen.
   * Dieser Fall wird sichtbar gemacht statt verschluckt: Beim ersten
   * Deployment ist genau das der wahrscheinlichste Fehler, und ohne
   * Terminalzugang ist eine lesbare Meldung die einzige Diagnose.
   */
  | { state: "unavailable"; reason: string };

/** Bringt eine Treiber-Fehlermeldung auf eine verständliche Ursache. */
function describeDatabaseError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);

  if (/does not exist|relation .* does not exist|P2021/i.test(message)) {
    return "Die Datenbank ist erreichbar, aber die Tabellen fehlen. Die Migrationen wurden noch nicht ausgeführt.";
  }
  if (/DATABASE_URL/i.test(message)) {
    return "Die Umgebungsvariable DATABASE_URL ist nicht gesetzt.";
  }
  if (/channel binding|SASL|authentication|password/i.test(message)) {
    return "Die Anmeldung an der Datenbank wurde abgelehnt. Prüfe Benutzer, Passwort und die Parameter am Ende der Verbindungszeichenfolge (z. B. channel_binding).";
  }
  if (/ENOTFOUND|EAI_AGAIN|getaddrinfo/i.test(message)) {
    return "Der Datenbank-Host wurde nicht gefunden. Prüfe die Adresse in DATABASE_URL auf Tippfehler.";
  }
  if (/ETIMEDOUT|ECONNREFUSED|timeout/i.test(message)) {
    return "Die Datenbank hat nicht geantwortet. Läuft der Server, und ist der Zugriff erlaubt?";
  }
  if (/SSL|sslmode|self.signed/i.test(message)) {
    return "Die verschlüsselte Verbindung kam nicht zustande. Bei Neon und Supabase muss sslmode=require in der Verbindungszeichenfolge stehen.";
  }
  return message.slice(0, 300);
}

export async function getSetupStatus(): Promise<SetupStatus> {
  try {
    const users = await prisma.user.count();
    return users === 0 ? { state: "needed" } : { state: "done" };
  } catch (error) {
    console.error(
      "[einrichtung] Datenbank nicht erreichbar:",
      error instanceof Error ? error.message : "unbekannt",
    );
    return { state: "unavailable", reason: describeDatabaseError(error) };
  }
}

/** Kurzform für Stellen, die nur wissen müssen, ob eingerichtet werden muss. */
export async function needsInitialSetup(): Promise<boolean> {
  return (await getSetupStatus()).state === "needed";
}
