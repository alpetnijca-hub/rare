import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import type { AvailabilityState } from "@/lib/availability";

type Tone = "gold" | "neutral" | "success" | "warning" | "danger" | "info";

const tones: Record<Tone, string> = {
  gold: "border-gold/45 bg-gold/10 text-gold-light",
  neutral: "border-line-strong bg-elevated text-muted",
  success: "border-emerald-800/60 bg-emerald-950/40 text-emerald-300",
  warning: "border-amber-800/60 bg-amber-950/40 text-amber-300",
  danger: "border-red-900/60 bg-red-950/40 text-red-300",
  info: "border-sky-900/60 bg-sky-950/40 text-sky-300",
};

export function Badge({
  tone = "neutral",
  className,
  children,
}: {
  tone?: Tone;
  className?: string;
  children: ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 border px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.12em]",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

const availabilityTones: Record<AvailabilityState, Tone> = {
  IN_STOCK: "success",
  LOW_STOCK: "warning",
  PREORDER: "info",
  OUT_OF_STOCK: "neutral",
  UNAVAILABLE: "danger",
};

/** Farbiger Punkt plus Text – die Farbe ist nie die einzige Information. */
export function AvailabilityBadge({
  state,
  label,
  className,
}: {
  state: AvailabilityState;
  label: string;
  className?: string;
}) {
  const dotColors: Record<AvailabilityState, string> = {
    IN_STOCK: "bg-emerald-400",
    LOW_STOCK: "bg-amber-400",
    PREORDER: "bg-sky-400",
    OUT_OF_STOCK: "bg-neutral-500",
    UNAVAILABLE: "bg-red-500",
  };

  return (
    <Badge tone={availabilityTones[state]} className={cn("normal-case tracking-normal", className)}>
      <span
        aria-hidden="true"
        className={cn("size-1.5 rounded-full", dotColors[state])}
      />
      <span className="text-xs">{label}</span>
    </Badge>
  );
}
