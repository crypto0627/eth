import type { NextConfig } from 'next'
import { setupDevPlatform } from '@cloudflare/next-on-pages/next-dev';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  webpack: (config) => {
    config.resolve.fallback = { fs: false, net: false, tls: false };
    config.externals.push("pino-pretty", "lokijs", "encoding");
    return config
  },
  api: {
    responseLimit: false,
    bodyParser: {
      sizeLimit: '1mb',
    },
  },
}

if (process.env.NODE_ENV === 'development') {
  await setupDevPlatform();
}

export default nextConfig
