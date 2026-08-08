import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  output: "standalone",
  transpilePackages: ["@workspace/ui"],
  compress: true,
  reactCompiler: true,
  cacheMaxMemorySize: 250 * 1024 * 1024, // 250MB
  productionBrowserSourceMaps: false,
  enablePrerenderSourceMaps: false,
  cacheComponents: false,
  experimental: {
    inlineCss: true,
    optimizeCss: true,
    serverSourceMaps: false,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    qualities: [25, 75, 100],
    // Local dev serves attachments from https://localhost:8082, which resolves
    // to a loopback IP that Next's optimizer blocks by default (SSRF guard).
    dangerouslyAllowLocalIP: process.env.NODE_ENV !== "production",
    remotePatterns: [
      {
        protocol: "https",
        hostname: "assets.imc.yz13.dev",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "localhost",
        port: "8082",
        pathname: "/**",
      },
      {
        protocol: "http",
        hostname: "localhost",
        port: "8082",
        pathname: "/**",
      },
    ]
  }
}

export default nextConfig
