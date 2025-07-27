/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configurações para Cloudflare Pages
  output: 'export',
  images: {
    unoptimized: true,
  },
  // Desabilitar telemetria do Next.js
  telemetry: false,
  // Configurações de produção
  poweredByHeader: false,
  compress: true,
  // Variáveis de ambiente
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
  },
};

export default nextConfig;