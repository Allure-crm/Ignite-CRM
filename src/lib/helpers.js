import baseConfig from '../brand.config.js'
import { seedBriefs } from './seedBriefs.js'

// Merge runtime overrides (from Settings / Manage Lists) onto brand.config defaults.
export const UNASSIGNED_EDITOR = 'Unassigned'
export const COPY_SUFFIX = ' - Copy'
export const FUNNEL_VALUES = ['TOF', 'MOF', 'BOF']
const FUNNEL_SET = new Set(FUNNEL_VALUES)

export const DEFAULT_FORMAT_TYPES = {
  Video: ['UGC', 'VSL', 'Celebrity NIL', 'Animated', 'Podcast Clip', 'Talking Head'],
  Static: ['Product Shot', 'Lifestyle', 'Testimonial Card', 'Comparison'],
  Native: ['Advertorial', 'Listicle', 'Confessional'],
}

export function mergedConfig(overrides = {}) {
  const formatTypesByFormat = {
    ...DEFAULT_FORMAT_TYPES,
    ...(baseConfig.formatTypesByFormat || {}),
    ...(overrides.formatTypesByFormat || {}),
  }
  const formatTypes = overrides.formatTypes
    || uniqueStrings(Object.values(formatTypesByFormat).flat().concat(baseConfig.formatTypes || []))
  return {
    ...baseConfig,
    ...overrides,
    fieldLabels: { ...baseConfig.fieldLabels, ...(overrides.fieldLabels || {}) },
    formatTypes,
    formatTypesByFormat,
    funnels: overrides.funnels || baseConfig.funnels || FUNNEL_VALUES,
    extraStrategists: overrides.extraStrategists || baseConfig.extraStrategists || [],
    extraEditors: overrides.extraEditors || baseConfig.extraEditors || [],
    extraAngles: overrides.extraAngles || baseConfig.extraAngles || [],
    statuses: baseConfig.statuses,
    transitions: baseConfig.transitions,
    roles: baseConfig.roles,
  }
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export function sanitize(s) {
  return String(s || '').replace(/[^a-zA-Z0-9-]/g, '')
}

export function uniqueStrings(values) {
  const seen = new Set()
  const out = []
  for (const value of values || []) {
    const text = String(value || '').trim()
    if (!text) continue
    const key = text.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    out.push(text)
  }
  return out
}

export function isFunnelValue(value) {
  return FUNNEL_SET.has(String(value || '').trim())
}

export function briefEditor(brief) {
  const editor = String(brief?.editor || '').trim()
  if (editor) return editor
  const assigned = String(brief?.assignedTo || '').trim()
  if (assigned) return assigned
  return UNASSIGNED_EDITOR
}

export function briefFunnel(brief) {
  const funnel = String(brief?.funnel || '').trim()
  if (funnel) return funnel
  const stage = String(brief?.awarenessStage || '').trim()
  return isFunnelValue(stage) ? stage : ''
}

export function briefAwareness(brief) {
  const awareness = String(brief?.awareness || '').trim()
  if (awareness) return awareness
  const stage = String(brief?.awarenessStage || '').trim()
  return stage && !isFunnelValue(stage) ? stage : ''
}

export function namingFields(brief = {}) {
  return {
    strategist: String(brief.strategist || '').trim(),
    editor: briefEditor(brief),
    type: String(brief.type || '').trim(),
    formatType: String(brief.formatType || '').trim(),
    funnel: briefFunnel(brief),
    awareness: briefAwareness(brief),
    persona: String(brief.persona || '').trim(),
    angle: String(brief.angle || '').trim(),
  }
}

export function csNameParts(source = {}) {
  const fields = source.strategist !== undefined && source.editor !== undefined
    ? {
      strategist: String(source.strategist || '').trim(),
      editor: String(source.editor || '').trim() || UNASSIGNED_EDITOR,
      type: String(source.type || '').trim(),
      formatType: String(source.formatType || '').trim(),
      funnel: String(source.funnel || '').trim(),
      awareness: String(source.awareness || '').trim(),
      persona: String(source.persona || '').trim(),
      angle: String(source.angle || '').trim(),
    }
    : namingFields(source)
  return [fields.strategist, fields.editor, fields.type, fields.formatType, fields.funnel, fields.awareness, fields.persona, fields.angle]
    .filter(Boolean)
}

export function buildCsName(source = {}, { copy = false } = {}) {
  const core = csNameParts(source).join('_')
  if (!core) return copy ? COPY_SUFFIX.trim() : ''
  return copy ? `${core}${COPY_SUFFIX}` : core
}

// Legacy helper kept for older tests/callers — CS names are field-driven.
export function briefName(source) {
  if (source?.abbr && source?.briefNumber && !source?.strategist && !source?.type) {
    return `${source.abbr} Batch #${source.briefNumber}`
  }
  return buildCsName(source)
}

export function formatTypeOptionsFor(config, format, extra = []) {
  const byFormat = config?.formatTypesByFormat || DEFAULT_FORMAT_TYPES
  const listed = format ? (byFormat[format] || []) : []
  return uniqueStrings([...listed, ...extra])
}

export function isFormatTypeValid(config, format, formatType) {
  if (!formatType) return !formatType
  return formatTypeOptionsFor(config, format).some((option) => option.toLowerCase() === String(formatType).toLowerCase())
}

export function withCsName(brief, { copy } = {}) {
  const fields = namingFields(brief)
  const isCopy = copy ?? Boolean(brief?.nameIsCopy)
  return {
    ...brief,
    ...fields,
    awarenessStage: fields.awareness || brief?.awarenessStage || '',
    name: buildCsName(fields, { copy: isCopy }),
    nameIsCopy: isCopy,
  }
}

export function applyNamingPatch(brief, patch, { by, config } = {}) {
  const now = Date.now()
  const prevEditor = briefEditor(brief)
  const prevFields = namingFields(brief)
  let next = { ...brief, ...patch, updatedAt: now }
  if (patch.type && patch.type !== brief.type && patch.formatType === undefined) {
    next.formatType = ''
  }
  if (config && next.formatType && !isFormatTypeValid(config, next.type, next.formatType)) {
    next.formatType = ''
  }
  const nextFields = namingFields(next)
  const namingChanged = JSON.stringify(prevFields) !== JSON.stringify(nextFields)
  const isCopy = namingChanged ? false : Boolean(brief.nameIsCopy)
  next = withCsName({ ...next, nameIsCopy: isCopy }, { copy: isCopy })
  const history = [...(brief.history || [])]
  if (next.editor && next.editor !== prevEditor) {
    history.push({
      kind: 'editor',
      from: prevEditor,
      to: next.editor,
      by: by || 'System',
      at: now,
      note: `Editor: ${prevEditor} → ${next.editor}`,
    })
    if (next.editor !== UNASSIGNED_EDITOR) next.assignedTo = next.editor
  }
  next.history = history
  return next
}

export function duplicateBrief(brief, { by, briefs = [] } = {}) {
  const now = Date.now()
  const copy = withCsName({
    ...brief,
    id: uuid(),
    briefNumber: nextBriefNumber(briefs),
    createdAt: now,
    updatedAt: now,
    launchedAt: null,
    status: 'scripting',
    result: '',
    postId: '',
    learnings: brief.learnings || '',
    nameIsCopy: true,
    history: [{ status: 'scripting', by: by || 'System', at: now, note: `Duplicated from ${brief.name || 'brief'}` }],
  }, { copy: true })
  return copy
}

export function batchNamingPreview(briefs, patch, { config } = {}) {
  return briefs.map((brief) => {
    const next = applyNamingPatch(brief, patch, { config })
    return { id: brief.id, oldName: brief.name || buildCsName(brief), newName: next.name, next }
  })
}

export function strategistNames(config, briefs = []) {
  const roles = new Set(['strategist', 'creative_strategist', 'operator', 'cfo'])
  return uniqueStrings([
    ...(config.users || []).filter((u) => roles.has(u.role)).map((u) => u.name),
    ...(config.extraStrategists || []),
    ...briefs.map((b) => b.strategist),
  ])
}

export function editorNames(config, briefs = []) {
  return uniqueStrings([
    UNASSIGNED_EDITOR,
    ...(config.users || []).filter((u) => u.role === 'video_editor').map((u) => u.name),
    ...(config.extraEditors || []),
    ...briefs.map((b) => b.editor || b.assignedTo),
  ])
}

export function angleOptions(config, briefs = []) {
  return uniqueStrings([
    ...(config.extraAngles || []),
    ...briefs.map((b) => b.angle),
  ])
}

export function csNameSearchHaystack(brief) {
  const fields = namingFields(brief)
  return [buildCsName(fields), brief.name, ...Object.values(fields)].filter(Boolean).join(' ').toLowerCase()
}

export function matchesCsNameQuery(brief, query) {
  const q = String(query || '').trim().toLowerCase()
  if (!q) return true
  return csNameSearchHaystack(brief).includes(q)
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
  return uniqueStrings([...(config.formatTypes || []), ...extra])
}

export function importMissingBriefs(existingBriefs) {
  const existingNumbers = new Set(
    existingBriefs.map((b) => b.briefNumber).filter(Boolean)
  )
  const toAdd = []
  for (const seed of seedBriefs) {
    if (existingNumbers.has(seed.batchNumber)) continue
    const now = Date.now()
    toAdd.push(withCsName({
      id: uuid(),
      strategist: seed.strategist,
      editor: UNASSIGNED_EDITOR,
      date: seed.date,
      persona: seed.persona || '',
      funnel: isFunnelValue(seed.awarenessStage) ? seed.awarenessStage : (seed.funnel || ''),
      awareness: seed.awareness || (isFunnelValue(seed.awarenessStage) ? '' : (seed.awarenessStage || '')),
      awarenessStage: isFunnelValue(seed.awarenessStage) ? '' : (seed.awarenessStage || ''),
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
      assignedTo: seed.assignedTo || null,
      status: seed.status,
      briefNumber: seed.batchNumber,
      createdAt: now,
      updatedAt: now,
      launchedAt: seed.status === 'launched' ? now : null,
      history: [{ status: seed.status, by: 'Import', at: now, note: 'Imported from Creative Tracker' }],
    }))
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
  const history = [...(brief.history || []), entry]
  const prevEditor = briefEditor(brief)
  let next = {
    ...brief,
    status: transition.to,
    assignedTo: transition.needsAssignment ? assignTo : brief.assignedTo,
    launchedAt: transition.to === 'launched' ? now : brief.launchedAt,
    result: transition.to === 'launched' ? 'Testing' : brief.result,
    updatedAt: now,
  }
  if (transition.needsAssignment && assignTo && assignTo !== prevEditor) {
    next.editor = assignTo
    next.assignedTo = assignTo
    next.nameIsCopy = false
    history.push({
      kind: 'editor',
      from: prevEditor,
      to: assignTo,
      by,
      at: now,
      note: `Editor: ${prevEditor} → ${assignTo}`,
    })
  }
  next.history = history
  return withCsName(next)
}
