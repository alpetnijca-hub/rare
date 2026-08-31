import { Stars } from "@/components/review/stars";
import { ratingMax, type ReviewSummary } from "@/lib/reviews";
import { formatDate } from "@/lib/utils";

interface PublishedReview {
  id: string;
  rating: number;
  authorName: string;
  body: string | null;
  publishedAt: Date | null;
}

/**
 * Bewertungen auf der Produktseite.
 *
 * Ohne Bewertungen erscheint hier ein kurzer Satz statt eines leeren
 * Kastens – und statt „0 von 5 Sternen“, was aussieht wie eine schlechte
 * Bewertung, wo in Wahrheit gar keine vorliegt.
 */
export function ReviewList({
  summary,
  reviews,
}: {
  summary: ReviewSummary;
  reviews: PublishedReview[];
}) {
  if (summary.count === 0 || summary.average === null) {
    return (
      <p className="text-sm leading-relaxed text-muted">
        Für diesen Duft gibt es noch keine Bewertung. Sobald ihn jemand
        bestellt und bewertet hat, steht sie hier.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-5 border border-line bg-charcoal p-5 sm:flex-row sm:items-center sm:gap-8 md:p-6">
        <div className="shrink-0">
          <p className="font-display text-4xl text-gold-light">
            {summary.average.toFixed(1).replace(".", ",")}
            <span className="ml-1 font-sans text-base text-subtle">
              von {ratingMax}
            </span>
          </p>
          <div className="mt-2">
            <Stars rating={summary.average} size="md" />
          </div>
          <p className="mt-2 text-xs text-subtle">
            {summary.count === 1
              ? "1 Bewertung"
              : `${summary.count} Bewertungen`}
          </p>
        </div>

        <div className="flex flex-1 flex-col gap-1.5">
          {summary.distribution.map((eintrag) => {
            const anteil =
              summary.count > 0 ? (eintrag.count / summary.count) * 100 : 0;

            return (
              <div key={eintrag.rating} className="flex items-center gap-3 text-xs">
                <span className="w-12 shrink-0 text-subtle">
                  {eintrag.rating} {eintrag.rating === 1 ? "Stern" : "Sterne"}
                </span>
                <span
                  className="h-1.5 flex-1 bg-line-strong"
                  aria-hidden="true"
                >
                  <span
                    className="block h-full bg-gold"
                    style={{ width: `${anteil}%` }}
                  />
                </span>
                <span className="w-6 shrink-0 text-right tabular-nums text-subtle">
                  {eintrag.count}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <ul className="flex flex-col gap-6">
        {reviews.map((review) => (
          <li key={review.id} className="border-b border-line pb-6 last:border-0 last:pb-0">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <Stars rating={review.rating} />
              <span className="text-sm text-cream">{review.authorName}</span>
              {review.publishedAt && (
                <span className="text-xs text-subtle">
                  {formatDate(review.publishedAt)}
                </span>
              )}
            </div>

            {review.body && (
              <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-muted">
                {review.body}
              </p>
            )}
          </li>
        ))}
      </ul>

      {/* Der Satz muss stimmen, sonst darf er nicht dastehen: Bewerten kann
          hier ausschliesslich, wem wir eine Bestellung zuordnen konnten. */}
      <p className="text-xs leading-relaxed text-subtle">
        Bewerten kann nur, wer den Duft bei uns bestellt hat – der Link dazu
        kommt nach dem Versand per E-Mail. Wir prüfen jede Bewertung auf
        Beschimpfungen und Werbung, nicht auf ihr Urteil: Kritik bleibt
        stehen.
      </p>
    </div>
  );
}
