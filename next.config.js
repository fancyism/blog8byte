import path from "node:path";
import { fileURLToPath } from "node:url";

/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially useful
 * for Docker builds.
 */
import "./src/env.js";

const projectRoot = path.dirname(fileURLToPath(import.meta.url));
/** @type {any | null} */
let r2RemotePattern = null;

if (process.env.R2_PUBLIC_BASE_URL) {
  try {
    const r2PublicUrl = new URL(process.env.R2_PUBLIC_BASE_URL);
    const normalizedPathname = r2PublicUrl.pathname.replace(/\/$/, "");

    r2RemotePattern = {
      protocol: r2PublicUrl.protocol.replace(":", ""),
      hostname: r2PublicUrl.hostname,
      pathname: normalizedPathname ? `${normalizedPathname}/**` : "/**",
    };
  } catch {
    console.warn("Invalid R2_PUBLIC_BASE_URL; skipping Next Image remote pattern");
  }
}

/** @type {import("next").NextConfig} */
const config = {
  outputFileTracingRoot: projectRoot,
  turbopack: {
    root: projectRoot,
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      ...(r2RemotePattern ? [r2RemotePattern] : []),
    ],
  },
  async headers() {
    return [
      {
        // Apply security headers to all routes
        source: "/(.*)",
        headers: [
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains",
          },
        ],
      },
    ];
  },
};

export default config;
