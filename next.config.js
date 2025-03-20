// @ts-check

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: false,
  experimental: {
    forceSwcTransforms: false
  },
  webpack: (config, { isServer }) => {
    // Handle HTML files
    config.module.rules.push({
      test: /\.html$/,
      use: 'raw-loader'
    });

    // If client-side, don't attempt to load these node modules
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        'fs': false,
        'net': false,
        'tls': false,
        'crypto': false,
        'nock': false,
        'mock-aws-s3': false,
        'aws-sdk': false,
        'node-gyp': false,
        'npm': false,
        'redis': false,
        'ioredis': false,
        'redis-errors': false,
        'stream': false,
        'buffer': false,
        'util': false,
        'assert': false,
        'http': false,
        'https': false,
        'os': false,
        'path': false,
        'url': false,
        'zlib': false,
        'querystring': false,
        'punycode': false,
        'readline': false,
        'string_decoder': false,
        'timers': false,
        'events': false,
        'process': false
      };
    }

    return config;
  }
}

module.exports = nextConfig; 