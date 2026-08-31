import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { AdminPageHeader, Card, StatTile } from "@/components/admin/layout-parts";
import { ReviewModeration } from "@/components/admin/review-moderation";
import { Stars } from "@/components/review/stars";
import { formatDateTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminReviewsPage() {
  const [offen, erledigt, anzahl] = await Promise.all([
    prisma.review.findMany({
      where: { status: "PENDING" },
      orderBy: { createdAt: "asc" },
      include: {
        product: { select: { name: true, slug: true } },
        order: { select: { orderNumber: true } },
      },
    }),
    prisma.review.findMany({
      where: { status: { in: ["PUBLISHED", "REJECTED"] } },
      orderBy: { updatedAt: "desc" },
      take: 30,
      include: {
        product: { select: { name: true, slug: true } },
        order: { select: { orderNumber: true } },
      },
    }),
    prisma.review.groupBy({ by: ["status"], _count: { _all: true } }),
  ]);

  const zahl = (status: string) =>
    anzahl.find((eintrag) => eintrag.status === status)?._count._all ?? 0;

  return (
    <div className="flex flex-col gap-8">
      <AdminPageHeader
        title="Bewertungen"
        description="Bewertungen von Kundinnen und Kunden, die den Duft wirklich bestellt haben."
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatTile
          label="Wartet auf Freigabe"
          value={zahl("PENDING")}
          tone={zahl("PENDING") > 0 ? "gold" : "neutral"}
        />
        <StatTile label="Veröffentlicht" value={zahl("PUBLISHED")} tone="success" />
        <StatTile label="Abgelehnt" value={zahl("REJECTED")} />
      </div>

      <div className="border border-amber-800/60 bg-amber-950/25 px-5 py-4">
        <p className="text-sm leading-relaxed text-amber-100/85">
          <strong className="font-medium">
            Abgelehnt wird Missbrauch, nicht Kritik.
          </strong>{" "}
          Beschimpfungen, Werbung und offensichtlich falscher Bezug gehören
          nicht auf die Seite. Eine schlechte Bewertung zurückzuhalten, weil
          sie schlecht ist, macht aus dem Durchschnitt beim Duft eine
          Falschaussage – und wer mit Bewertungen wirbt, muss sie vollständig
          zeigen.
        </p>
      </div>

      <Card
        title="Wartet auf Freigabe"
        description={
          offen.length === 0
            ? "Im Moment nichts zu tun."
            : `${offen.length} ${offen.length === 1 ? "Bewertung" : "Bewertungen"} zum Durchsehen.`
        }
      >
        {offen.length === 0 ? (
          <p className="text-sm text-muted">
            Neue Bewertungen erscheinen hier, sobald jemand nach dem Versand
            den Link aus der E-Mail benutzt.
          </p>
        ) : (
          <ul className="flex flex-col gap-6">
            {offen.map((review) => (
              <li key={review.id} className="border-b border-line pb-6 last:border-0 last:pb-0">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <Stars rating={review.rating} />
                  <Link
                    href={`/produkt/${review.product.slug}`}
                    className="text-sm text-cream underline underline-offset-2 hover:text-gold-light"
                  >
                    {review.product.name}
                  </Link>
                  <span className="text-xs text-subtle">
                    {review.authorName} · Bestellung {review.order.orderNumber} ·{" "}
                    {formatDateTime(review.createdAt)}
                  </span>
                </div>

                {review.body ? (
                  <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-muted">
                    {review.body}
                  </p>
                ) : (
                  <p className="mt-3 text-sm italic text-subtle">
                    Nur Sterne, kein Text.
                  </p>
                )}

                <div className="mt-4">
                  <ReviewModeration reviewId={review.id} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {erledigt.length > 0 && (
        <Card title="Zuletzt entschieden">
          <ul className="flex flex-col gap-3 text-sm">
            {erledigt.map((review) => (
              <li
                key={review.id}
                className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-line/60 pb-3 last:border-0 last:pb-0"
              >
                <Stars rating={review.rating} />
                <span className="text-cream">{review.product.name}</span>
                <span className="text-xs text-subtle">{review.authorName}</span>
                <span
                  className={
                    review.status === "PUBLISHED"
                      ? "text-xs text-emerald-300"
                      : "text-xs text-amber-300"
                  }
                >
                  {review.status === "PUBLISHED" ? "veröffentlicht" : "abgelehnt"}
                </span>
                {review.moderationNote && (
                  <span className="text-xs text-subtle">
                    ({review.moderationNote})
                  </span>
                )}
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
