import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Security headers for the admin UI. It holds staff tokens, so it must never be
 * framed (clickjacking) and should only talk to its own API and the public site.
 */
const API_ORIGIN = (() => {
  try {
    return process.env.NEXT_PUBLIC_API_BASE ? new URL(process.env.NEXT_PUBLIC_API_BASE).origin : "";
  } catch {
    return "";
  }
})();
const SITE_ORIGIN = (() => {
  try {
    return new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://www.etqanpp.com").origin;
  } catch {
    return "";
  }
})();

const securityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  {
    // Report-only first so a missed origin can't break the editor; switch to enforcing once clean.
    key: "Content-Security-Policy-Report-Only",
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      `img-src 'self' data: blob: https: ${API_ORIGIN}`.trim(),
      `connect-src 'self' ${API_ORIGIN} ${SITE_ORIGIN}`.trim(),
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "object-src 'none'",
    ].join("; "),
  },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  // The dashboard never uses next/image; serving images unoptimised removes the
  // /_next/image proxy that previously fetched any https URL on request.
  images: { unoptimized: true },
  poweredByHeader: false,
  outputFileTracingRoot: __dirname,
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};
export default nextConfig;
