"use client";

import { deleteProductAction } from "@/app/admin/actions";
import { ConfirmSubmit } from "@/components/admin/ui";

export function DeleteProductForm({
  productId,
  productName,
}: {
  productId: string;
  productName: string;
}) {
  return (
    <form action={deleteProductAction}>
      <input type="hidden" name="productId" value={productId} />
      <ConfirmSubmit
        size="md"
        message={`„${productName}“ endgültig löschen? Diese Aktion kann nicht rückgängig gemacht werden.`}
      >
        Produkt endgültig löschen
      </ConfirmSubmit>
    </form>
  );
}
