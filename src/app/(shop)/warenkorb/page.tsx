import type { Metadata } from "next";
import { CartView } from "@/components/cart/cart-view";

export const metadata: Metadata = {
  title: "Warenkorb",
  description: "Deine ausgewählten Düfte im Überblick.",
  robots: { index: false, follow: true },
  alternates: { canonical: "/warenkorb" },
};

export default function CartPage() {
  return (
    <div className="container-shop py-12 md:py-16">
      <div className="mb-10">
        <p className="eyebrow mb-3">Schritt 1 von 2</p>
        <h1 className="text-4xl md:text-5xl">Warenkorb</h1>
      </div>

      <CartView />
    </div>
  );
}
