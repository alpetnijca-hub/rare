import type { NextConfig } from "next";

/**
 * Sicherheitsrelevante HTTP-Header.
 * Die CSP erlaubt gezielt nur die tatsächlich eingebundenen Fremd-Hosts
 * (Stripe für den Checkout, Cloudinary für Produktbilder).
 */
const securityHeaders = [
  { key: "X-DNS-Prefetch-Control", value: "on" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), interest-cohort=(), payment=(self 'src')",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
      "object-src 'none'",
      "img-src 'self' data: blob: https://res.cloudinary.com https://images.unsplash.com",
      "font-src 'self' data:",
      // 'unsafe-inline' wird von Next.js für die Hydration-Skripte benötigt.
      "script-src 'self' 'unsafe-inline' https://js.stripe.com",
      "style-src 'self' 'unsafe-inline'",
      "connect-src 'self' https://api.stripe.com https://api.cloudinary.com",
      "frame-src https://js.stripe.com https://hooks.stripe.com",
      "upgrade-insecure-requests",
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "https", hostname: "images.unsplash.com" },
    ],
    formats: ["image/avif", "image/webp"],
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
  /**
   * /rueckgabe erklärte früher den Ablauf einer Rücksendung. Der Shop nimmt
   * keine Ware mehr zurück, und beides auf zwei Seiten zu verteilen war schon
   * vorher unübersichtlich. Die Adresse steckt aber in verschickten E-Mails
   * und womöglich in Lesezeichen – deshalb eine dauerhafte Weiterleitung
   * statt einer 404-Seite.
   */
  async redirects() {
    return [{ source: "/rueckgabe", destination: "/widerruf", permanent: true }];
  },
};

export default nextConfig;
