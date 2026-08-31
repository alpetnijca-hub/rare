-- Tageszähler je Duft.
--
-- Nur Zahlen und ein Datum: keine IP, keine Kennung, kein Cookie. Damit
-- lässt sich kein Verhalten einer einzelnen Person nachvollziehen.
CREATE TABLE "ProductStat" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "day" DATE NOT NULL,
    "views" INTEGER NOT NULL DEFAULT 0,
    "cartAdds" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ProductStat_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ProductStat_productId_day_key" ON "ProductStat"("productId", "day");
CREATE INDEX "ProductStat_day_idx" ON "ProductStat"("day");

ALTER TABLE "ProductStat" ADD CONSTRAINT "ProductStat_productId_fkey"
    FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
