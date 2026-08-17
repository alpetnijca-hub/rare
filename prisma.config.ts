import path from "node:path";
import "dotenv/config";
import { defineConfig } from "prisma/config";

/**
 * Prisma 7 liest Verbindungsdaten nicht mehr aus `schema.prisma`, sondern aus
 * dieser Datei. Sie gilt nur für CLI-Befehle (migrate, studio, db push).
 * Zur Laufzeit verbindet sich der Client über den Treiber-Adapter in
 * `src/lib/prisma.ts`.
 */
export default defineConfig({
  schema: path.join("prisma", "schema.prisma"),
  migrations: {
    path: path.join("prisma", "migrations"),
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    // DIRECT_URL umgeht den Connection-Pooler und ist bei Supabase/Neon
    // für Migrationen erforderlich. Sonst greift DATABASE_URL.
    url: process.env.DIRECT_URL || process.env.DATABASE_URL || "",
  },
});
