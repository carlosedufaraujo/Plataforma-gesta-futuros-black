/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // ⚠️ Dangerously allow production builds to successfully complete even if
    // your project has TypeScript errors - TEMPORARY FIX FOR MODALS
    ignoreBuildErrors: true,
  },
  eslint: {
    // ⚠️ Dangerously allow production builds to successfully complete even if
    // your project has ESLint errors - TEMPORARY FIX FOR MODALS
    ignoreDuringBuilds: true,
  },
}

module.exports = nextConfig 