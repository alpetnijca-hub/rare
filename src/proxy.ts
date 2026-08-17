import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";

/**
 * Schützt den gesamten Adminbereich (in Next.js 16 heisst diese Datei
 * "proxy", früher "middleware").
 *
 * Sie läuft in der Edge Runtime und verwendet deshalb nur die
 * providerfreie Basiskonfiguration ohne Prisma und bcrypt. Die endgültige
 * Rechteprüfung erfolgt zusätzlich serverseitig in `requireAdmin()`.
 */
const { auth: proxy } = NextAuth(authConfig);

export default proxy;

export const config = {
  matcher: ["/admin/:path*"],
};
