/** @type {import('next').NextConfig} */

// Static export hanya saat build untuk hosting gratis (Vercel/Netlify/Cloudflare Pages/GitHub Pages).
// Jalankan: STATIC_EXPORT=1 npm run build  → hasil di folder `out/`
const isStaticExport = process.env.STATIC_EXPORT === "1";

// GitHub Pages (project site) dilayani di sub-path, mis. /ltq-lms/
// Diisi lewat NEXT_PUBLIC_BASE_PATH saat build (lihat .github/workflows/deploy-pages.yml)
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || undefined;

const nextConfig = {
  ...(isStaticExport
    ? {
        output: "export",
        trailingSlash: true, // /login/ → /login/index.html (kompatibel semua static host)
        ...(basePath ? { basePath } : {}),
      }
    : {}),
};

export default nextConfig;
