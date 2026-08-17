import type { NextAuthConfig } from "next-auth";

/**
 * Edge-taugliche Basiskonfiguration.
 *
 * Diese Datei darf weder Prisma noch bcrypt importieren, weil sie in der
 * Middleware (Edge Runtime) ausgeführt wird. Die eigentlichen Provider
 * liegen in `src/lib/auth.ts`.
 */
export const authConfig = {
  pages: {
    signIn: "/admin/anmelden",
    error: "/admin/anmelden",
  },
  session: {
    strategy: "jwt",
    // Admin-Sitzungen laufen nach 8 Stunden ab.
    maxAge: 8 * 60 * 60,
  },
  trustHost: true,
  providers: [],
  callbacks: {
    /**
     * Wird von der Middleware aufgerufen. Nur eingeloggte Benutzer mit einer
     * gültigen Rolle dürfen den Adminbereich sehen.
     */
    authorized({ auth, request }) {
      const isAdminArea = request.nextUrl.pathname.startsWith("/admin");
      const isLoginPage = request.nextUrl.pathname === "/admin/anmelden";

      if (!isAdminArea || isLoginPage) return true;

      const role = auth?.user?.role;
      return role === "ADMIN" || role === "STAFF";
    },
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.name = user.name;
        token.email = user.email;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = (token.id as string) ?? token.sub ?? "";
        session.user.role = token.role ?? "STAFF";
      }
      return session;
    },
  },
} satisfies NextAuthConfig;

export default authConfig;
