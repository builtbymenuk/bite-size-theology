import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  // Pin the workspace root — a stray lockfile in the home dir otherwise misleads file tracing.
  turbopack: { root: path.resolve(process.cwd()) },
  // Strapi-hosted media for next/image. Without an allowlisted host, next/image throws.
  // Add the deployed Strapi host here (or derive it from STRAPI_URL) at deploy time.
  images: {
    remotePatterns: [
      { protocol: "http", hostname: "localhost", port: "1337", pathname: "/uploads/**" },
    ],
    // Next 16 blocks optimizing images from local IPs by default (localhost → 127.0.0.1),
    // which rejects our local Strapi uploads with `"url" parameter is not allowed`. Safe to
    // allow here because remotePatterns already restricts the optimizer to the Strapi host.
    // Also needed if Strapi is reached over localhost/a private IP on the same prod box.
    dangerouslyAllowLocalIP: true,
  },
};

export default nextConfig;
