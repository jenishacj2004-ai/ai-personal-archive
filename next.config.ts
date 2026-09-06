import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["pdf-parse", "bcryptjs"],
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
