// Storage adapter: localStorage by default, Supabase when configured.
// Both expose the same API:
//   init() -> { briefs, overrides }
//   saveBriefs(briefs)
//   upsertBrief(brief) / deleteBrief(id)
//   saveOverrides(overrides)
//   subscribe(onChange)  -> realtime updates (supabase mode only)

import config from '../brand.config.js'

const LS_BRIEFS = `${config.storageKey}_crm_briefs`
const LS_OVERRIDES = `${config.storageKey}_crm_overrides`
const LS_USER = `${config.storageKey}_crm_user`
const LS_UNLOCKED = `${config.storageKey}_crm_unlocked`
const PERSIST_SECONDS = 60 * 60 * 24 * 365

function cookieSafeName(name) {
  return name.replace(/[^a-zA-Z0-9_-]/g, '_')
}

function writePersistent(key, value) {
  try { localStorage.setItem(key, value) } catch {}
  if (typeof document === 'undefined') return
  const secure = typeof location !== 'undefined' && location.protocol === 'https:' ? '; Secure' : ''
  document.cookie = `${cookieSafeName(key)}=${encodeURIComponent(value)}; Max-Age=${PERSIST_SECONDS}; Path=/; SameSite=Lax${secure}`
}

function readPersistent(key) {
  try {
    const stored = localStorage.getItem(key)
    if (stored != null && stored !== '') return stored
  } catch {}
  if (typeof document === 'undefined') return null
  const name = cookieSafeName(key)
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`))
  return match ? decodeURIComponent(match[1]) : null
}

function clearPersistent(key) {
  try { localStorage.removeItem(key) } catch {}
  if (typeof document === 'undefined') return
  document.cookie = `${cookieSafeName(key)}=; Max-Age=0; Path=/`
}

function unlockToken() {
  const password = String(config.accessPassword || '')
  let hash = 2166136261
  for (let i = 0; i < password.length; i++) {
    hash ^= password.charCodeAt(i)
    hash = Math.imul(hash, 16777619)
  }
  return `v1_${(hash >>> 0).toString(16)}`
}

const env = typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env : {}

export function supabaseCreds() {
  const url = String(env.VITE_SUPABASE_URL || config.supabase?.url || '').trim()
  const anonKey = String(env.VITE_SUPABASE_ANON_KEY || config.supabase?.anonKey || '').trim()
  return { url, anonKey }
}

export const isSupabase = Boolean(supabaseCreds().url && supabaseCreds().anonKey)

function fail(action, error) {
  const message = error?.message || String(error)
  throw new Error(`${action}: ${message}`)
}

let sb = null
async function client() {
  if (!sb) {
    const { url, anonKey } = supabaseCreds()
    const { createClient } = await import('@supabase/supabase-js')
    sb = createClient(url, anonKey)
  }
  return sb
}

// ---------- current user + access gate (always local to this browser) ----------
export function loadUser() {
  try {
    const raw = readPersistent(LS_USER)
    if (!raw || raw === 'null') return null
    return JSON.parse(raw)
  } catch {
    return null
  }
}
export function saveUser(user) {
  if (!user) {
    clearPersistent(LS_USER)
    return
  }
  writePersistent(LS_USER, JSON.stringify(user))
}

export function loadUnlocked() {
  const saved = readPersistent(LS_UNLOCKED)
  const ok = saved === unlockToken() || saved === '1'
  if (ok) writePersistent(LS_UNLOCKED, unlockToken())
  return ok
}

export function saveUnlocked() {
  writePersistent(LS_UNLOCKED, unlockToken())
}

const LS_INTAKES = `${config.storageKey}_crm_intakes`

// ---------- localStorage mode ----------
const local = {
  async init() {
    let briefs = []
    let overrides = {}
    let intakes = []
    try { briefs = JSON.parse(localStorage.getItem(LS_BRIEFS)) || [] } catch {}
    try { overrides = JSON.parse(localStorage.getItem(LS_OVERRIDES)) || {} } catch {}
    try { intakes = JSON.parse(localStorage.getItem(LS_INTAKES)) || [] } catch {}
    return { briefs, overrides, intakes }
  },
  async upsertBrief(brief, all) {
    localStorage.setItem(LS_BRIEFS, JSON.stringify(all))
  },
  async deleteBrief(id, all) {
    localStorage.setItem(LS_BRIEFS, JSON.stringify(all))
  },
  async saveOverrides(overrides) {
    localStorage.setItem(LS_OVERRIDES, JSON.stringify(overrides))
  },
  async saveIntake(entry, allIntakes) {
    localStorage.setItem(LS_INTAKES, JSON.stringify(allIntakes))
  },
  subscribe() { return () => {} },
}

// ---------- supabase mode ----------
const remote = {
  async init() {
    const c = await client()
    const [b, s, intk] = await Promise.all([
      c.from('briefs').select('id, data'),
      c.from('settings').select('key, data').eq('key', 'overrides').maybeSingle(),
      c.from('settings').select('key, data').eq('key', 'intakes').maybeSingle(),
    ])
    if (b.error) fail('Load briefs', b.error)
    if (s.error) fail('Load settings', s.error)
    if (intk.error) fail('Load intakes', intk.error)
    return {
      briefs: (b.data || []).map((r) => r.data),
      overrides: s.data?.data || {},
      intakes: intk.data?.data || [],
    }
  },
  async upsertBrief(brief) {
    const c = await client()
    const { error } = await c.from('briefs').upsert({ id: brief.id, data: brief, updated_at: new Date().toISOString() })
    if (error) fail('Save brief', error)
  },
  async deleteBrief(id) {
    const c = await client()
    const { error } = await c.from('briefs').delete().eq('id', id)
    if (error) fail('Delete brief', error)
  },
  async saveOverrides(overrides) {
    const c = await client()
    const { error } = await c.from('settings').upsert({ key: 'overrides', data: overrides })
    if (error) fail('Save lists', error)
  },
  async saveIntake(entry, allIntakes) {
    const c = await client()
    const { error } = await c.from('settings').upsert({ key: 'intakes', data: allIntakes })
    if (error) fail('Save intake', error)
  },
  subscribe(onChange) {
    let channel
    client().then((c) => {
      channel = c
        .channel('crm-sync')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'briefs' }, onChange)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'settings' }, onChange)
        .subscribe()
    })
    return () => { if (channel) channel.unsubscribe() }
  },
}

export const store = isSupabase ? remote : local
