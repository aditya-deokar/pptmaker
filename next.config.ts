import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images:{
    remotePatterns:[
      {
        protocol:'https',
        hostname:'images.unsplash.com',
        port:'',
        pathname:'/**',
      },
      {
        protocol:'https',
        hostname:'via.placeholder.com',
        port:'',
        pathname:'/**',
      },
      {
        protocol:'https',
        hostname:'uncarecdn.com',
        port:'',
        pathname:'/**',
      },
      {
        protocol:'https',
        hostname:'oaidalleapiprodscus.blob.core.window.net',
        port:'',
        pathname:'/**',
      },
    ]
  }
};

export default nextConfig;
