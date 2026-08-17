"use client";

import Link from "next/link";
import { toggleProductActiveAction } from "@/app/admin/actions";
import { SubmitButton } from "@/components/admin/ui";

/** Schnellaktionen in der Produktliste. */
export function ProductRowActions({
  productId,
  slug,
  isActive,
}: {
  productId: string;
  slug: string;
  isActive: boolean;
}) {
  return (
    <div className="flex flex-wrap justify-end gap-2">
      <Link
        href={`/admin/produkte/${productId}`}
        className="flex min-h-9 items-center border border-line-strong px-3 text-xs text-cream transition-colors hover:border-gold hover:text-gold-light"
      >
        Bearbeiten
      </Link>

      <Link
        href={`/produkt/${slug}`}
        target="_blank"
        className="flex min-h-9 items-center px-2 text-xs text-muted underline underline-offset-4 hover:text-gold-light"
      >
        Ansehen ↗
      </Link>

      <form action={toggleProductActiveAction}>
        <input type="hidden" name="productId" value={productId} />
        <SubmitButton
          variant="ghost"
          size="sm"
          pendingLabel="…"
        >
          {isActive ? "Verstecken" : "Sichtbar machen"}
        </SubmitButton>
      </form>
    </div>
  );
}
