/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: "export",
  basePath: "/sargtrack",
  assetPrefix: "/sargtrack",
  images: { unoptimized: true },
};
export default nextConfig;
