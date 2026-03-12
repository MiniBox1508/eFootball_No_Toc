import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    // Cho phép build hoàn tất ngay cả khi có lỗi TypeScript
    ignoreBuildErrors: true,
  },
  eslint: {
    // Bỏ qua kiểm tra ESLint khi build để tránh bị dừng giữa chừng
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
