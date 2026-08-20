import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { envValue } from "@/lib/env";

/**
 * Prisma 7 verbindet sich über einen Treiber-Adapter. Der Adapter wird nur
 * einmal pro Prozess erzeugt; im Dev-Modus wird die Instanz am globalen Objekt
 * zwischengespeichert, damit Hot-Reloads keine Verbindungen leaken.
 */
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient(): PrismaClient {
  const connectionString = envValue(process.env.DATABASE_URL);
  if (!connectionString) {
    throw new Error("DATABASE_URL ist nicht gesetzt.");
  }

  const adapter = new PrismaPg({ connectionString });

  return new PrismaClient({
    adapter,
    // In Produktion nur Fehler protokollieren – keine Query-Parameter,
    // damit keine personenbezogenen Daten in den Logs landen.
    log:
      process.env.NODE_ENV === "development"
        ? ["warn", "error"]
        : ["error"],
  });
}

function getClient(): PrismaClient {
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = createPrismaClient();
  }
  return globalForPrisma.prisma;
}

/**
 * Der Client wird erst beim ersten Zugriff aufgebaut (Lazy Proxy).
 * Dadurch schlägt der reine Import dieses Moduls nicht fehl, wenn keine
 * Datenbank konfiguriert ist – wichtig für Unit-Tests und für Codepfade,
 * die gar keinen Datenbankzugriff benötigen.
 */
export const prisma = new Proxy({} as PrismaClient, {
  get(_target, property, receiver) {
    return Reflect.get(getClient(), property, receiver);
  },
  has(_target, property) {
    return Reflect.has(getClient(), property);
  },
});
