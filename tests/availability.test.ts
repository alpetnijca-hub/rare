import { describe, expect, it } from "vitest";
import {
  addBusinessDays,
  availableStock,
  combinedDelivery,
  formatDeliveryRange,
  getAvailability,
  type AvailabilityInput,
} from "@/lib/availability";

/**
 * Verfügbarkeitslogik.
 *
 * Diese Regeln entscheiden, ob ein Artikel in den Warenkorb gelegt werden
 * darf. Fehler hier führen zu Überverkauf oder zu unnötig gesperrter Ware.
 */

function variant(overrides: Partial<AvailabilityInput> = {}): AvailabilityInput {
  return {
    stock: 10,
    reservedStock: 0,
    lowStockThreshold: 3,
    isActive: true,
    preorderEnabled: false,
    restockDate: null,
    deliveryMinDays: 1,
    deliveryMaxDays: 2,
    ...overrides,
  };
}

describe("availableStock", () => {
  it("zieht reservierte Ware vom physischen Bestand ab", () => {
    expect(availableStock({ stock: 10, reservedStock: 4 })).toBe(6);
  });

  it("wird nie negativ", () => {
    expect(availableStock({ stock: 2, reservedStock: 9 })).toBe(0);
  });

  it("behandelt negativen Bestand (Rückstand) als nicht verfügbar", () => {
    expect(availableStock({ stock: -5, reservedStock: 0 })).toBe(0);
  });
});

describe("getAvailability", () => {
  it("meldet ausreichenden Bestand als lieferbar", () => {
    const result = getAvailability(variant({ stock: 20 }));

    expect(result.state).toBe("IN_STOCK");
    expect(result.purchasable).toBe(true);
    expect(result.label).toBe("Auf Lager – Versand in 1–2 Werktagen");
  });

  it("meldet knappen Bestand mit konkreter Stückzahl", () => {
    const result = getAvailability(variant({ stock: 2, lowStockThreshold: 3 }));

    expect(result.state).toBe("LOW_STOCK");
    expect(result.purchasable).toBe(true);
    expect(result.label).toBe("Nur noch 2 Stück verfügbar");
    expect(result.maxQuantity).toBe(2);
  });

  it("berücksichtigt Reservierungen bei der Warnschwelle", () => {
    // 10 physisch, 8 reserviert -> nur 2 frei, also knapper Bestand.
    const result = getAvailability(variant({ stock: 10, reservedStock: 8 }));

    expect(result.state).toBe("LOW_STOCK");
    expect(result.available).toBe(2);
  });

  it("erlaubt Vorbestellungen ohne Bestand", () => {
    const result = getAvailability(
      variant({
        stock: 0,
        preorderEnabled: true,
        deliveryMinDays: 10,
        deliveryMaxDays: 18,
      }),
    );

    expect(result.state).toBe("PREORDER");
    expect(result.purchasable).toBe(true);
    expect(result.isPreorder).toBe(true);
    expect(result.label).toBe(
      "Vorbestellbar – voraussichtlicher Versand in 10–18 Werktagen",
    );
  });

  it("zeigt bei fehlendem Bestand das Wiederverfügbarkeitsdatum", () => {
    const restockDate = new Date("2026-12-24T12:00:00Z");
    const result = getAvailability(variant({ stock: 0, restockDate }));

    expect(result.state).toBe("OUT_OF_STOCK");
    expect(result.purchasable).toBe(false);
    expect(result.label).toContain("voraussichtlich wieder verfügbar ab");
    expect(result.label).toContain("24.12.2026");
  });

  it("meldet ohne Bestand, Vorbestellung und Datum als nicht bestellbar", () => {
    const result = getAvailability(variant({ stock: 0 }));

    expect(result.state).toBe("UNAVAILABLE");
    expect(result.purchasable).toBe(false);
    expect(result.label).toBe("Derzeit nicht bestellbar");
  });

  it("behandelt ein bereits verstrichenes Wiederverfügbarkeitsdatum als nicht bestellbar", () => {
    const result = getAvailability(
      variant({ stock: 0, restockDate: new Date("2020-01-01T00:00:00Z") }),
    );

    expect(result.state).toBe("UNAVAILABLE");
    expect(result.purchasable).toBe(false);
  });

  it("sperrt deaktivierte Varianten trotz vorhandenem Bestand", () => {
    const result = getAvailability(variant({ stock: 50, isActive: false }));

    expect(result.state).toBe("UNAVAILABLE");
    expect(result.purchasable).toBe(false);
    expect(result.maxQuantity).toBe(0);
  });

  it("begrenzt die Höchstmenge auf den freien Bestand", () => {
    const result = getAvailability(variant({ stock: 7, reservedStock: 2 }));
    expect(result.maxQuantity).toBe(5);
  });

  it("deckelt die Höchstmenge auch bei sehr grossem Bestand", () => {
    const result = getAvailability(variant({ stock: 5000 }));
    expect(result.maxQuantity).toBe(20);
  });
});

describe("formatDeliveryRange", () => {
  it("fasst gleiche Werte zu einer Angabe zusammen", () => {
    expect(formatDeliveryRange(1, 1)).toBe("1 Werktag");
    expect(formatDeliveryRange(3, 3)).toBe("3 Werktagen");
  });

  it("gibt eine Spanne aus", () => {
    expect(formatDeliveryRange(1, 3)).toBe("1–3 Werktagen");
  });
});

describe("combinedDelivery", () => {
  it("nimmt die langsamste Position als Massstab", () => {
    const result = combinedDelivery([
      { deliveryMinDays: 1, deliveryMaxDays: 2 },
      { deliveryMinDays: 10, deliveryMaxDays: 18 },
    ]);

    expect(result.minDays).toBe(10);
    expect(result.maxDays).toBe(18);
    expect(result.mixed).toBe(true);
  });

  it("erkennt einheitliche Lieferzeiten", () => {
    const result = combinedDelivery([
      { deliveryMinDays: 1, deliveryMaxDays: 2 },
      { deliveryMinDays: 1, deliveryMaxDays: 2 },
    ]);

    expect(result.mixed).toBe(false);
  });

  it("kommt mit einem leeren Warenkorb zurecht", () => {
    expect(combinedDelivery([])).toEqual({ minDays: 0, maxDays: 0, mixed: false });
  });
});

describe("addBusinessDays", () => {
  it("überspringt Wochenenden", () => {
    // Freitag, 14.08.2026 + 1 Werktag = Montag, 17.08.2026
    const friday = new Date("2026-08-14T10:00:00Z");
    const result = addBusinessDays(friday, 1);

    expect(result.getDay()).toBe(1);
    expect(result.getDate()).toBe(17);
  });

  it("zählt mehrere Werktage korrekt über ein Wochenende", () => {
    const thursday = new Date("2026-08-13T10:00:00Z");
    const result = addBusinessDays(thursday, 3);

    // Do + 3 Werktage -> Fr, Mo, Di = 18.08.2026
    expect(result.getDate()).toBe(18);
  });
});
