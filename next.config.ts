import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Produces .next/standalone with a minimal server.js + only the
  // node_modules actually needed at runtime — required for a small,
  // reproducible Docker image (see Dockerfile).
  output: "standalone",
  typescript: {
    ignoreBuildErrors: false,
  },
  // Dev-only (ignored by `next start`/standalone in production): lets
  // the E2E suite (and anyone else) reach `next dev` via 127.0.0.1
  // without Next's cross-origin dev-asset protection blocking it.
  allowedDevOrigins: ["127.0.0.1", "localhost"],
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
};

export default nextConfig;
