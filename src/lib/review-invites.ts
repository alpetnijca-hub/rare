/**
 * Verschickt die Bitte um eine Bewertung.
 *
 * Bewusst als Zeitplan und nicht beim Statuswechsel: Nicht jede Bestellung
 * wird von Hand auf „zugestellt“ gesetzt, und wer sich darauf verlässt,
 * verschickt am Ende gar nichts. Ein täglicher Lauf sucht sich die
 * Bestellungen selbst zusammen.
 */

import { prisma } from "@/lib/prisma";
import { sendReviewInviteEmail } from "@/lib/email";
import { reviewInviteAfterDays } from "@/lib/reviews";

/** Höchstens so viele Nachrichten je Lauf – gegen einen Stau nach einer Panne. */
const maxProLauf = 50;

export async function sendDueReviewInvites(): Promise<number> {
  const stichtag = new Date();
  stichtag.setDate(stichtag.getDate() - reviewInviteAfterDays);

  const faellig = await prisma.order.findMany({
    where: {
      reviewInviteSentAt: null,
      status: { in: ["SHIPPED", "DELIVERED"] },
      // Die Bestellung muss alt genug sein. Der Versandzeitpunkt steht an der
      // Sendung; gibt es keine, zählt das Bestelldatum.
      OR: [
        { shipments: { some: { createdAt: { lte: stichtag } } } },
        { shipments: { none: {} }, createdAt: { lte: stichtag } },
      ],
    },
    select: { id: true },
    orderBy: { createdAt: "asc" },
    take: maxProLauf,
  });

  let verschickt = 0;

  for (const order of faellig) {
    try {
      await sendReviewInviteEmail(order.id);
      verschickt++;
    } catch (error) {
      // Eine gescheiterte Nachricht darf den Rest nicht aufhalten. Da
      // `reviewInviteSentAt` nur nach erfolgreichem Versand gesetzt wird,
      // versucht es der nächste Lauf erneut.
      console.error(
        "[bewertungen] Einladung fehlgeschlagen:",
        error instanceof Error ? error.message : "unbekannt",
      );
    }
  }

  return verschickt;
}
