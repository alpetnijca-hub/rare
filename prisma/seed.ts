/**
 * Startdaten für die lokale Entwicklung.
 *
 * Legt ein Adminkonto an und spielt die Demo-Inhalte ein. Die Demo-Daten
 * selbst stehen in src/lib/demo-data.ts, die Einspiellogik in
 * src/lib/demo-seed.ts – dieselbe, die auch der Adminbereich verwendet.
 *
 * Aufruf:  npm run db:seed
 */

import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import { installDemoData } from "../src/lib/demo-seed";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL ?? "",
});
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Seed wird ausgeführt …\n");

  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? "admin@rare-scents.local";
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? "AendereMich2026!";

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    create: {
      email: adminEmail,
      name: "Shop-Administration",
      passwordHash: await bcrypt.hash(adminPassword, 12),
      role: "ADMIN",
    },
    update: {},
  });
  console.log(`Adminkonto: ${admin.email}`);

  const result = await installDemoData(prisma);
  console.log(`${result.categories} Kategorien angelegt`);
  console.log(`${result.products} Demo-Produkte mit ${result.variants} Größen angelegt`);
  console.log(`${result.discountCodes} Rabattcodes angelegt`);

  console.log("\nSeed abgeschlossen.");
  console.log("---------------------------------------------");
  console.log(`Admin-Login:  ${adminEmail}`);
  console.log(`Passwort:     ${adminPassword}`);
  console.log("Bitte das Passwort nach der ersten Anmeldung ändern.");
  console.log("---------------------------------------------");
}

main()
  .catch((error) => {
    console.error("Seed fehlgeschlagen:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
