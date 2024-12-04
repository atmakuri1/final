const path = require("path");

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config) => {
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      "@/theme": path.resolve(__dirname, "src/theme"),
      "@/components": path.resolve(__dirname, "src/components"),
    };
    return config;
  },
};

module.exports = nextConfig;
