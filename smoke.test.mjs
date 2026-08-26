// Workflow smoke test — run with: node smoke.test.mjs
// Validates the brand.config workflow definition after you customize it.
const origAssert = console.assert.bind(console)
console.assert = (cond, msg) => {
  origAssert(cond, msg)
  if (!cond) throw new Error(msg || 'assertion failed')
}
import { briefName, nextBriefNumber, applyTransition, mergedConfig, formatTypeOptions, formatTypeOptionsFor, importMissingBriefs, allowedTransitions, canCreateBriefs, canDeleteBriefs, buildCsName, applyNamingPatch, duplicateBrief, withCsName, matchesCsNameQuery, UNASSIGNED_EDITOR } from './src/lib/helpers.js'
import { resolveSupabaseCreds, postgresUrl } from './src/lib/supabaseEnv.js'
import { briefsToCsv } from './src/lib/exportSheet.js'
import config from './src/brand.config.js'

const n = briefName({ strategist: 'TY', editor: 'Unassigned', type: 'Static', funnel: 'TOF', persona: 'Persona A' })
console.assert(n === 'TY_Unassigned_Static_TOF_Persona A', 'name gen FAILED: ' + n)

console.assert(nextBriefNumber([{ briefNumber: 5 }, { briefNumber: 2 }]) === 6, 'numbering FAILED')

// happy path through the state machine
let b = { id: '1', status: 'scripting', history: [], assignedTo: null, launchedAt: null }
const path = []
let guard = 0
while (b.status !== 'launched' && guard++ < 30) {
  const t = config.transitions[b.status][0]
  b = applyTransition(b, t, { by: 'Test', assignTo: 'Editor' })
  path.push(b.status)
}
console.assert(b.status === 'launched' && b.launchedAt, 'happy path FAILED: ' + path.join('>'))

// script review: revision loop then assign editor
let sr = applyTransition({ id: '2a', status: 'scripting', history: [] }, config.transitions.scripting[0], { by: 'T' })
console.assert(sr.status === 'script_review', 'script submit FAILED')
let rev = applyTransition(sr, config.transitions.script_review[1], { by: 'Vishal', note: 'tighten hook' })
console.assert(rev.status === 'script_revision' && rev.history[rev.history.length - 1].note === 'tighten hook', 'script revision note FAILED')
let resub = applyTransition(rev, config.transitions.script_revision[0], { by: 'T' })
console.assert(resub.status === 'script_review', 'script resubmit FAILED')
let approved = applyTransition(resub, config.transitions.script_review[0], { by: 'Vishal' })
console.assert(approved.status === 'assign_editor', 'script approve FAILED')
let assigned = applyTransition(approved, config.transitions.assign_editor[0], { by: 'T', assignTo: 'Zain' })
console.assert(assigned.status === 'needs_editing' && assigned.assignedTo === 'Zain', 'assign editor FAILED')

// UGC branch + revision loop
let u = applyTransition({ id: '2', status: 'scripting', history: [] }, config.transitions.scripting[1], { by: 'T' })
console.assert(u.status === 'ugc_content_needed', 'ugc branch FAILED')
let r = applyTransition({ id: '3', status: 'needs_review', history: [] }, config.transitions.needs_review[1], { by: 'T', note: 'fix hook' })
console.assert(r.status === 'needs_revision' && r.history[0].note === 'fix hook', 'revision note FAILED')

// config integrity: every transition target + queue lane must be a real status
for (const [from, ts] of Object.entries(config.transitions))
  for (const t of ts) console.assert(config.statuses[t.to], 'bad target ' + from + '->' + t.to)
for (const [role, def] of Object.entries(config.roles))
  for (const s of def.queue) console.assert(config.statuses[s], 'bad queue status ' + role + ':' + s)

const m = mergedConfig({ brandName: 'ACME', personas: ['P1'] })
console.assert(m.brandName === 'ACME' && m.personas[0] === 'P1' && m.statuses.scripting, 'merge FAILED')

const mapped = resolveSupabaseCreds({
  NEXT_PUBLIC_SUPABASE_URL: 'https://example.supabase.co',
  NEXT_PUBLIC_SUPABASE_ANON_KEY: 'sb_publishable_test',
})
console.assert(mapped.url === 'https://example.supabase.co' && mapped.anonKey === 'sb_publishable_test', 'marketplace env mapping FAILED')
console.assert(resolveSupabaseCreds({}).url === '' && !resolveSupabaseCreds({}).anonKey, 'empty creds FAILED')
console.assert(postgresUrl({ POSTGRES_URL: 'postgres://x' }) === 'postgres://x', 'postgres url FAILED')
console.assert(!config.supabase.url && !config.supabase.anonKey, 'brand config should not ship supabase keys')

const formatOpts = formatTypeOptions({ formatTypes: ['AI Animated', 'Broll + VO'] }, ['Female holding bottle', 'AI Animated', ''])
console.assert(formatOpts.includes('AI Animated') && formatOpts.includes('Broll + VO') && formatOpts.includes('Female holding bottle'), 'formatTypeOptions FAILED')
console.assert(formatOpts.filter((v) => v.toLowerCase() === 'ai animated').length === 1, 'formatTypeOptions dedupe FAILED')

const existingSheet = [
  { briefNumber: 1, name: 'Keep Me', formatType: 'Native story', adConcept: 'existing concept', persona: 'Persona X', status: 'launched' },
  { briefNumber: 2, name: 'Also Keep', formatType: 'Female holding bottle', learnings: 'do not wipe', status: 'scripting' },
]
const csv = briefsToCsv(existingSheet, config)
console.assert(csv.includes('Format Type'), 'csv header format type FAILED')
console.assert(csv.includes('Native story') && csv.includes('Female holding bottle'), 'csv lost formatType FAILED')
console.assert(csv.includes('existing concept') && csv.includes('do not wipe'), 'csv lost sheet data FAILED')
console.assert(csv.includes('Keep Me') && csv.includes('Also Keep'), 'csv lost brief names FAILED')

const skipped = importMissingBriefs(existingSheet)
console.assert(skipped.every((row) => row.briefNumber !== 1 && row.briefNumber !== 2), 'import must not replace existing sheet rows')

const mergedTypes = mergedConfig({ formatTypes: ['Custom Type'] })
console.assert(mergedTypes.formatTypes[0] === 'Custom Type' && mergedTypes.types.length, 'formatTypes merge FAILED')
const mergedKeep = mergedConfig({})
console.assert(mergedKeep.formatTypes.includes('UGC') && mergedKeep.formatTypesByFormat.Video.includes('Celebrity NIL'), 'default formatTypes FAILED')
console.assert(mergedKeep.personas.includes('Second-Act Single') && mergedKeep.funnels.includes('TOF'), 'naming lists FAILED')
console.assert(mergedKeep.awarenessStages.includes('Problem Aware'), 'awareness list FAILED')

console.assert(!canCreateBriefs('video_editor') && canCreateBriefs('creative_strategist'), 'create briefs permission FAILED')
console.assert(!canDeleteBriefs('video_editor') && canDeleteBriefs('operator'), 'delete briefs permission FAILED')
const editorOnReview = allowedTransitions(config, 'needs_review', 'video_editor')
console.assert(editorOnReview.length === 0, 'editor must not approve needs_review')
const editorOnScriptReview = allowedTransitions(config, 'script_review', 'video_editor')
console.assert(editorOnScriptReview.length === 0, 'editor must not approve script_review')
const editorSubmit = allowedTransitions(config, 'needs_editing', 'video_editor')
console.assert(editorSubmit.length === 1 && editorSubmit[0].to === 'needs_review', 'editor submit FAILED')
const editorResubmit = allowedTransitions(config, 'needs_revision', 'video_editor')
console.assert(editorResubmit.length === 1 && editorResubmit[0].to === 'needs_review', 'editor resubmit FAILED')
const stratApprove = allowedTransitions(config, 'needs_review', 'creative_strategist')
console.assert(stratApprove.some((t) => t.label === 'Approve'), 'strategist approve FAILED')

const fullName = buildCsName({
  strategist: 'Tysin',
  editor: 'Marcus',
  type: 'Video',
  formatType: 'Celebrity NIL',
  funnel: 'TOF',
  awareness: 'Problem Aware',
  persona: 'Second-Act Single',
  angle: 'Celebrity Endorsement',
})
console.assert(fullName === 'Tysin_Marcus_Video_Celebrity NIL_TOF_Problem Aware_Second-Act Single_Celebrity Endorsement', 'cs name FAILED: ' + fullName)

const partialName = buildCsName({ strategist: 'Tysin', editor: UNASSIGNED_EDITOR, type: 'Video' })
console.assert(partialName === 'Tysin_Unassigned_Video', 'partial cs name FAILED: ' + partialName)
console.assert(!partialName.includes('__'), 'double underscore FAILED')

const videoTypes = formatTypeOptionsFor(config, 'Video')
console.assert(videoTypes.includes('UGC') && videoTypes.includes('Celebrity NIL') && !videoTypes.includes('Product Shot'), 'video format types FAILED')
const staticTypes = formatTypeOptionsFor(config, 'Static')
console.assert(staticTypes.includes('Product Shot') && !staticTypes.includes('UGC'), 'static format types FAILED')

const patched = applyNamingPatch(
  { name: 'Mia_Unassigned_Video_UGC', strategist: 'Mia', editor: UNASSIGNED_EDITOR, type: 'Video', formatType: 'UGC', funnel: 'TOF', history: [] },
  { type: 'Static' },
  { config, by: 'Mia' }
)
console.assert(patched.formatType === '' && patched.type === 'Static', 'format type reset FAILED')

const reassigned = applyNamingPatch(patched, { editor: 'Zain' }, { by: 'Mia' })
console.assert(reassigned.editor === 'Zain' && reassigned.name.includes('Zain'), 'editor rename FAILED: ' + reassigned.name)
console.assert(reassigned.history.some((h) => h.kind === 'editor' && h.from === UNASSIGNED_EDITOR && h.to === 'Zain'), 'editor audit FAILED')

const assignedName = applyTransition(
  { id: 'ed', status: 'assign_editor', history: [], editor: UNASSIGNED_EDITOR, strategist: 'Mia', type: 'Video' },
  config.transitions.assign_editor[0],
  { by: 'T', assignTo: 'Zain' }
)
console.assert(assignedName.editor === 'Zain' && assignedName.name.includes('Zain'), 'assign editor naming FAILED: ' + assignedName.name)

const copied = duplicateBrief({ id: 'x', name: fullName, strategist: 'Tysin', editor: 'Marcus', type: 'Video', formatType: 'Celebrity NIL', funnel: 'TOF', awareness: 'Problem Aware', persona: 'Second-Act Single', angle: 'Celebrity Endorsement', status: 'launched', briefNumber: 9, history: [] }, { by: 'Mia', briefs: [{ briefNumber: 9 }] })
console.assert(copied.name.endsWith(' - Copy') && copied.nameIsCopy && copied.strategist === 'Tysin', 'duplicate copy FAILED: ' + copied.name)
const afterEdit = applyNamingPatch(copied, { angle: 'New Angle' }, { by: 'Mia' })
console.assert(!afterEdit.nameIsCopy && !afterEdit.name.endsWith(' - Copy'), 'copy suffix persist FAILED: ' + afterEdit.name)

const legacy = withCsName({ strategist: 'Mia', awarenessStage: 'TOF', type: 'Video', formatType: 'UGC' })
console.assert(legacy.funnel === 'TOF' && legacy.awareness === '' && legacy.name.includes('TOF'), 'legacy funnel migrate FAILED: ' + legacy.name)

console.assert(matchesCsNameQuery(legacy, 'TOF') && matchesCsNameQuery(legacy, 'video') && !matchesCsNameQuery(legacy, 'BOF'), 'cs search FAILED')

console.assert(csv.includes('CS Name'), 'csv header cs name FAILED')

console.log('ALL SMOKE TESTS PASSED — path:', ['scripting', ...path].join(' > '))
