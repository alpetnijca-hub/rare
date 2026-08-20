import { describe, expect, it, beforeEach } from "vitest";
import { prisma } from "@/lib/prisma";
import { needsInitialSetup } from "@/lib/setup";
// bcrypt direkt, statt über @/lib/auth – dieses Modul zieht next-auth
// mitsamt Next-Server-Laufzeit nach, die es im Testkontext nicht gibt.
import bcrypt from "bcryptjs";

/**
 * Ersteinrichtung.
 *
 * Die Seite /admin/einrichtung hat keinen Token, sondern genau eine
 * Bedingung: Es darf noch kein einziges Konto geben. Diese Bedingung muss
 * verlässlich umschlagen, sobald das erste Konto existiert.
 */

const testEmail = "vitest-setup@example.com";

async function withoutUsers<T>(run: () => Promise<T>): Promise<T> {
  const existing = await prisma.user.findMany({ select: { id: true } });
  const backup = await prisma.user.findMany();

  await prisma.user.deleteMany({ where: { id: { in: existing.map((u) => u.id) } } });
  try {
    return await run();
  } finally {
    // Ursprüngliche Konten wiederherstellen.
    for (const user of backup) {
      await prisma.user.upsert({
        where: { id: user.id },
        create: user,
        update: user,
      });
    }
    await prisma.user.deleteMany({ where: { email: testEmail } });
  }
}

describe("needsInitialSetup", () => {
  beforeEach(async () => {
    await prisma.user.deleteMany({ where: { email: testEmail } });
  });

  it("ist wahr, solange kein Konto existiert", async () => {
    await withoutUsers(async () => {
      expect(await needsInitialSetup()).toBe(true);
    });
  });

  it("wird falsch, sobald das erste Konto angelegt ist", async () => {
    await withoutUsers(async () => {
      expect(await needsInitialSetup()).toBe(true);

      await prisma.user.create({
        data: {
          email: testEmail,
          name: "Testkonto",
          passwordHash: await bcrypt.hash("EinLangesTestpasswort!", 4),
          role: "ADMIN",
        },
      });

      // Ab hier ist die Einrichtungsseite nicht mehr erreichbar.
      expect(await needsInitialSetup()).toBe(false);
    });
  });

  it("bleibt falsch, wenn bereits Konten bestehen", async () => {
    await prisma.user.create({
      data: {
        email: testEmail,
        name: "Testkonto",
        passwordHash: await bcrypt.hash("EinLangesTestpasswort!", 4),
        role: "ADMIN",
      },
    });

    expect(await needsInitialSetup()).toBe(false);
  });
});
