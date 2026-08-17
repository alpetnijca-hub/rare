import { requireAdmin } from "@/lib/auth-guard";
import { AdminShell } from "@/components/admin/admin-shell";
import { prisma } from "@/lib/prisma";

/**
 * Geschützter Bereich: Ohne gültige Sitzung wird zur Anmeldung umgeleitet.
 * Zusätzlich zur Middleware – Server Components dürfen sich nie allein
 * auf die Middleware verlassen.
 */
export default async function ProtectedAdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const user = await requireAdmin();

  // Kennzahlen für die Navigation (offene Bestellungen, knappe Bestände).
  const [openOrders, lowStockCount] = await Promise.all([
    prisma.order.count({
      where: { status: { in: ["PAID", "PROCESSING", "READY_TO_SHIP"] } },
    }),
    prisma.productVariant.count({
      where: { isActive: true, stock: { lte: 3 } },
    }),
  ]);

  return (
    <AdminShell user={user} openOrders={openOrders} lowStockCount={lowStockCount}>
      {children}
    </AdminShell>
  );
}
