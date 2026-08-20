// Resolve client-side Supabase credentials from the names this Vite app
// expects, plus the names Vercel Marketplace / Next.js integrations inject.
export function resolveSupabaseCreds(env = {}, fallback = {}) {
  const url = String(
    env.VITE_SUPABASE_URL
    || env.NEXT_PUBLIC_SUPABASE_URL
    || env.SUPABASE_URL
    || fallback.url
    || '',
  ).trim()
  const anonKey = String(
    env.VITE_SUPABASE_ANON_KEY
    || env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    || env.SUPABASE_ANON_KEY
    || fallback.anonKey
    || '',
  ).trim()
  return { url, anonKey }
}

export function postgresUrl(env = {}) {
  return String(
    env.POSTGRES_URL_NON_POOLING
    || env.POSTGRES_URL
    || env.DATABASE_URL
    || '',
  ).trim()
}
