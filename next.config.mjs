/** @type {import('next').NextConfig} */

// Supabase Storage serves uploaded media from `<project-ref>.supabase.co`.
// Deriving the pattern from the env var keeps this working across projects
// (local, staging, production) without editing config per environment.
const supabaseHost = (() => {
  try {
    return new URL(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").hostname;
  } catch {
    return null;
  }
})();

const nextConfig = {
  images: {
    remotePatterns: supabaseHost
      ? [{ protocol: "https", hostname: supabaseHost, pathname: "/storage/v1/object/public/**" }]
      : [],
    formats: ["image/avif", "image/webp"],
  },
};

export default nextConfig;
