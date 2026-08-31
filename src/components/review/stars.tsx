import { ratingMax } from "@/lib/reviews";
import { cn } from "@/lib/utils";

/**
 * Sterne zum Anschauen.
 *
 * Die Zahl steht immer daneben oder im Alternativtext: Fünf Symbole
 * auszuzählen ist Arbeit, und mit einem Screenreader ist es unmöglich.
 */
export function Stars({
  rating,
  size = "sm",
  className,
}: {
  rating: number;
  size?: "sm" | "md";
  className?: string;
}) {
  return (
    <span
      className={cn("inline-flex items-center gap-0.5", className)}
      role="img"
      aria-label={`${rating} von ${ratingMax} Sternen`}
    >
      {Array.from({ length: ratingMax }, (_, index) => (
        <Star
          key={index}
          filled={index < Math.round(rating)}
          className={size === "md" ? "size-5" : "size-3.5"}
        />
      ))}
    </span>
  );
}

export function Star({
  filled,
  className,
}: {
  filled: boolean;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 20 20"
      aria-hidden="true"
      className={cn(filled ? "text-gold" : "text-line-strong", className)}
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="1.3"
    >
      <path
        d="M10 2.6l2.3 4.7 5.2.75-3.75 3.65.9 5.15L10 14.4l-4.65 2.45.9-5.15L2.5 8.05l5.2-.75L10 2.6Z"
        strokeLinejoin="round"
      />
    </svg>
  );
}
