import type { Metadata } from "next";
import { WishlistView } from "@/components/wishlist/wishlist-view";

export const metadata: Metadata = {
  title: "Merkliste",
  description: "Die Düfte, die du dir vorgemerkt hast.",
  alternates: { canonical: "/merkliste" },
  // Die Liste steht nur im Browser der Besucherin – für Suchmaschinen ist
  // hier nichts zu holen.
  robots: { index: false, follow: true },
};

export default function WishlistPage() {
  return (
    <div className="container-shop py-12 md:py-16">
      <div className="mb-10 max-w-2xl">
        <p className="eyebrow mb-3">Gemerkt</p>
        <h1 className="text-4xl md:text-5xl">Deine Merkliste</h1>
        <p className="mt-4 text-sm leading-relaxed text-muted md:text-base">
          Düfte, die dir aufgefallen sind. Preise und Verfügbarkeit holen wir
          jedes Mal frisch – was hier steht, gilt.
        </p>
      </div>

      <WishlistView />
    </div>
  );
}
