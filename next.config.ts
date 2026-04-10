import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 文献文件路径配置（允许跨域访问）
  async headers() {
    return [
      {
        source: '/literature/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Cache-Control', value: 'public, max-age=86400' },
        ],
      },
    ];
  },
};

export default nextConfig;
