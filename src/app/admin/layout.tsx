import type { Metadata } from "next";

export const metadata: Metadata = {
  title: { default: "Adminbereich", template: "%s | Adminbereich" },
  robots: { index: false, follow: false, nocache: true },
};

/**
 * Rahmen des Adminbereichs. Bewusst ohne Shop-Navigation.
 * Die Zugriffsprüfung erfolgt in `(geschuetzt)/layout.tsx` – die
 * Anmeldeseite liegt ausserhalb dieser Gruppe.
 */
export default function AdminRootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <div className="min-h-dvh bg-ink">{children}</div>;
}
