import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { siteConfig } from "@/config/site";

/** Abmeldung von einer Verfügbarkeits-Benachrichtigung. */
export async function GET(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("id");

  if (id) {
    await prisma.backInStockSubscription.deleteMany({ where: { id } });
  }

  return Response.redirect(`${siteConfig.url}/?benachrichtigung=abgemeldet`, 302);
}
