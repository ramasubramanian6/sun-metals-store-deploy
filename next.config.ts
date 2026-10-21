import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV !== "production";
// Only upgrade sub-requests when actually served over HTTPS (avoids breaking `next start` on http://localhost).
const isHttps = (process.env.NEXT_PUBLIC_SITE_URL ?? "").startsWith("https://");

// Optional static-asset CDN (Firebase Hosting in the Render + Firebase setup). When set at build time,
// JS/CSS/fonts load from it via assetPrefix and committed demo images are served from it directly.
const CDN = (process.env.NEXT_PUBLIC_CDN_URL ?? "").replace(/\/$/, "");

// Razorpay Checkout + Affordability widget origins.
const RZP = "https://checkout.razorpay.com https://api.razorpay.com https://cdn.razorpay.com https://lumberjack.razorpay.com";

// Hash/nonce-free CSP keeps pages prerenderable (Partial Prerendering). Inline scripts are
// limited to Next's own bootstrap; no third-party script origins beyond Razorpay are allowed.
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline' ${isDev ? "'unsafe-eval'" : ""} ${CDN} https://checkout.razorpay.com https://cdn.razorpay.com`,
  `style-src 'self' 'unsafe-inline' ${CDN}`,
  `img-src 'self' data: blob: ${CDN} https://*.razorpay.com`,
  `font-src 'self' data: ${CDN}`,
  `media-src 'self' blob: ${CDN}`,
  `connect-src 'self' ${CDN} ${RZP}`,
  "frame-src https://api.razorpay.com https://checkout.razorpay.com",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  isHttps ? "upgrade-insecure-requests" : "",
]
  .filter(Boolean)
  .join("; ");

const securityHeaders = [
  ...(isHttps ? [{ key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" }] : []),
  { key: "Content-Security-Policy", value: csp },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(self \"https://checkout.razorpay.com\" \"https://api.razorpay.com\")" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin-allow-popups" },
];

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  poweredByHeader: false,
  ...(CDN ? { assetPrefix: CDN } : {}),
  experimental: {
    // A stale on-disk Turbopack dev cache (e.g. after running `next build` while `next dev` is up) can put
    // HMR into a full-page reload loop. Dev starts slightly slower without it; production is unaffected.
    turbopackFileSystemCacheForDev: false,
  },
  images: CDN
    ? { loader: "custom", loaderFile: "./src/lib/image-loader.ts" }
    : {
        localPatterns: [{ pathname: "/media/**", search: "" }, { pathname: "/logo.png", search: "" }],
        formats: ["image/avif", "image/webp"],
      },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
