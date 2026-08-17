import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { siteConfig } from "@/config/site";

/**
 * Bestätigt eine Newsletter-Anmeldung (Double-Opt-in).
 * Der Token ist einmalig und wird nach der Bestätigung entwertet.
 */
export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");

  if (!token || token.length < 32) {
    return Response.redirect(`${siteConfig.url}/newsletter?status=ungueltig`, 302);
  }

  const subscription = await prisma.newsletterSubscription.findUnique({
    where: { confirmToken: token },
  });

  if (!subscription) {
    return Response.redirect(`${siteConfig.url}/newsletter?status=ungueltig`, 302);
  }

  await prisma.newsletterSubscription.update({
    where: { id: subscription.id },
    data: {
      confirmedAt: subscription.confirmedAt ?? new Date(),
      confirmToken: null,
      unsubscribedAt: null,
    },
  });

  return Response.redirect(`${siteConfig.url}/newsletter?status=bestaetigt`, 302);
}
