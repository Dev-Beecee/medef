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
  // Configuration pour gérer les gros fichiers (vidéos jusqu'à 5GB)
  experimental: {
    // Augmenter la limite de taille pour les uploads
    serverActions: {
      bodySizeLimit: '5gb',
    },
  },
  // Configuration des headers pour augmenter les timeouts
  async headers() {
    return [
      {
        source: '/api/upload',
        headers: [
          {
            key: 'Connection',
            value: 'keep-alive',
          },
          {
            key: 'Keep-Alive',
            value: 'timeout=1800', // 30 minutes
          },
        ],
      },
    ];
  },
};

export default nextConfig;
