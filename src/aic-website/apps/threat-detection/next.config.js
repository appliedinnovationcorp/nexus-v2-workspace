/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    appDir: true,
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
        source: '/api/security/:path*',
        destination: 'http://localhost:3004/api/:path*',
      },
      {
        source: '/api/siem/:path*',
        destination: 'http://localhost:3005/api/:path*',
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
          { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
          { key: 'Content-Security-Policy', value: "default-src 'self'; script-src 'self' 'unsafe-eval'; style-src 'self' 'unsafe-inline';" },
        ],
      },
    ];
  },
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // Security-focused webpack configuration
    config.optimization.splitChunks = {
      chunks: 'all',
      cacheGroups: {
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          chunks: 'all',
        },
        security: {
          test: /[\\/]security[\\/]/,
          name: 'security',
          chunks: 'all',
          priority: 10,
        },
      },
    };

    // Add security plugins
    config.plugins.push(
      new webpack.DefinePlugin({
        'process.env.SECURITY_MODE': JSON.stringify(process.env.NODE_ENV === 'production' ? 'strict' : 'development'),
        'process.env.THREAT_DETECTION_VERSION': JSON.stringify(require('./package.json').version),
      })
    );

    return config;
  },
  env: {
    CUSTOM_KEY: 'threat-detection-system',
    BUILD_TIME: new Date().toISOString(),
    SECURITY_LEVEL: 'enterprise',
  },
  // Security-focused configuration
  poweredByHeader: false,
  compress: true,
  generateEtags: false,
};

module.exports = nextConfig;
