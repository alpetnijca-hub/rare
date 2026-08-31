import { CartProvider } from "@/components/cart/cart-provider";
import { WishlistProvider } from "@/components/wishlist/wishlist-provider";
import { CookieConsent } from "@/components/cookie-consent";
import { CurrencyProvider } from "@/components/currency/currency-provider";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { getDisplayCurrency } from "@/lib/currency-server";

/** Rahmen für alle kundenseitigen Seiten. */
export default async function ShopLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  // Die Anzeigewährung wird serverseitig aus dem Cookie gelesen und nach unten
  // gereicht. So rendern Server und Browser denselben Betrag.
  const currency = await getDisplayCurrency();

  return (
    <CurrencyProvider currency={currency}>
      <CartProvider>
        <WishlistProvider>
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
        </WishlistProvider>
      </CartProvider>
    </CurrencyProvider>
  );
}
