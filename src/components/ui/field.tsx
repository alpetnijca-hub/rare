import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Barrierearme Formularfelder: jedes Feld hat ein sichtbares Label,
 * Fehler werden über `aria-invalid` und `aria-describedby` verknüpft.
 */

const controlClasses =
  "w-full min-h-11 border border-line bg-charcoal px-3.5 py-2.5 text-[15px] text-cream " +
  "placeholder:text-subtle transition-colors duration-200 " +
  "hover:border-line-strong focus:border-gold focus:outline-none " +
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold " +
  "aria-[invalid=true]:border-red-800 disabled:opacity-50";

interface FieldShellProps {
  id: string;
  label: string;
  error?: string;
  hint?: string;
  required?: boolean;
  className?: string;
  children: (ariaProps: {
    id: string;
    "aria-invalid": boolean;
    "aria-describedby": string | undefined;
  }) => ReactNode;
}

export function Field({
  id,
  label,
  error,
  hint,
  required,
  className,
  children,
}: FieldShellProps) {
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined;

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label
        htmlFor={id}
        className="text-xs font-medium uppercase tracking-[0.14em] text-muted"
      >
        {label}
        {required && (
          <span className="ml-1 text-gold" aria-hidden="true">
            *
          </span>
        )}
        {!required && <span className="ml-1.5 normal-case tracking-normal text-subtle">(optional)</span>}
      </label>

      {children({
        id,
        "aria-invalid": Boolean(error),
        "aria-describedby": describedBy,
      })}

      {hint && (
        <p id={hintId} className="text-xs leading-relaxed text-subtle">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} role="alert" className="text-xs font-medium text-red-400">
          {error}
        </p>
      )}
    </div>
  );
}

export function TextInput({ className, ...props }: ComponentProps<"input">) {
  return <input className={cn(controlClasses, className)} {...props} />;
}

export function TextArea({ className, ...props }: ComponentProps<"textarea">) {
  return (
    <textarea className={cn(controlClasses, "min-h-28 py-3", className)} {...props} />
  );
}

export function Select({ className, ...props }: ComponentProps<"select">) {
  return (
    <select
      className={cn(controlClasses, "cursor-pointer appearance-none pr-9", className)}
      style={{
        backgroundImage:
          "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath fill='%239a9a9a' d='M6 8 0 0h12z'/%3E%3C/svg%3E\")",
        backgroundRepeat: "no-repeat",
        backgroundPosition: "right 0.85rem center",
      }}
      {...props}
    />
  );
}

/** Checkbox mit Beschriftung – Trefferfläche umfasst den gesamten Text. */
export function Checkbox({
  id,
  label,
  error,
  hint,
  className,
  ...props
}: ComponentProps<"input"> & {
  id: string;
  label: ReactNode;
  error?: string;
  /** Erklärender Zusatz unter der Beschriftung. */
  hint?: string;
}) {
  const errorId = error ? `${id}-error` : undefined;
  const hintId = hint ? `${id}-hint` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined;

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <div className="flex items-start gap-3">
        <input
          id={id}
          type="checkbox"
          aria-invalid={Boolean(error)}
          aria-describedby={describedBy}
          className="mt-1 size-4.5 shrink-0 cursor-pointer appearance-none border border-line-strong bg-charcoal
            checked:border-gold checked:bg-gold
            checked:after:block checked:after:h-full checked:after:w-full
            checked:after:bg-[url('data:image/svg+xml;utf8,%3Csvg%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%20viewBox%3D%220%200%2016%2016%22%3E%3Cpath%20fill%3D%22%23080808%22%20d%3D%22M6.2%2011.8%203%208.6l1.1-1.1%202.1%202.1%205.7-5.7L13%205z%22/%3E%3C/svg%3E')]
            checked:after:bg-center checked:after:bg-no-repeat
            focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold
            aria-[invalid=true]:border-red-800"
          {...props}
        />
        <div className="flex flex-col gap-0.5">
          <label
            htmlFor={id}
            className="cursor-pointer text-sm leading-relaxed text-cream"
          >
            {label}
          </label>
          {hint && (
            <p id={hintId} className="text-xs leading-relaxed text-subtle">
              {hint}
            </p>
          )}
        </div>
      </div>
      {error && (
        <p id={errorId} role="alert" className="pl-7.5 text-xs font-medium text-red-400">
          {error}
        </p>
      )}
    </div>
  );
}
