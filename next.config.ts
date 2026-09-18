import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Permite acessar o servidor de dev via as URLs públicas do sandbox
  // (proxy do ambiente de desenvolvimento). Não afeta produção na Vercel.
  allowedDevOrigins: ['*.sandbox.gensparksite.com', '*.sandbox.novita.ai'],
};

export default nextConfig;
