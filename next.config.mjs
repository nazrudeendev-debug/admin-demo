/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "fdn2.gsmarena.com",
      },
      {
        protocol: "https",
        hostname: "**", // This allows all domains (use with caution in production)
      },
    ],
  },
  experimental: {
    serverActions: {
      allowedOrigins: ["*"],
    },
  },
  allowedDevOrigins: [
    "d5f5651b-7f50-4633-821e-c11aa3544dc8-00-3ngweelyla6x7.sisko.replit.dev",
    "*.replit.dev",
    "*.repl.co",
    "127.0.0.1",
    "localhost",
  ],
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Access-Control-Allow-Origin",
            value: "*",
          },
          {
            key: "Access-Control-Allow-Methods",
            value: "GET, POST, PUT, DELETE, OPTIONS",
          },
          {
            key: "Access-Control-Allow-Headers",
            value: "X-Requested-With, Content-Type, Authorization",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
