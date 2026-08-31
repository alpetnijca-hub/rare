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
 * Merkliste im Browser.
 *
 * Bewusst ohne Kundenkonto: Der Shop kennt keine Konten, und für „diesen Duft
 * will ich mir merken“ ein Konto zu verlangen, verliert mehr Leute als es
 * bringt. Gespeichert wird nur die Produkt-ID im localStorage – nichts davon
 * erreicht unseren Server, und es gibt nichts zu einer Person zuzuordnen.
 *
 * Der Preis dafür ist ehrlich zu benennen: Die Liste hängt am Browser. Auf
 * dem Handy steht eine andere als auf dem Rechner, und wer die Websitedaten
 * löscht, verliert sie. Genau das steht auch auf der Merklistenseite.
 */

interface WishlistContextValue {
  ids: string[];
  /** Erst `true`, wenn der localStorage gelesen wurde (verhindert Flackern). */
  ready: boolean;
  count: number;
  has: (productId: string) => boolean;
  toggle: (productId: string) => void;
  remove: (productId: string) => void;
  clear: () => void;
}

const STORAGE_KEY = "rare-scents-merkliste-v1";

/**
 * Obergrenze, damit ein defektes Skript oder ein Dauerklick den Speicher des
 * Browsers nicht vollschreibt.
 */
const MAX_ENTRIES = 200;

const WishlistContext = createContext<WishlistContextValue | null>(null);

function readStorage(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed
      .filter((entry): entry is string => typeof entry === "string" && entry.length > 0)
      .slice(0, MAX_ENTRIES);
  } catch {
    // Kaputter Eintrag oder privater Modus – dann eben leer.
    return [];
  }
}

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const [ids, setIds] = useState<string[]>([]);
  const [ready, setReady] = useState(false);

  // Erstbefüllung aus dem localStorage.
  //
  // Bewusst in einem Effekt: Auf dem Server gibt es keinen localStorage.
  // Würde die Liste schon beim ersten Rendern gelesen, unterschiede sich das
  // Server- vom Client-Markup und React verwürfe die Hydration.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIds(readStorage());
    setReady(true);
  }, []);

  // Persistieren – erst nachdem gelesen wurde, sonst würde geleert.
  useEffect(() => {
    if (!ready) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
    } catch {
      // Privater Modus o. ä. – die Liste bleibt dann nur im Speicher.
    }
  }, [ids, ready]);

  // Über mehrere Tabs synchron halten.
  useEffect(() => {
    function onStorage(event: StorageEvent) {
      if (event.key !== STORAGE_KEY) return;
      setIds(readStorage());
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const toggle = useCallback((productId: string) => {
    setIds((current) =>
      current.includes(productId)
        ? current.filter((id) => id !== productId)
        : // Neues zuoberst: Wer sich gerade etwas gemerkt hat, sucht es oben.
          [productId, ...current].slice(0, MAX_ENTRIES),
    );
  }, []);

  const remove = useCallback((productId: string) => {
    setIds((current) => current.filter((id) => id !== productId));
  }, []);

  const clear = useCallback(() => setIds([]), []);

  const value = useMemo<WishlistContextValue>(
    () => ({
      ids,
      ready,
      count: ids.length,
      has: (productId: string) => ids.includes(productId),
      toggle,
      remove,
      clear,
    }),
    [ids, ready, toggle, remove, clear],
  );

  return (
    <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>
  );
}

export function useWishlist(): WishlistContextValue {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error("useWishlist muss innerhalb von WishlistProvider stehen.");
  }
  return context;
}
