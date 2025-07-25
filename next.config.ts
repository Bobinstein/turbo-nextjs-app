import type { NextConfig } from "next";
const webpack = require("webpack");

const nextConfig: NextConfig = {
  webpack: (config, { isServer }) => {
    // Only configure polyfills for client-side bundles
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        crypto: require.resolve("crypto-browserify"),
        stream: require.resolve("stream-browserify"),
        buffer: require.resolve("buffer"),
        process: require.resolve("process/browser"),
        fs: false,
        net: false,
        tls: false,
      };

      // Provide global process and Buffer
      config.plugins.push(
        new webpack.ProvidePlugin({
          process: "process/browser",
          Buffer: ["buffer", "Buffer"],
        })
      );
    }

    return config;
  },
};

export default nextConfig;
