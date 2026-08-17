import "dotenv/config";

/**
 * Testumgebung.
 *
 * Lädt `.env`, damit Integrationstests dieselbe Datenbank verwenden wie die
 * Entwicklungsumgebung. Reine Regel- und Rechentests laufen auch ohne
 * DATABASE_URL, weil der Prisma-Client erst beim ersten Zugriff verbindet.
 */

// Feste Zeitzone, damit Datumsausgaben reproduzierbar sind.
process.env.TZ = process.env.TZ ?? "Europe/Zurich";
