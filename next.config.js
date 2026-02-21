const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },
  images: {
    unoptimized: true,
  },
  trailingSlash: false,
  skipTrailingSlashRedirect: true,
  // Optimize package imports for tree-shaking (smaller bundles)
  experimental: {
    optimizePackageImports: ['firebase', 'firebase/auth', 'firebase/firestore', 'firebase/analytics', 'recharts'],
  },
  // Strip console in production
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? { exclude: ['error', 'warn'] } : false,
  },
  webpack: (config, { isServer }) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.resolve(__dirname),
    };
    // Vendor chunk splitting for better caching
    if (!isServer) {
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            firebase: {
              test: /[\\/]node_modules[\\/](@firebase|firebase)[\\/]/,
              name: 'firebase',
            },
            react: {
              test: /[\\/]node_modules[\\/](react|react-dom)[\\/]/,
              name: 'react',
            },
            recharts: {
              test: /[\\/]node_modules[\\/]recharts[\\/]/,
              name: 'recharts',
            },
          },
        },
      };
    }
    return config;
  },
};

module.exports = nextConfig;
