import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { siteConfig } from "@/config/site";
import { contactSchema } from "@/lib/validation";
import { rateLimit, rateLimits, tooManyRequests } from "@/lib/rate-limit";
import { clientIpFromHeaders, hashIp, sanitizeText } from "@/lib/utils";
import { sendEmail } from "@/lib/email";
import { escapeHtml } from "@/emails/layout";

/**
 * Kontaktformular.
 *
 * Spam-Schutz: Honeypot-Feld, Rate-Limit pro IP und Längenbegrenzung.
 * Die Nachricht wird gespeichert und zusätzlich per E-Mail zugestellt.
 */
export async function POST(request: NextRequest) {
  const ip = clientIpFromHeaders(request.headers);

  const limit = await rateLimit(
    `kontakt:${ip ?? "unbekannt"}`,
    rateLimits.contact.limit,
    rateLimits.contact.windowMs,
  );
  if (!limit.success) return tooManyRequests(limit);

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return Response.json({ error: "Ungültige Anfrage." }, { status: 400 });
  }

  const parsed = contactSchema.safeParse(payload);
  if (!parsed.success) {
    return Response.json(
      {
        error: parsed.error.issues[0]?.message ?? "Bitte prüfe deine Eingaben.",
      },
      { status: 400 },
    );
  }

  // Honeypot: neutrale Antwort, damit Bots nichts lernen.
  if (parsed.data.website) {
    return Response.json({ message: "Danke für deine Nachricht." });
  }

  const name = sanitizeText(parsed.data.name, 80);
  const subject = sanitizeText(parsed.data.subject, 140);
  const message = sanitizeText(parsed.data.message, 2000);

  try {
    await prisma.contactMessage.create({
      data: {
        name,
        email: parsed.data.email,
        subject,
        message,
        ipHash: hashIp(ip),
      },
    });

    // Weiterleitung an die Geschäftsadresse. Antworten geht direkt an den Kunden.
    await sendEmail({
      to: process.env.SHOP_NOTIFICATION_EMAIL ?? siteConfig.contact.email,
      replyTo: parsed.data.email,
      subject: `Kontaktanfrage: ${subject}`,
      text: `Von: ${name} <${parsed.data.email}>\n\n${message}`,
      html: `
        <p><strong>Von:</strong> ${escapeHtml(name)} &lt;${escapeHtml(parsed.data.email)}&gt;</p>
        <p><strong>Betreff:</strong> ${escapeHtml(subject)}</p>
        <hr />
        <p style="white-space:pre-line;">${escapeHtml(message)}</p>
      `,
    });

    return Response.json({
      message:
        "Danke für deine Nachricht. Wir melden uns so schnell wie möglich zurück.",
    });
  } catch (error) {
    console.error(
      "[kontakt] Nachricht konnte nicht verarbeitet werden:",
      error instanceof Error ? error.message : "unbekannt",
    );
    return Response.json(
      { error: "Die Nachricht konnte nicht gesendet werden." },
      { status: 500 },
    );
  }
}
