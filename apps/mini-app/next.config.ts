import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@alien_org/react", "@alien_org/bridge", "@alien_org/auth-client"],
};

export default nextConfig;
