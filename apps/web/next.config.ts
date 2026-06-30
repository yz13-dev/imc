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
    remotePatterns: [
      {
        protocol: "https",
        hostname: "assets.imc.yz13.dev",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "localhost",
        port: "8080",
        pathname: "/**",
      },
      {
        protocol: "http",
        hostname: "localhost",
        port: "8080",
        pathname: "/**",
      },
    ]
  }
}

export default nextConfig
