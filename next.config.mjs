/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // Export statique pour Capacitor (WebView charge /out).
  output: "export",
  images: {
    unoptimized: true,
  },
  // trailingSlash aide certains WebViews à résoudre les assets correctement.
  trailingSlash: true,
};

export default nextConfig;
