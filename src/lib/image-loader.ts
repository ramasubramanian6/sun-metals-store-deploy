"use client";

// Used only when NEXT_PUBLIC_CDN_URL is set at build time (Render + Firebase deployment).
// Committed demo images and the logo are pre-optimised WebP/PNG files served straight from the CDN;
// images uploaded later through the admin live on the app server and are served by its /media route.
const CDN = (process.env.NEXT_PUBLIC_CDN_URL ?? "").replace(/\/$/, "");

export default function imageLoader({ src }: { src: string; width: number; quality?: number }) {
  if (CDN && (src === "/logo.png" || /^\/media\/[a-z]+\/(demo|seed)-[a-z0-9-]+\.webp$/.test(src))) return `${CDN}${src}`;
  return src;
}
