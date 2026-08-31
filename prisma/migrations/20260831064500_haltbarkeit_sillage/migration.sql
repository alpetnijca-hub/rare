-- Haltbarkeit und Sillage als Skala 1–5.
--
-- Beides ist optional: Bestehende Düfte behalten NULL und zeigen auf der
-- Produktseite gar nichts an, statt eine Angabe zu erfinden.
ALTER TABLE "Product" ADD COLUMN "longevity" INTEGER;
ALTER TABLE "Product" ADD COLUMN "sillage" INTEGER;
