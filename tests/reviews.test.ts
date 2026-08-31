import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import { displayName, isRating, ratingMax } from "@/lib/reviews";
import { publishedReviews, reviewSummary } from "@/lib/review-queries";
import { reviewSchema } from "@/lib/validation";

/**
 * Bewertungen.
 *
 * Der entscheidende Punkt ist nicht die Anzeige, sondern was gezählt wird:
 * Der Durchschnitt auf der Produktseite darf ausschliesslich freigegebene
 * Bewertungen enthalten. Rechnete er unfreigegebene mit, stünde dort eine
 * Zahl, die niemand geprüft hat – und die sich beim nächsten Klick ändert.
 */
const slug = "vitest-bewertungsduft";

async function raeumeAuf() {
  await prisma.product.deleteMany({ where: { slug } });
}

let productId = "";

beforeEach(async () => {
  await raeumeAuf();
  const produkt = await prisma.product.create({
    data: {
      slug,
      name: "Bewertungsduft",
      description: "Ein Duft für die Prüfung der Bewertungen.",
      fragranceFamily: "ORIENTAL",
      kind: "PARFUM",
      isActive: true,
    },
  });
  productId = produkt.id;
});

afterAll(raeumeAuf);

/** Legt eine Bewertung ohne echte Bestellung an – nur für die Auswertung. */
async function bewertung(
  rating: number,
  status: "PENDING" | "PUBLISHED" | "REJECTED",
  orderId: string,
) {
  await prisma.review.create({
    data: {
      productId,
      orderId,
      rating,
      authorName: "Test T.",
      status,
      publishedAt: status === "PUBLISHED" ? new Date() : null,
    },
  });
}

async function bestellungen(anzahl: number): Promise<string[]> {
  const adresse = await prisma.address.create({
    data: {
      type: "SHIPPING",
      firstName: "Anna",
      lastName: "Muster",
      street: "Bahnhofstrasse",
      houseNumber: "1",
      postalCode: "8001",
      city: "Zürich",
      country: "CH",
    },
  });

  const ids: string[] = [];
  for (let i = 0; i < anzahl; i++) {
    const order = await prisma.order.create({
      data: {
        orderNumber: `VT-REV-${Date.now()}-${i}`,
        email: "kundin@example.ch",
        status: "DELIVERED",
        subtotalCents: 1000,
        shippingCents: 0,
        taxCents: 0,
        totalCents: 1000,
        shippingMethodKey: "post",
        shippingMethodLabel: "Post",
        shippingMinDays: 1,
        shippingMaxDays: 3,
        shippingAddressId: adresse.id,
        billingAddressId: adresse.id,
      },
    });
    ids.push(order.id);
  }
  return ids;
}

describe("Sternzahl", () => {
  it("nimmt 1 bis 5 an", () => {
    for (let wert = 1; wert <= ratingMax; wert++) {
      expect(isRating(wert), `${wert}`).toBe(true);
    }
  });

  it("weist alles andere ab", () => {
    for (const wert of [0, 6, -1, 3.5, "4", null]) {
      expect(isRating(wert), `${wert}`).toBe(false);
    }
  });

  it("prüft die Grenzen auch im Formular", () => {
    expect(reviewSchema.safeParse({ productId: "a", rating: "0" }).success).toBe(false);
    expect(reviewSchema.safeParse({ productId: "a", rating: "6" }).success).toBe(false);
    expect(reviewSchema.safeParse({ productId: "a", rating: "4" }).success).toBe(true);
  });
});

describe("Anzeigename", () => {
  it("kürzt den Nachnamen auf den ersten Buchstaben", () => {
    // Der volle Name gehört nicht unter eine öffentliche Bewertung.
    expect(displayName("Anna", "Muster")).toBe("Anna M.");
  });

  it("kommt ohne Nachnamen aus", () => {
    expect(displayName("Anna", "")).toBe("Anna");
  });

  it("hat einen Ersatz, wenn gar nichts dasteht", () => {
    expect(displayName("", "")).toBe("Kundin oder Kunde");
  });
});

describe("Durchschnitt", () => {
  it("rechnet nur mit freigegebenen Bewertungen", async () => {
    const [a, b, c] = await bestellungen(3);
    await bewertung(5, "PUBLISHED", a);
    await bewertung(3, "PUBLISHED", b);
    // Diese beiden dürfen den Schnitt nicht bewegen.
    await bewertung(1, "PENDING", c);

    const zusammenfassung = await reviewSummary(productId);

    expect(zusammenfassung.count).toBe(2);
    expect(zusammenfassung.average).toBe(4);
  });

  it("meldet ohne Bewertungen keinen Durchschnitt", async () => {
    const zusammenfassung = await reviewSummary(productId);

    // Bewusst `null` und nicht 0: „0 von 5“ sähe aus wie eine sehr schlechte
    // Bewertung, wo in Wahrheit gar keine vorliegt.
    expect(zusammenfassung.count).toBe(0);
    expect(zusammenfassung.average).toBeNull();
  });

  it("zeigt nur freigegebene Bewertungen im Shop", async () => {
    const [a, b] = await bestellungen(2);
    await bewertung(5, "PUBLISHED", a);
    await bewertung(2, "REJECTED", b);

    const liste = await publishedReviews(productId);

    expect(liste).toHaveLength(1);
    expect(liste[0]?.rating).toBe(5);
  });

  it("zählt jede Sternzahl einzeln", async () => {
    const [a, b, c] = await bestellungen(3);
    await bewertung(5, "PUBLISHED", a);
    await bewertung(5, "PUBLISHED", b);
    await bewertung(4, "PUBLISHED", c);

    const { distribution } = await reviewSummary(productId);

    expect(distribution.find((e) => e.rating === 5)?.count).toBe(2);
    expect(distribution.find((e) => e.rating === 4)?.count).toBe(1);
    expect(distribution.find((e) => e.rating === 1)?.count).toBe(0);
  });
});

describe("Eine Bewertung je Bestellung und Duft", () => {
  it("lässt keine zweite zu", async () => {
    const [a] = await bestellungen(1);
    await bewertung(5, "PUBLISHED", a);

    await expect(bewertung(1, "PUBLISHED", a)).rejects.toThrow();
  });
});
