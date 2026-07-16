import type { NextConfig } from "next";
import type { RemotePattern } from "next/dist/shared/lib/image-config";
import path from "node:path";

// Allowlist the *configured* Strapi host for next/image, derived from STRAPI_URL, so uploaded
// media works in every environment — not just local dev. Without this, next/image throws
// ("hostname is not configured under images") on any CMS image once STRAPI_URL points at a
// deployed host. NOTE: if Strapi serves media via an external provider (S3/Cloudinary), add
// that host to remotePatterns too — its absolute URLs bypass STRAPI_URL.
function strapiRemotePattern(): RemotePattern[] {
  const url = process.env.STRAPI_URL;
  if (!url) return [];
  try {
    const u = new URL(url);
    return [
      {
        protocol: u.protocol.replace(":", "") as "http" | "https",
        hostname: u.hostname,
        ...(u.port ? { port: u.port } : {}),
        pathname: "/uploads/**",
      },
    ];
  } catch {
    return [];
  }
}

const nextConfig: NextConfig = {
  // @paypal/react-paypal-js (v10) + React 19 StrictMode double-mount each other into an empty
  // PayPalButtons container in dev (button never paints). StrictMode is a dev-only aid (stripped
  // from prod builds), so disabling it here makes /store/checkout testable locally with no prod
  // impact. Re-enable if react-paypal-js ships a React 19 StrictMode fix.
  reactStrictMode: false,
  // Pin the workspace root — a stray lockfile in the home dir otherwise misleads file tracing.
  turbopack: { root: path.resolve(process.cwd()) },
  // Enables React's <ViewTransition> so route navigations play the slide-up cover (see template.tsx
  // + the ::view-transition rules in globals.css). Degrades to instant nav where unsupported.
  experimental: { viewTransition: true },
  images: {
    remotePatterns: [
      // Local Strapi, kept explicit so dev works even when STRAPI_URL is unset.
      { protocol: "http", hostname: "localhost", port: "1337", pathname: "/uploads/**" },
      // Deployed Strapi host, derived from STRAPI_URL at build time.
      ...strapiRemotePattern(),
    ],
    // Next 16 blocks optimizing images from local IPs by default (localhost → 127.0.0.1),
    // which rejects our local Strapi uploads with `"url" parameter is not allowed`. Safe to
    // allow here because remotePatterns already restricts the optimizer to the Strapi host.
    // Also needed if Strapi is reached over localhost/a private IP on the same prod box.
    dangerouslyAllowLocalIP: true,
  },
};

export default nextConfig;
