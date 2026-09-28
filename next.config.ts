import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  serverExternalPackages: ["read-excel-file"],

  allowedDevOrigins: [
    "localhost",
    "192.168.0.199"
  ],
};

export default nextConfig;
