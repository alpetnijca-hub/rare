/**
 * Legt einen Administrator an oder setzt dessen Passwort zurück.
 *
 * Aufruf:
 *   npm run admin:create -- --email chef@deine-domain.ch --name "Vorname Nachname"
 *
 * Ohne --password wird ein sicheres Passwort erzeugt und einmalig ausgegeben.
 * Passwörter werden ausschliesslich als bcrypt-Hash gespeichert.
 */

import "dotenv/config";
import { randomBytes } from "node:crypto";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL ?? "" }),
});

/** Liest ein benanntes Argument: --email wert */
function arg(name: string): string | undefined {
  const index = process.argv.indexOf(`--${name}`);
  if (index === -1) return undefined;
  return process.argv[index + 1];
}

/** Erzeugt ein zufälliges Passwort ohne verwechselbare Zeichen. */
function generatePassword(length = 20): string {
  const alphabet =
    "abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#%*-_";
  const bytes = randomBytes(length);
  let result = "";
  for (const byte of bytes) result += alphabet[byte % alphabet.length];
  return result;
}

async function main() {
  const email = arg("email")?.trim().toLowerCase();
  const name = arg("name")?.trim() ?? "Administrator";
  const role = (arg("role") ?? "ADMIN").toUpperCase();
  const providedPassword = arg("password");

  if (!email || !email.includes("@")) {
    console.error(
      "Bitte eine gültige E-Mail angeben:\n" +
        '  npm run admin:create -- --email chef@deine-domain.ch --name "Vorname Nachname"',
    );
    process.exit(1);
  }

  if (role !== "ADMIN" && role !== "STAFF") {
    console.error("--role muss ADMIN oder STAFF sein.");
    process.exit(1);
  }

  if (providedPassword && providedPassword.length < 12) {
    console.error("Das Passwort muss mindestens 12 Zeichen lang sein.");
    process.exit(1);
  }

  const password = providedPassword ?? generatePassword();
  const passwordHash = await bcrypt.hash(password, 12);

  const existing = await prisma.user.findUnique({ where: { email } });

  const user = await prisma.user.upsert({
    where: { email },
    create: { email, name, passwordHash, role, isActive: true },
    update: { name, passwordHash, role, isActive: true },
  });

  console.log("");
  console.log(existing ? "Passwort zurückgesetzt." : "Administrator angelegt.");
  console.log("---------------------------------------------");
  console.log(`E-Mail:   ${user.email}`);
  console.log(`Name:     ${user.name}`);
  console.log(`Rolle:    ${user.role}`);
  if (!providedPassword) {
    console.log(`Passwort: ${password}`);
    console.log("");
    console.log("Dieses Passwort wird nur einmal angezeigt.");
    console.log("Bitte sicher speichern (z. B. im Passwortmanager).");
  }
  console.log("---------------------------------------------");
  console.log("Anmeldung unter: /admin/anmelden");
  console.log("");
}

main()
  .catch((error) => {
    console.error("Fehlgeschlagen:", error instanceof Error ? error.message : error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
