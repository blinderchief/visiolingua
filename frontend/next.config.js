/** @type {import('next').NextConfig} */
const nextConfig = {
  // experimental.appDir is no longer needed in Next.js 15

  // Memory optimization settings
  experimental: {
    // Reduce memory usage in development
    webpackBuildWorker: false,
  },

  // Webpack configuration for better memory management
  webpack: (config, { dev }) => {
    if (dev) {
      // Reduce bundle size in development
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          ...config.optimization.splitChunks,
          cacheGroups: {
            ...config.optimization.splitChunks?.cacheGroups,
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name: 'vendors',
              chunks: 'all',
              priority: 10,
            },
          },
        },
      }
    }
    return config
  },
}

module.exports = nextConfig