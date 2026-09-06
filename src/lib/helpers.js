import baseConfig from '../brand.config.js'
import { seedBriefs } from './seedBriefs.js'

// Merge runtime overrides (from Settings / Manage Lists) onto brand.config defaults.
export const UNASSIGNED_EDITOR = 'Unassigned'
export const COPY_SUFFIX = ' - Copy'
export const FUNNEL_VALUES = ['TOF', 'MOF', 'BOF']
export const AD_TYPES = ['Net New', 'Iteration', 'Imitation']
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
    adTypes: overrides.adTypes || baseConfig.adTypes || AD_TYPES,
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

export const NAMING_SCHEME_MONTHLY = 'monthly_batch'

export function isMonthlyNaming(brief = {}) {
  return brief.namingScheme === NAMING_SCHEME_MONTHLY
}

export function monthAbbrev(d) {
  const key = monthKey(d)
  const m = Number(String(key).slice(5, 7))
  return MONTHS[m - 1] || ''
}

export function sameStrategist(a, b) {
  return String(a || '').trim().toLowerCase() === String(b || '').trim().toLowerCase()
}

export function nextMonthlyBatchNumber(briefs, strategist, date, { exceptId } = {}) {
  const ym = monthKey(date)
  if (!ym || !String(strategist || '').trim()) return 1
  let max = 0
  for (const brief of briefs || []) {
    if (exceptId && brief.id === exceptId) continue
    if (!isMonthlyNaming(brief)) continue
    if (!sameStrategist(brief.strategist, strategist)) continue
    if (monthKey(brief.date) !== ym) continue
    const n = Number(brief.briefNumber)
    if (Number.isFinite(n) && n > max) max = n
  }
  return max + 1
}

export function buildMonthlyBatchName(source = {}, { copy = false } = {}) {
  const strategist = sanitize(source.strategist) || String(source.strategist || '').trim()
  const editor = sanitize(source.editor) || String(source.editor || '').trim() || UNASSIGNED_EDITOR
  const mon = monthAbbrev(source.date)
  const number = csNameNumber(source)
  const parts = [strategist, editor, mon].filter(Boolean)
  if (number) parts.push(`Batch_${number}`)
  else if (strategist || editor || mon) parts.push('Batch')
  const core = parts.join('_')
  if (!core) return copy ? COPY_SUFFIX.trim() : ''
  return copy ? `${core}${COPY_SUFFIX}` : core
}

export function csNameNumber(source = {}) {
  const n = Number(source.briefNumber)
  return Number.isFinite(n) && n > 0 ? n : null
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
  const parts = [fields.strategist, fields.editor, fields.type, fields.formatType, fields.funnel, fields.awareness, fields.persona, fields.angle]
    .filter(Boolean)
  const number = csNameNumber(source)
  if (number) parts.push(String(number))
  return parts
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

export function displayCsName(brief, { copy, preferStored = true } = {}) {
  const fields = namingFields(brief)
  if (isMonthlyNaming(brief)) {
    return buildMonthlyBatchName({
      ...fields,
      date: brief.date,
      briefNumber: brief.briefNumber,
    }, { copy })
  }
  if (preferStored && brief?.name && !copy) return brief.name
  return buildCsName({ ...fields, briefNumber: brief.briefNumber }, { copy })
}

export function withCsName(brief, { copy } = {}) {
  const fields = namingFields(brief)
  const isCopy = copy ?? Boolean(brief?.nameIsCopy)
  const monthly = isMonthlyNaming(brief)
  return {
    ...brief,
    ...fields,
    awarenessStage: fields.awareness || brief?.awarenessStage || '',
    namingScheme: monthly ? NAMING_SCHEME_MONTHLY : brief.namingScheme,
    name: monthly
      ? buildMonthlyBatchName({ ...fields, date: brief.date, briefNumber: brief.briefNumber }, { copy: isCopy })
      : (brief.name || buildCsName({ ...fields, briefNumber: brief.briefNumber }, { copy: isCopy })),
    nameIsCopy: isCopy,
  }
}

export function applyNamingPatch(brief, patch, { by, config, briefs = [] } = {}) {
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
  if (isMonthlyNaming(brief) || isMonthlyNaming(next)) {
    next.namingScheme = NAMING_SCHEME_MONTHLY
    const dateChanged = String(brief.date || '') !== String(next.date || '')
    const csChanged = !sameStrategist(brief.strategist, next.strategist)
    if (dateChanged || csChanged) {
      next.briefNumber = nextMonthlyBatchNumber(briefs, next.strategist, next.date, { exceptId: brief.id })
    }
  }
  const nextFields = namingFields(next)
  const namingChanged = JSON.stringify(prevFields) !== JSON.stringify(nextFields)
    || String(brief.date || '') !== String(next.date || '')
    || Number(brief.briefNumber) !== Number(next.briefNumber)
  const isCopy = namingChanged ? false : Boolean(brief.nameIsCopy)
  if (!isMonthlyNaming(next) && namingChanged) {
    next = {
      ...next,
      name: buildCsName({ ...nextFields, briefNumber: next.briefNumber }, { copy: isCopy }),
      nameIsCopy: isCopy,
    }
  }
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

export function applyNamingPatches(targets, patch, { by, config, briefs = [] } = {}) {
  const working = [...briefs]
  return targets.map((brief) => {
    const next = applyNamingPatch(brief, patch, { by, config, briefs: working })
    const idx = working.findIndex((b) => b.id === brief.id)
    if (idx >= 0) working[idx] = next
    else working.push(next)
    return next
  })
}

export function duplicateBrief(brief, { by, briefs = [] } = {}) {
  const now = Date.now()
  const date = brief.date || todayKey()
  const copy = withCsName({
    ...brief,
    id: uuid(),
    namingScheme: NAMING_SCHEME_MONTHLY,
    briefNumber: nextMonthlyBatchNumber(briefs, brief.strategist, date),
    date,
    createdAt: now,
    updatedAt: now,
    launchedAt: null,
    launchedDate: '',
    status: 'scripting',
    result: '',
    postId: '',
    learnings: brief.learnings || '',
    nameIsCopy: true,
    name: '',
    history: [{ status: 'scripting', by: by || 'System', at: now, note: `Duplicated from ${brief.name || 'brief'}` }],
  }, { copy: true })
  return copy
}

export function batchNamingPreview(targets, patch, { config, briefs = [] } = {}) {
  const nexts = applyNamingPatches(targets, patch, { config, briefs })
  return nexts.map((next, i) => ({
    id: next.id,
    oldName: targets[i].name || displayCsName(targets[i]),
    newName: next.name,
    next,
  }))
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
  return [displayCsName(brief), buildMonthlyBatchName({ ...fields, date: brief.date, briefNumber: brief.briefNumber }), buildCsName({ ...fields, briefNumber: brief.briefNumber }), brief.name, ...Object.values(fields), brief.briefNumber]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
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

export function addMonths(month, n) {
  const [y, m] = String(month || '').split('-').map(Number)
  if (!y || !m) return ''
  const dt = new Date(y, m - 1 + n, 1)
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}`
}

export function monthBounds(month) {
  const [y, m] = String(month || '').split('-').map(Number)
  if (!y || !m) return { first: '', last: '' }
  const first = `${y}-${String(m).padStart(2, '0')}-01`
  const lastDay = new Date(y, m, 0).getDate()
  const last = `${y}-${String(m).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`
  return { first, last }
}

export function weekColumnLabel(weekNum, startKey, endKey) {
  const start = parseDay(startKey)
  const end = parseDay(endKey)
  if (!start || !end) return `W${weekNum}`
  const mon = MONTHS[start.getMonth()]
  const a = start.getDate()
  const b = end.getDate()
  if (a === b && monthKey(startKey) === monthKey(endKey)) return `W${weekNum} ${mon} ${a}`
  return `W${weekNum} ${mon} ${a}-${b}`
}

// Monday-start weeks that overlap `YYYY-MM`, clipped to the month for labels.
export function weeksOverlappingMonth(month) {
  const { first, last } = monthBounds(month)
  if (!first || !last) return []
  const weeks = []
  let start = weekStartKey(first)
  let n = 1
  while (start && start <= last) {
    const fullEnd = addDays(start, 6)
    const clipStart = start < first ? first : start
    const clipEnd = fullEnd > last ? last : fullEnd
    weeks.push({
      key: start,
      weekNum: n,
      start: clipStart,
      end: clipEnd,
      label: weekColumnLabel(n, clipStart, clipEnd),
    })
    n += 1
    start = addDays(start, 7)
  }
  return weeks
}

export function formatByWeekHighlightAt(maxWeekly) {
  if (!maxWeekly || maxWeekly <= 0) return Infinity
  return Math.max(4, Math.ceil(maxWeekly * 0.15))
}

// Count batches per format type across weeks in a month. Empty format types are "Unspecified".
export function formatByWeekMatrix(briefs, month) {
  const weeks = weeksOverlappingMonth(month)
  const monthBriefs = (briefs || []).filter((b) => monthKey(b.date) === month)
  const formatKey = (b) => String(b.formatType || '').trim() || 'Unspecified'
  const formats = uniqueStrings(monthBriefs.map(formatKey)).sort((a, b) =>
    a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' })
  )
  const rows = formats.map((format) => {
    const counts = weeks.map((w) =>
      monthBriefs.filter((b) => formatKey(b).toLowerCase() === format.toLowerCase() && weekStartKey(b.date) === w.key).length
    )
    const mtd = counts.reduce((sum, n) => sum + n, 0)
    return { format, counts, mtd }
  }).filter((row) => row.mtd > 0)
  const maxWeekly = rows.reduce((max, row) => Math.max(max, ...row.counts), 0)
  return {
    weeks,
    rows,
    total: monthBriefs.length,
    maxWeekly,
    highlightAt: formatByWeekHighlightAt(maxWeekly),
  }
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
      launchedDate: seed.status === 'launched' ? (seed.date || '') : '',
      history: [{ status: seed.status, by: 'Import', at: now, note: 'Imported from Creative Tracker' }],
    }))
  }
  return toAdd
}

export const OVERVIEW_VIEWS = ['summary', 'output', 'all', 'launched', 'tracker', 'intake']
export const TRACKER_ROLES = ['operator', 'creative_strategist', 'cfo']

export function roleQueue(config, role) {
  return config?.roles?.[role]?.queue || []
}

export function defaultViewFor(config, role) {
  const queue = roleQueue(config, role)
  if (queue.length) return queue[0]
  return TRACKER_ROLES.includes(role) ? 'summary' : 'all'
}

export function isViewAllowed(config, role, view) {
  if (!view) return false
  if (view === 'tracker' || view === 'intake') return TRACKER_ROLES.includes(role)
  if (OVERVIEW_VIEWS.includes(view)) return true
  return roleQueue(config, role).includes(view)
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
    launchedDate: transition.to === 'launched' ? (brief.launchedDate || todayKey()) : brief.launchedDate,
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
