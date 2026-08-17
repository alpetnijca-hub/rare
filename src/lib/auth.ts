import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { authConfig } from "@/lib/auth.config";
import { loginSchema } from "@/lib/validation";
import { rateLimit, rateLimits } from "@/lib/rate-limit";

/**
 * Admin-Authentifizierung mit eigenen Zugangsdaten.
 *
 * - Passwörter werden ausschliesslich als bcrypt-Hash gespeichert.
 * - Fehlgeschlagene Anmeldungen sind rate-limitiert.
 * - Fehlermeldungen unterscheiden nicht zwischen "Benutzer unbekannt" und
 *   "Passwort falsch" (keine Benutzer-Enumeration).
 */
export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      name: "Zugangsdaten",
      credentials: {
        email: { label: "E-Mail", type: "email" },
        password: { label: "Passwort", type: "password" },
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const { email, password } = parsed.data;

        const limit = await rateLimit(
          `login:${email}`,
          rateLimits.login.limit,
          rateLimits.login.windowMs,
        );
        if (!limit.success) return null;

        const user = await prisma.user.findUnique({ where: { email } });

        // Auch bei unbekanntem Benutzer wird gehasht, damit die Antwortzeit
        // keine Rückschlüsse auf existierende Konten zulässt.
        const hash =
          user?.passwordHash ??
          "$2a$12$invalidinvalidinvalidinvalidinvalidinvalidinvalidinvaliduu";

        const passwordMatches = await bcrypt.compare(password, hash);

        if (!user || !user.isActive || !passwordMatches) return null;

        await prisma.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() },
        });

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        };
      },
    }),
  ],
});

/** Erzeugt einen bcrypt-Hash mit ausreichendem Kostenfaktor. */
export function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}
