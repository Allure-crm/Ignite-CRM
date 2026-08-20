// Workflow smoke test — run with: node smoke.test.mjs
// Validates the brand.config workflow definition after you customize it.
import { briefName, nextBriefNumber, applyTransition, mergedConfig } from './src/lib/helpers.js'
import config from './src/brand.config.js'

const n = briefName({ abbr: 'TY', date: '2026-06-01', briefNumber: 2, persona: 'Persona A', awarenessStage: 'TOF', type: 'Static', landingPage: 'PDP' })
console.assert(n === 'TY Batch #2', 'name gen FAILED: ' + n)

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

console.log('ALL SMOKE TESTS PASSED — path:', ['scripting', ...path].join(' > '))
