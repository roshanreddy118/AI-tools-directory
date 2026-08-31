/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ["drizzle-orm"],
  },
};

export default nextConfig;
