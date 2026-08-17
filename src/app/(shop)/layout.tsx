import { CartProvider } from "@/components/cart/cart-provider";
import { CookieConsent } from "@/components/cookie-consent";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";

/** Rahmen für alle kundenseitigen Seiten. */
export default function ShopLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <CartProvider>
      <div className="flex min-h-dvh flex-col">
        <a href="#hauptinhalt" className="skip-link">
          Zum Hauptinhalt springen
        </a>

        <Header />

        <main id="hauptinhalt" className="flex-1">
          {children}
        </main>

        <Footer />
        <CookieConsent />
      </div>
    </CartProvider>
  );
}
