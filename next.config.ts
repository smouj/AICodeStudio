import type { NextConfig } from "next";

const isStatic = process.env.BUILD_MODE === "static";
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

const nextConfig: NextConfig = {
  // "standalone" for server mode, "export" for static demo (GitHub Pages)
  output: isStatic ? "export" : "standalone",
  reactStrictMode: true,
  // Required for GitHub Pages deployment
  ...(basePath ? { basePath, assetPrefix: `${basePath}/` } : {}),
  headers: async () => [
    {
      source: "/sw.js",
      headers: [
        {
          key: "Cache-Control",
          value: "public, max-age=0, must-revalidate",
        },
        {
          key: "Service-Worker-Allowed",
          value: "/",
        },
      ],
    },
  ],
};

export default nextConfig;
