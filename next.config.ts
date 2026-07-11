import type { NextConfig } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      allowedOrigins: siteUrl ? [new URL(siteUrl).host] : [],
    },
  },
};

export default nextConfig;
