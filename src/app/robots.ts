import type { MetadataRoute } from "next";
import { siteConfig } from "@/config/site";

/**
 * robots.txt
 *
 * Nicht indexiert werden: Adminbereich, API, Bezahlvorgang, Warenkorb und
 * die persönlichen Bestellstatus-Seiten.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin",
          "/admin/",
          "/api/",
          "/kasse",
          "/warenkorb",
          "/bestellung/",
        ],
      },
    ],
    sitemap: `${siteConfig.url}/sitemap.xml`,
    host: siteConfig.url,
  };
}
