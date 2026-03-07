import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,

  allowedDevOrigins: [
    "localhost",
    "192.168.0.199"
  ],
};

export default nextConfig;