const path = require("path");

/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // This will ignore TypeScript errors during the build process
    ignoreBuildErrors: true,
  },
  eslint: {
    // This will ignore ESLint errors during the build process
    ignoreDuringBuilds: true,
  },
  reactStrictMode: true,
  webpack: (config) => {
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      "@/context": path.resolve(__dirname, "src/context"),
    };
    return config;
  },
};

module.exports = nextConfig;
