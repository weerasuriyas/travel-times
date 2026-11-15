// The hosting panel still holds the browser settings under their old VITE_
// names from before the move to Next.js. Accept either name, so the same
// panel settings keep working.
const browserEnv = {}
for (const name of ['SUPABASE_URL', 'SUPABASE_ANON_KEY', 'GOOGLE_MAPS_API_KEY', 'API_URL']) {
  const value = process.env[`NEXT_PUBLIC_${name}`] || process.env[`VITE_${name}`]
  if (value) browserEnv[`NEXT_PUBLIC_${name}`] = value
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  images: { unoptimized: true },
  env: browserEnv,
}

export default nextConfig
