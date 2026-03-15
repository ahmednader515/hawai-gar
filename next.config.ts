import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  async redirects() {
    return [
      { source: "/dashboard/driver", destination: "/dashboard/client", permanent: true },
      { source: "/dashboard/driver/orders", destination: "/dashboard/client/orders", permanent: true },
      { source: "/dashboard/driver/requests", destination: "/dashboard/client/requests", permanent: true },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
