import type { NextConfig } from "next";

const nextConfig: NextConfig = {

  reactCompiler: true,
  /* Pin the Turbopack workspace root: multiple lockfiles above this project
     otherwise make Turbopack pick a wrong root and miss new routes. */
  turbopack: {
    root: __dirname,
  },
  /* config options here */
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'plus.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'via.placeholder.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'uncarecdn.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'oaidalleapiprodscus.blob.core.window.net',
        port: '',
        pathname: '/**',
      },
    ]
  }
};

export default nextConfig;
