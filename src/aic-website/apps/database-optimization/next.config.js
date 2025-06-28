/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    appDir: true,
    serverComponentsExternalPackages: ['pg', 'mongodb', 'redis', 'mysql2', 'sqlite3'],
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: false,
  },
  images: {
    domains: ['localhost', 'aicorp.com'],
    formats: ['image/webp', 'image/avif'],
  },
  async rewrites() {
    return [
      {
        source: '/api/db/:path*',
        destination: 'http://localhost:3005/api/:path*',
      },
      {
        source: '/api/metrics/:path*',
        destination: 'http://localhost:3006/api/:path*',
      },
    ];
  },
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
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
        database: {
          test: /[\\/](pg|mongodb|redis|mysql2|sqlite3)[\\/]/,
          name: 'database-drivers',
          chunks: 'all',
          priority: 10,
        },
      },
    };

    // Add support for native modules
    if (isServer) {
      config.externals.push('pg-native');
    }

    return config;
  },
  env: {
    CUSTOM_KEY: 'database-optimization',
    BUILD_TIME: new Date().toISOString(),
  },
};

module.exports = nextConfig;
