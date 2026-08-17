import Link from "next/link";
import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

/**
 * Button und Button-Link mit identischem Erscheinungsbild.
 * Mindestens 44 px Höhe – bequem auf Touchgeräten bedienbar.
 */

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-2 font-medium tracking-wide " +
  "transition-all duration-200 ease-[cubic-bezier(0.22,0.61,0.36,1)] " +
  "disabled:cursor-not-allowed disabled:opacity-40 " +
  "focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-gold";

const variants: Record<Variant, string> = {
  primary:
    "bg-gold text-ink hover:bg-gold-light active:bg-gold " +
    "shadow-[0_0_0_0_rgba(200,164,93,0)] hover:shadow-[0_8px_24px_-12px_rgba(200,164,93,0.7)]",
  secondary:
    "border border-line-strong bg-transparent text-cream " +
    "hover:border-gold hover:text-gold-light",
  ghost: "bg-transparent text-muted hover:text-gold-light",
  danger:
    "border border-red-900/60 bg-red-950/40 text-red-200 hover:border-red-700 hover:bg-red-950/70",
};

const sizes: Record<Size, string> = {
  sm: "min-h-9 px-4 text-xs uppercase tracking-[0.14em]",
  md: "min-h-11 px-6 text-sm",
  lg: "min-h-13 px-8 text-sm uppercase tracking-[0.16em]",
};

interface StyleProps {
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
}

export function buttonClasses({
  variant = "primary",
  size = "md",
  fullWidth = false,
  className,
}: StyleProps & { className?: string } = {}) {
  return cn(
    base,
    variants[variant],
    sizes[size],
    fullWidth && "w-full",
    className,
  );
}

export function Button({
  variant,
  size,
  fullWidth,
  className,
  type = "button",
  ...props
}: ComponentProps<"button"> & StyleProps) {
  return (
    <button
      type={type}
      className={buttonClasses({ variant, size, fullWidth, className })}
      {...props}
    />
  );
}

export function ButtonLink({
  variant,
  size,
  fullWidth,
  className,
  ...props
}: ComponentProps<typeof Link> & StyleProps) {
  return (
    <Link
      className={buttonClasses({ variant, size, fullWidth, className })}
      {...props}
    />
  );
}
