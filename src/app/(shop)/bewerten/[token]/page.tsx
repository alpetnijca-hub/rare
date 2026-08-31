import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ReviewForm } from "@/components/review/review-form";
import { Stars } from "@/components/review/stars";
import { reviewableOrder } from "@/lib/review-queries";

export const metadata: Metadata = {
  title: "Düfte bewerten",
  // Der Token steht in der Adresse – diese Seite gehört nicht in einen Index.
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function ReviewPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const order = await reviewableOrder(token);

  if (!order) notFound();

  if (order.tooEarly) {
    return (
      <div className="container-shop py-16">
        <div className="mx-auto max-w-xl text-center">
          <p className="eyebrow mb-3">Bewerten</p>
          <h1 className="text-3xl md:text-4xl">Noch ein bisschen früh</h1>
          <p className="mt-4 text-sm leading-relaxed text-muted md:text-base">
            Bewerten kannst du, sobald deine Bestellung unterwegs ist. Wir
            melden uns per E-Mail, wenn es so weit ist.
          </p>
          <p className="mt-6">
            <Link
              href={`/bestellung/${token}`}
              className="text-gold underline underline-offset-2 hover:text-gold-light"
            >
              Zum Stand deiner Bestellung
            </Link>
          </p>
        </div>
      </div>
    );
  }

  const bewertet = new Map(
    order.reviews.map((review) => [review.productId, review]),
  );

  return (
    <div className="container-shop py-12 md:py-16">
      <div className="mx-auto max-w-2xl">
        <p className="eyebrow mb-3">Bestellung {order.orderNumber}</p>
        <h1 className="text-4xl md:text-5xl">Wie war’s?</h1>
        <p className="mt-4 text-sm leading-relaxed text-muted md:text-base">
          Deine Einschätzung hilft den nächsten Leuten mehr als alles, was wir
          selbst schreiben könnten – gerade weil man bei uns nichts
          zurückgeben kann. Ehrlich ist wichtiger als nett: Wenn ein Duft dich
          enttäuscht hat, schreib das ruhig.
        </p>
        <p className="mt-3 text-xs leading-relaxed text-subtle">
          Veröffentlicht wird dein Vorname und der erste Buchstabe deines
          Nachnamens, zum Beispiel „Anna M.“. Deine E-Mail-Adresse erscheint
          nirgends.
        </p>

        <div className="mt-10 flex flex-col gap-8">
          {order.items.map((item) => {
            if (!item.productId) return null;
            const vorhanden = bewertet.get(item.productId);

            return (
              <section
                key={item.productId}
                className="border border-line bg-charcoal p-5 md:p-6"
              >
                <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
                  <h2 className="font-display text-xl text-cream">
                    {item.product?.isActive && item.product.slug ? (
                      <Link
                        href={`/produkt/${item.product.slug}`}
                        className="hover:text-gold-light"
                      >
                        {item.productName}
                      </Link>
                    ) : (
                      item.productName
                    )}
                  </h2>

                  {vorhanden && (
                    <span className="flex items-center gap-2 text-xs text-subtle">
                      <Stars rating={vorhanden.rating} />
                      {vorhanden.status === "PUBLISHED"
                        ? "veröffentlicht"
                        : vorhanden.status === "PENDING"
                          ? "wartet auf Freigabe"
                          : "nicht veröffentlicht"}
                    </span>
                  )}
                </div>

                {/* Auch eine schon abgegebene Bewertung lässt sich ändern –
                    sie geht dann wieder in die Freigabe. */}
                <ReviewForm
                  token={token}
                  productId={item.productId}
                  productName={item.productName}
                  existingRating={vorhanden?.rating}
                />
              </section>
            );
          })}
        </div>
      </div>
    </div>
  );
}
