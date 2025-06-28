/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  experimental: {
    appDir: true,
  },
  images: {
    domains: ['localhost', 'aic.com', 'cdn.aic.com'],
    formats: ['image/webp', 'image/avif'],
  },
  env: {
    ANALYTICS_API_URL: process.env.ANALYTICS_API_URL || 'http://localhost:3001',
    WEBSOCKET_URL: process.env.WEBSOCKET_URL || 'ws://localhost:3001',
  },
  async rewrites() {
    return [
      {
        source: '/api/analytics/:path*',
        destination: `${process.env.ANALYTICS_API_URL || 'http://localhost:3001'}/api/v1/:path*`,
      },
    ];
  },
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // Optimize bundle size
    config.optimization.splitChunks = {
      chunks: 'all',
      cacheGroups: {
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          chunks: 'all',
        },
        charts: {
          test: /[\\/]node_modules[\\/](recharts|d3)[\\/]/,
          name: 'charts',
          chunks: 'all',
        },
      },
    };

    return config;
  },
};

// Bundle analyzer
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

module.exports = withBundleAnalyzer(nextConfig);
