import { randomBytes } from "node:crypto";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { newsletterSchema } from "@/lib/validation";
import { rateLimit, rateLimits, tooManyRequests } from "@/lib/rate-limit";
import { clientIpFromHeaders, hashIp } from "@/lib/utils";
import { sendNewsletterConfirmEmail } from "@/lib/email";

const CONSENT_TEXT =
  "Ich möchte den Newsletter von Rare Scents erhalten und bin damit einverstanden, " +
  "dass meine E-Mail-Adresse zu diesem Zweck gespeichert wird. " +
  "Die Einwilligung kann jederzeit widerrufen werden.";

/**
 * Newsletter-Anmeldung mit Double-Opt-in.
 *
 * Ohne Bestätigungsklick wird niemals eine Werbe-E-Mail versendet.
 * Die Einwilligung wird mit Zeitpunkt und Wortlaut protokolliert.
 */
export async function POST(request: NextRequest) {
  const ip = clientIpFromHeaders(request.headers);

  const limit = await rateLimit(
    `newsletter:${ip ?? "unbekannt"}`,
    rateLimits.newsletter.limit,
    rateLimits.newsletter.windowMs,
  );
  if (!limit.success) return tooManyRequests(limit);

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return Response.json({ error: "Ungültige Anfrage." }, { status: 400 });
  }

  const parsed = newsletterSchema.safeParse(payload);
  if (!parsed.success) {
    return Response.json(
      {
        error:
          parsed.error.issues[0]?.message ??
          "Bitte E-Mail-Adresse und Einwilligung prüfen.",
      },
      { status: 400 },
    );
  }

  // Honeypot: Bots füllen das versteckte Feld aus. Wir antworten neutral,
  // damit der Bot keinen Hinweis auf die Erkennung bekommt.
  if (parsed.data.website) {
    return Response.json({ message: "Danke für deine Anmeldung." });
  }

  const { email } = parsed.data;

  try {
    const existing = await prisma.newsletterSubscription.findUnique({
      where: { email },
    });

    if (existing?.confirmedAt && !existing.unsubscribedAt) {
      return Response.json({
        message: "Diese Adresse ist bereits für den Newsletter angemeldet.",
      });
    }

    const confirmToken = randomBytes(32).toString("hex");

    await prisma.newsletterSubscription.upsert({
      where: { email },
      create: {
        email,
        consentText: CONSENT_TEXT,
        source: "website",
        ipHash: hashIp(ip),
        confirmToken,
      },
      update: {
        consentAt: new Date(),
        consentText: CONSENT_TEXT,
        confirmToken,
        unsubscribedAt: null,
      },
    });

    await sendNewsletterConfirmEmail(email, confirmToken);

    return Response.json({
      message:
        "Fast fertig: Bitte bestätige die Anmeldung über den Link in der E-Mail.",
    });
  } catch (error) {
    console.error(
      "[newsletter] Anmeldung fehlgeschlagen:",
      error instanceof Error ? error.message : "unbekannt",
    );
    return Response.json(
      { error: "Die Anmeldung hat nicht funktioniert. Bitte später erneut versuchen." },
      { status: 500 },
    );
  }
}
