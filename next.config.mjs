/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'cdn.sofifa.net' },
      { protocol: 'https', hostname: 'media.api-sports.io' },
    ],
  },
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      'iceberg-js': false,
    };
    return config;
  },
};
export default nextConfig;
