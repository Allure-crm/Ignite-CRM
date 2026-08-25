import baseConfig from '../brand.config.js'
import { seedBriefs } from './seedBriefs.js'

// Merge runtime overrides (from Settings / Manage Lists) onto brand.config defaults.
export function mergedConfig(overrides = {}) {
  return {
    ...baseConfig,
    ...overrides,
    fieldLabels: { ...baseConfig.fieldLabels, ...(overrides.fieldLabels || {}) },
    formatTypes: overrides.formatTypes || baseConfig.formatTypes || [],
    statuses: baseConfig.statuses,
    transitions: baseConfig.transitions,
    roles: baseConfig.roles,
  }
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export function sanitize(s) {
  return String(s || '').replace(/[^a-zA-Z0-9-]/g, '')
}

// e.g. TY Batch #1
export function briefName({ abbr, briefNumber }) {
  return `${abbr} Batch #${briefNumber}`
}

export function nextBriefNumber(briefs) {
  return briefs.reduce((m, b) => Math.max(m, b.briefNumber || 0), 0) + 1
}

export function uuid() {
  return crypto.randomUUID ? crypto.randomUUID() : 'id-' + Date.now() + '-' + Math.random().toString(36).slice(2)
}

export function fmtDate(d) {
  if (!d) return ''
  const dt = typeof d === 'number' ? new Date(d) : new Date(d + (String(d).length === 10 ? 'T00:00:00' : ''))
  return dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export function ageDays(ts) {
  return Math.max(0, Math.floor((Date.now() - ts) / 86400000))
}

// ---------- Date grouping (month / week) ----------

// 'YYYY-MM-DD' -> local Date at midnight. Returns null for anything unparseable.
export function parseDay(d) {
  if (!d) return null
  const dt = new Date(String(d).length === 10 ? d + 'T00:00:00' : d)
  return isNaN(dt.getTime()) ? null : dt
}

export function toDayKey(dt) {
  const m = String(dt.getMonth() + 1).padStart(2, '0')
  const d = String(dt.getDate()).padStart(2, '0')
  return `${dt.getFullYear()}-${m}-${d}`
}

export function todayKey() {
  return toDayKey(new Date())
}

// 'YYYY-MM-DD' -> 'YYYY-MM'
export function monthKey(d) {
  const s = String(d || '')
  return s.length >= 7 ? s.slice(0, 7) : ''
}

// 'YYYY-MM' -> 'Jun 2026'
export function monthLabel(key) {
  const [y, m] = String(key || '').split('-')
  return MONTHS[Number(m) - 1] ? `${MONTHS[Number(m) - 1]} ${y}` : key
}

// Monday-start week containing the given day; returns the Monday as 'YYYY-MM-DD'.
export function weekStartKey(d) {
  const dt = parseDay(d)
  if (!dt) return ''
  const offset = (dt.getDay() + 6) % 7 // Mon = 0 ... Sun = 6
  dt.setDate(dt.getDate() - offset)
  return toDayKey(dt)
}

// 'YYYY-MM-DD' (a Monday) -> 'Jun 1 – Jun 7'
export function weekRangeLabel(startKey) {
  const start = parseDay(startKey)
  if (!start) return ''
  const end = parseDay(startKey)
  end.setDate(end.getDate() + 6)
  return `${fmtDate(startKey)} – ${fmtDate(toDayKey(end))}`
}

export function addDays(key, n) {
  const dt = parseDay(key)
  if (!dt) return ''
  dt.setDate(dt.getDate() + n)
  return toDayKey(dt)
}

export function dayLabel(key) {
  const dt = parseDay(key)
  if (!dt) return key || ''
  return dt.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
}

// Simplified board used in Overview → Pipeline.
export const PIPELINE_LANES = [
  { key: 'scripting', label: 'Scripting', color: '#94a3b8', statuses: ['scripting', 'script_review', 'script_revision'] },
  { key: 'ready_for_editing', label: 'Ready for Editing', color: '#f59e0b', statuses: ['assign_editor', 'needs_editing', 'ugc_content_needed', 'ugc_content_approved'] },
  { key: 'needs_review', label: 'Needs Review', color: '#ec4899', statuses: ['needs_review', 'needs_revision', 'ugc_content_review', 'ugc_content_revision'] },
  { key: 'ready_to_launch', label: 'Ready to Launch', color: '#22c55e', statuses: ['ready_to_launch'] },
  { key: 'launched', label: 'Launched', color: '#3b82f6', statuses: ['launched'] },
]

export function briefsInPeriod(briefs, period, key) {
  return briefs.filter((b) => {
    const d = b.date || ''
    if (!d) return false
    if (period === 'daily') return d === key
    return weekStartKey(d) === key
  })
}

export function formatTypeOptions(config, extra = []) {
  const seen = new Set()
  const out = []
  for (const value of [...(config.formatTypes || []), ...extra]) {
    const text = String(value || '').trim()
    if (!text) continue
    const key = text.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    out.push(text)
  }
  return out
}

export function importMissingBriefs(existingBriefs) {
  const existingNumbers = new Set(
    existingBriefs.map((b) => b.briefNumber).filter(Boolean)
  )
  const toAdd = []
  for (const seed of seedBriefs) {
    if (existingNumbers.has(seed.batchNumber)) continue
    const now = Date.now()
    toAdd.push({
      id: uuid(),
      name: seed.name,
      strategist: seed.strategist,
      date: seed.date,
      persona: '',
      awarenessStage: seed.awarenessStage,
      type: seed.type,
      formatType: seed.formatType,
      adConcept: seed.adConcept,
      angle: seed.angle,
      facebookPage: seed.facebookPage,
      landingPage: seed.landingPage,
      scriptLink: seed.scriptLink,
      finalVideoLink: seed.finalVideoLink,
      ugcAssetsLink: '',
      postId: seed.postId,
      learnings: seed.learnings,
      assignedTo: null,
      status: seed.status,
      briefNumber: seed.batchNumber,
      createdAt: now,
      updatedAt: now,
      launchedAt: seed.status === 'launched' ? now : null,
      history: [{ status: seed.status, by: 'Import', at: now, note: 'Imported from Creative Tracker' }],
    })
  }
  return toAdd
}

export function canCreateBriefs(role) {
  return role !== 'video_editor'
}

export function canDeleteBriefs(role) {
  return role !== 'video_editor'
}

// Video editors may only submit a cut for review or resubmit after revision.
const EDITOR_ALLOWED_TO = {
  needs_editing: ['needs_review'],
  needs_revision: ['needs_review'],
}

export function allowedTransitions(config, status, role) {
  const all = config.transitions[status] || []
  if (role !== 'video_editor') return all
  const allowedTo = EDITOR_ALLOWED_TO[status]
  if (!allowedTo) return []
  return all.filter((t) => allowedTo.includes(t.to))
}

export function applyTransition(brief, transition, { by, note, assignTo }) {
  const now = Date.now()
  const entry = { status: transition.to, by, at: now }
  if (note) entry.note = note
  return {
    ...brief,
    status: transition.to,
    assignedTo: transition.needsAssignment ? assignTo : brief.assignedTo,
    launchedAt: transition.to === 'launched' ? now : brief.launchedAt,
    result: transition.to === 'launched' ? 'Testing' : brief.result,
    updatedAt: now,
    history: [...(brief.history || []), entry],
  }
}
