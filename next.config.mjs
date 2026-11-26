/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async redirects() {
    return [{ source: '/admin/login', destination: '/login', permanent: false }];
  },
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
