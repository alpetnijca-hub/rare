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
export async function needsInitialSetup(): Promise<boolean> {
  try {
    const users = await prisma.user.count();
    return users === 0;
  } catch {
    // Datenbank nicht erreichbar oder Tabellen fehlen: Dann ist die
    // Einrichtung ohnehin nicht möglich, und die Seite bleibt verborgen.
    return false;
  }
}
