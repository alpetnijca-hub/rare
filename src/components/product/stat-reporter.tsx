"use client";

import { useEffect } from "react";
import { reportStat } from "@/lib/report-stat";

/**
 * Meldet einen Aufruf der Produktseite.
 *
 * Steht als unsichtbare Komponente auf der Produktseite. Bewusst im Browser
 * und nicht beim Rendern auf dem Server: Next.js lädt Produktseiten im
 * Voraus, sobald jemand mit der Maus über einen Link fährt – serverseitig
 * gezählt stünden dort Aufrufe von Seiten, die nie jemand geöffnet hat.
 */
export function StatReporter({ productId }: { productId: string }) {
  useEffect(() => {
    reportStat(productId, "ansicht");
  }, [productId]);

  return null;
}
