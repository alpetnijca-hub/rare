import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
import { siteConfig } from "@/config/site";

/**
 * Sitemap für Suchmaschinen.
 * Enthält nur öffentlich indexierbare Seiten – Warenkorb, Kasse,
 * Bestellstatus und Adminbereich bleiben aussen vor.
 */
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages: MetadataRoute.Sitemap = [
    { url: `${siteConfig.url}/`, changeFrequency: "weekly", priority: 1 },
    { url: `${siteConfig.url}/shop`, changeFrequency: "daily", priority: 0.9 },
    { url: `${siteConfig.url}/faq`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${siteConfig.url}/kontakt`, changeFrequency: "yearly", priority: 0.5 },
    { url: `${siteConfig.url}/versand`, changeFrequency: "monthly", priority: 0.4 },
    { url: `${siteConfig.url}/newsletter`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${siteConfig.url}/impressum`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${siteConfig.url}/datenschutz`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${siteConfig.url}/agb`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${siteConfig.url}/widerruf`, changeFrequency: "yearly", priority: 0.3 },
    {
      url: `${siteConfig.url}/cookie-einstellungen`,
      changeFrequency: "yearly",
      priority: 0.1,
    },
  ];

  try {
    const [products, categories] = await Promise.all([
      prisma.product.findMany({
        where: { isActive: true, variants: { some: { isActive: true } } },
        select: { slug: true, updatedAt: true },
      }),
      prisma.category.findMany({
        where: { isActive: true },
        select: { slug: true, updatedAt: true },
      }),
    ]);

    return [
      ...staticPages,
      ...products.map((product) => ({
        url: `${siteConfig.url}/produkt/${product.slug}`,
        lastModified: product.updatedAt,
        changeFrequency: "weekly" as const,
        priority: 0.8,
      })),
      ...categories.map((category) => ({
        url: `${siteConfig.url}/shop?kategorie=${category.slug}`,
        lastModified: category.updatedAt,
        changeFrequency: "weekly" as const,
        priority: 0.6,
      })),
    ];
  } catch {
    // Ist die Datenbank nicht erreichbar, liefern wir wenigstens die
    // statischen Seiten aus, statt einen Fehler zu erzeugen.
    return staticPages;
  }
}
