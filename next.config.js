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

module.exports = withBundleAnalyzer(withPWA({}))
