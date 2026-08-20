// Apply supabase/schema.sql when a Postgres URL is present (Vercel Marketplace).
// Safe to run more than once. Skips when no database is configured.
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import pg from 'pg'
import { postgresUrl } from '../src/lib/supabaseEnv.js'

const connectionString = postgresUrl(process.env)
if (!connectionString) {
  console.log('No POSTGRES_URL / DATABASE_URL — skipping CRM schema setup.')
  process.exit(0)
}

const schemaPath = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'supabase', 'schema.sql')
const sql = fs.readFileSync(schemaPath, 'utf8')

const client = new pg.Client({
  connectionString,
  ssl: { rejectUnauthorized: false },
})

try {
  await client.connect()
  await client.query(sql)
  console.log('Applied supabase/schema.sql')
} catch (error) {
  console.error('Failed to apply supabase/schema.sql:', error.message)
  process.exit(1)
} finally {
  await client.end().catch(() => {})
}
