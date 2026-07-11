import type { NextConfig } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
const configuredOrigin = siteUrl ? [new URL(siteUrl).host] : [];
const developmentOrigins = process.env.NODE_ENV === "development" ? ["*.app.github.dev"] : [];

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [{ protocol: "https", hostname: "wcpalsbixksjmwsiorxq.supabase.co", pathname: "/storage/v1/object/public/store-assets/**" }],
  },
  experimental: {
    serverActions: {
      allowedOrigins: [...configuredOrigin, ...developmentOrigins],
    },
  },
};

export default nextConfig;
