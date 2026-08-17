"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/components/cart/cart-provider";

/**
 * Wartet auf die Bestätigung der Zahlung durch den Stripe-Webhook.
 *
 * Der Browser darf eine Zahlung niemals selbst als erfolgreich melden.
 * Diese Komponente lädt die Seite deshalb nur neu, bis der Server einen
 * bestätigten Status liefert.
 */
export function OrderStatusPoller({
  intervalMs = 3000,
  maxAttempts = 20,
}: {
  intervalMs?: number;
  maxAttempts?: number;
}) {
  const router = useRouter();
  const { clear } = useCart();
  const [attempts, setAttempts] = useState(0);

  // Nach erfolgreicher Weiterleitung von Stripe ist der Warenkorb erledigt.
  useEffect(() => {
    clear();
  }, [clear]);

  useEffect(() => {
    if (attempts >= maxAttempts) return;

    const timer = window.setTimeout(() => {
      setAttempts((value) => value + 1);
      router.refresh();
    }, intervalMs);

    return () => window.clearTimeout(timer);
  }, [attempts, intervalMs, maxAttempts, router]);

  if (attempts >= maxAttempts) {
    return (
      <p className="mt-5 text-sm leading-relaxed text-amber-100/85">
        Die Bestätigung dauert momentan länger als üblich. Deine Zahlung ist
        dadurch nicht verloren – sobald sie bestätigt ist, erhältst du
        automatisch eine E-Mail. Du kannst diese Seite später erneut aufrufen
        oder uns bei Fragen kontaktieren.
      </p>
    );
  }

  return (
    <p className="mt-5 flex items-center gap-3 text-sm text-amber-100/85" role="status">
      <span
        aria-hidden="true"
        className="inline-block size-2 animate-pulse rounded-full bg-amber-300"
      />
      Bestätigung wird abgerufen … (Versuch {attempts + 1})
    </p>
  );
}
