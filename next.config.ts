import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // allow local proxy route for preview
    localPatterns: [{ pathname: "/api/image" }],
    // allow your single hosted CDN
    remotePatterns: [
      { protocol: "https", hostname: "utfs.io", pathname: "/**" },
      { protocol: "https", hostname: "images.unsplash.com" },
    ],
  },
};

export default nextConfig;
