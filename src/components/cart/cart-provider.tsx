"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

/**
 * Warenkorb im Browser.
 *
 * Gespeichert werden ausschliesslich Varianten-ID und Menge – niemals Preise.
 * Alle Beträge berechnet der Server neu (siehe `src/lib/pricing.ts`).
 * Manipuliert jemand den localStorage, ändert das an den Preisen nichts.
 */

export interface CartItem {
  variantId: string;
  quantity: number;
}

interface CartContextValue {
  items: CartItem[];
  /** Erst `true`, wenn der localStorage gelesen wurde (verhindert Flackern). */
  ready: boolean;
  itemCount: number;
  addItem: (variantId: string, quantity?: number) => void;
  setQuantity: (variantId: string, quantity: number) => void;
  removeItem: (variantId: string) => void;
  clear: () => void;
  /** Entfernt Positionen, die der Server als nicht bestellbar meldet. */
  removeMany: (variantIds: string[]) => void;
  /** Zeitstempel der letzten Änderung – als Signal für Neuberechnungen. */
  revision: number;
}

const STORAGE_KEY = "rare-scents-cart-v1";
const MAX_QUANTITY = 20;

const CartContext = createContext<CartContextValue | null>(null);

function readStorage(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed
      .filter(
        (entry): entry is CartItem =>
          typeof entry === "object" &&
          entry !== null &&
          typeof (entry as CartItem).variantId === "string" &&
          Number.isFinite((entry as CartItem).quantity),
      )
      .map((entry) => ({
        variantId: entry.variantId,
        quantity: Math.min(MAX_QUANTITY, Math.max(1, Math.trunc(entry.quantity))),
      }))
      .slice(0, 50);
  } catch {
    return [];
  }
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [ready, setReady] = useState(false);
  const [revision, setRevision] = useState(0);

  // Erstbefüllung aus dem localStorage.
  //
  // Bewusst in einem Effekt: Auf dem Server gibt es keinen localStorage.
  // Würde der Warenkorb schon beim ersten Rendern gelesen, unterschiede sich
  // das Server- vom Client-Markup und React verwürfe die Hydration.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setItems(readStorage());
    setReady(true);
  }, []);

  // Persistieren – erst nachdem gelesen wurde, sonst würde geleert.
  useEffect(() => {
    if (!ready) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // Privater Modus o. ä. – der Warenkorb bleibt dann nur im Speicher.
    }
  }, [items, ready]);

  // Warenkorb über mehrere Tabs synchron halten.
  useEffect(() => {
    function onStorage(event: StorageEvent) {
      if (event.key !== STORAGE_KEY) return;
      setItems(readStorage());
      setRevision((value) => value + 1);
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const mutate = useCallback(
    (updater: (current: CartItem[]) => CartItem[]) => {
      setItems((current) => updater(current));
      setRevision((value) => value + 1);
    },
    [],
  );

  const addItem = useCallback(
    (variantId: string, quantity = 1) => {
      mutate((current) => {
        const existing = current.find((item) => item.variantId === variantId);
        if (existing) {
          return current.map((item) =>
            item.variantId === variantId
              ? {
                  ...item,
                  quantity: Math.min(MAX_QUANTITY, item.quantity + quantity),
                }
              : item,
          );
        }
        return [
          ...current,
          { variantId, quantity: Math.min(MAX_QUANTITY, Math.max(1, quantity)) },
        ];
      });
    },
    [mutate],
  );

  const setQuantity = useCallback(
    (variantId: string, quantity: number) => {
      mutate((current) => {
        if (quantity <= 0) {
          return current.filter((item) => item.variantId !== variantId);
        }
        return current.map((item) =>
          item.variantId === variantId
            ? { ...item, quantity: Math.min(MAX_QUANTITY, Math.trunc(quantity)) }
            : item,
        );
      });
    },
    [mutate],
  );

  const removeItem = useCallback(
    (variantId: string) => {
      mutate((current) => current.filter((item) => item.variantId !== variantId));
    },
    [mutate],
  );

  const removeMany = useCallback(
    (variantIds: string[]) => {
      if (variantIds.length === 0) return;
      const ids = new Set(variantIds);
      mutate((current) => current.filter((item) => !ids.has(item.variantId)));
    },
    [mutate],
  );

  const clear = useCallback(() => mutate(() => []), [mutate]);

  const value = useMemo<CartContextValue>(
    () => ({
      items,
      ready,
      itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
      addItem,
      setQuantity,
      removeItem,
      removeMany,
      clear,
      revision,
    }),
    [items, ready, addItem, setQuantity, removeItem, removeMany, clear, revision],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart muss innerhalb von <CartProvider> verwendet werden.");
  }
  return context;
}
