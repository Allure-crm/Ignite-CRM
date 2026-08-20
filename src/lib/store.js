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

export const isSupabase = Boolean(config.supabase?.url && config.supabase?.anonKey)

let sb = null
async function client() {
  if (!sb) {
    const { createClient } = await import('@supabase/supabase-js')
    sb = createClient(config.supabase.url, config.supabase.anonKey)
  }
  return sb
}

// ---------- current user (always local to the browser) ----------
export function loadUser() {
  try { return JSON.parse(localStorage.getItem(LS_USER)) } catch { return null }
}
export function saveUser(user) {
  localStorage.setItem(LS_USER, JSON.stringify(user))
}

export function loadUnlocked() {
  return localStorage.getItem(LS_UNLOCKED) === '1'
}

export function saveUnlocked() {
  localStorage.setItem(LS_UNLOCKED, '1')
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
    if (b.error) throw new Error('Supabase briefs: ' + b.error.message)
    return {
      briefs: (b.data || []).map((r) => r.data),
      overrides: s.data?.data || {},
      intakes: intk.data?.data || [],
    }
  },
  async upsertBrief(brief) {
    const c = await client()
    const { error } = await c.from('briefs').upsert({ id: brief.id, data: brief, updated_at: new Date().toISOString() })
    if (error) console.error('upsertBrief', error)
  },
  async deleteBrief(id) {
    const c = await client()
    const { error } = await c.from('briefs').delete().eq('id', id)
    if (error) console.error('deleteBrief', error)
  },
  async saveOverrides(overrides) {
    const c = await client()
    const { error } = await c.from('settings').upsert({ key: 'overrides', data: overrides })
    if (error) console.error('saveOverrides', error)
  },
  async saveIntake(entry, allIntakes) {
    const c = await client()
    const { error } = await c.from('settings').upsert({ key: 'intakes', data: allIntakes })
    if (error) console.error('saveIntake', error)
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
