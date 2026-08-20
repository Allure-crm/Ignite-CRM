import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { resolveSupabaseCreds } from './src/lib/supabaseEnv.js'

export default defineConfig(({ mode }) => {
  const fileEnv = loadEnv(mode, process.cwd(), '')
  const { url, anonKey } = resolveSupabaseCreds({ ...fileEnv, ...process.env })

  return {
    plugins: [react()],
    define: {
      'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(url),
      'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(anonKey),
    },
    build: {
      outDir: 'dist',
      sourcemap: false,
    },
  }
})
