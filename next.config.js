const withPWAfn = require('next-pwa')
const runtimeCaching = require('next-pwa/cache')

const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
})
const withPWA = withPWAfn({
  dest: 'public',
  runtimeCaching,
  disable: process.env.NODE_ENV === 'development',
  buildExcludes: [/middleware-manifest.json$/],
})

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Cloudflare Pages に静的ファイルとして置く (math-kb と同じ構成)。
  // API ルート / middleware / 動的ルート / next/image を使っていないので export で足りる
  output: 'export',
  distDir: 'dist',
  outputFileTracingRoot: __dirname,
  images: {
    unoptimized: true,
  },
  transpilePackages: ['three'],
  compiler: {
    styledComponents: true,
  },
}

module.exports = withBundleAnalyzer(withPWA(nextConfig))
