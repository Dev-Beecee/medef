import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'medef.s3.us-east-2.amazonaws.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
  // Note: Les uploads se font maintenant directement vers S3 via Presigned URLs
  // Plus besoin de configuration spéciale côté Next.js
};

export default nextConfig;
