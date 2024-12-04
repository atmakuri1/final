const path = require("path");

/** @type {import('next').NextConfig} */
const nextConfig = {
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
