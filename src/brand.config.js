// ============================================================
// BRAND CONFIG — the only file you need to edit per brand.
// Duplicate this repo, change the values below, deploy.
// Everything here can also be overridden at runtime from the
// in-app Settings / Manage Lists screens (overrides are stored
// in the data store and merged on top of these defaults).
// ============================================================

export default {
  // ---- Identity ----------------------------------------------------
  brandName: 'Enhanced Him',     // logo text, top-left
  brandTagline: 'Creative Tracker', // small text next to the logo
  accentColor: '#C9A54E',        // primary accent — gold from enhancedhim.com
  accentColor2: '#DEB962',       // lighter gold for gradients

  // Unique key per brand — keeps localStorage data separate when you
  // run multiple brand deployments. Use a slug, e.g. 'acme'.
  storageKey: 'enhancedhim',

  // Shared access gate — entered once per browser/device, then remembered locally.
  accessPassword: 'Pancakes24+',

  // ---- Team ---------------------------------------------------------
  users: [
    { name: 'Micah',   role: 'operator',            abbr: 'MI' },
    { name: 'Vishal',  role: 'cfo',                 abbr: 'VI' },
    { name: 'Mia',     role: 'creative_strategist', abbr: 'MA' },
    { name: 'Zain',    role: 'video_editor',        abbr: 'ZA' },
    { name: 'Vlad',    role: 'media_buyer',         abbr: 'VL' },
    { name: 'Damian',  role: 'media_buyer',         abbr: 'DA' },
  ],

  // Role definitions: label + which status lanes appear in "My Queue"
  roles: {
    operator:            { label: 'Operator',            queue: [] }, // Overview only — operator is not working briefs in a personal queue
    cfo:                 { label: 'Chief Fun Officer',   queue: ['script_review', 'scripting', 'script_revision', 'assign_editor', 'needs_editing', 'needs_review', 'needs_revision', 'ugc_content_needed', 'ugc_content_review', 'ugc_content_approved', 'ugc_content_revision', 'ready_to_launch'] },
    creative_strategist: { label: 'Creative Strategist', queue: ['scripting', 'assign_editor', 'needs_review', 'ugc_content_review', 'ugc_content_revision'] },
    video_editor:        { label: 'Video Editor',        queue: ['needs_editing', 'needs_revision'] },
    media_buyer:         { label: 'Media Buyer',         queue: ['ready_to_launch'] },
  },

  // Ad Name convention: fields joined with `_`, then the unique batch number
  // e.g. "Mia_Unassigned_Video_UGC_TOF_Unaware_General_Angle_1"

  // ---- Brief fields (option lists; editable in Manage Lists) --------
  fieldLabels: {
    persona: 'Persona',
    awarenessStage: 'Awareness',
    funnel: 'Funnel',
    type: 'Format',
    editor: 'Editor',
    csName: 'CS Name',
    adName: 'Ad Name',
    page: 'Facebook Page',
    landingPage: 'Landing Page',
    adConcept: 'Ad Concept',
    angle: 'Angle',
    formatType: 'Format Type',
    postId: 'Post ID',
    learnings: 'Learnings',
    scriptLink: 'Script / Brief Link',
    finalVideoLink: 'Final Asset Link',
    ugcAssetsLink: 'UGC Assets Link',
  },

  personas: ['Second-Act Single', 'Screen-Fed Man', 'Long-Haul Single', 'General'],
  funnels: ['TOF', 'MOF', 'BOF'],
  awarenessStages: ['Unaware', 'Problem Aware', 'Solution Aware', 'Product Aware', 'Most Aware'],
  types: ['Video', 'Static', 'Native'],
  formatTypesByFormat: {
    Video: ['UGC', 'VSL', 'Celebrity NIL', 'Animated', 'Podcast Clip', 'Talking Head'],
    Static: ['Product Shot', 'Lifestyle', 'Testimonial Card', 'Comparison'],
    Native: ['Advertorial', 'Listicle', 'Confessional'],
  },
  extraStrategists: [],
  extraEditors: [],
  extraAngles: [],
  formatTypes: [
    'UGC',
    'VSL',
    'Celebrity NIL',
    'Animated',
    'Podcast Clip',
    'Talking Head',
    'Product Shot',
    'Lifestyle',
    'Testimonial Card',
    'Comparison',
    'Advertorial',
    'Listicle',
    'Confessional',
  ],
  pages: ['Main Page', 'Review Page', 'Founder Page'],
  landingPages: ['PDP', 'Advertorial', 'Quiz', 'Listicle'],
  results: ['Testing', 'Winner', 'KPI Winner', 'Needs Iteration', 'Loser'],

  // ---- Workflow ------------------------------------------------------
  // Statuses with display labels + lane colors. Keys are stable IDs —
  // rename labels freely; only change keys if you also update
  // transitions + role queues.
  statuses: {
    scripting:            { label: 'Scripting',            color: '#94a3b8' },
    script_review:        { label: 'Script Review',        color: '#a78bfa' },
    script_revision:      { label: 'Script Revision',      color: '#f43f5e' },
    assign_editor:        { label: 'Assigned to Editor',   color: '#fb923c' },
    needs_editing:        { label: 'Needs Editing',        color: '#f59e0b' },
    needs_review:         { label: 'Needs Review',         color: '#ec4899' },
    needs_revision:       { label: 'Needs Revision',       color: '#ef4444' },
    ugc_content_needed:   { label: 'UGC Content Needed',   color: '#06b6d4' },
    ugc_content_review:   { label: 'UGC Content Review',   color: '#8b5cf6' },
    ugc_content_approved: { label: 'UGC Content Approved', color: '#10b981' },
    ugc_content_revision: { label: 'UGC Content Revision', color: '#f97316' },
    ready_to_launch:      { label: 'Ready to Launch',      color: '#22c55e' },
    launched:             { label: 'Launched',             color: '#3b82f6' },
  },

  // Allowed moves out of each status.
  //  needsAssignment + assignRoles: prompts to pick an assignee
  //  needsNote: prompts for a revision note (saved to history)
  transitions: {
    scripting: [
      { to: 'script_review', label: 'Submit for Review' },
      { to: 'ugc_content_needed', label: 'Request UGC Content' },
    ],
    script_review: [
      { to: 'assign_editor', label: 'Approve' },
      { to: 'script_revision', label: 'Request Revision', needsNote: true, noteLabel: 'Comments', notePlaceholder: 'What needs to change in the script…', confirmLabel: 'Submit' },
    ],
    script_revision: [{ to: 'script_review', label: 'Resubmit for Review' }],
    assign_editor: [
      { to: 'needs_editing', label: 'Assign to Editor', needsAssignment: true, assignRoles: ['video_editor'] },
    ],
    needs_editing: [{ to: 'needs_review', label: 'Submit for Review' }],
    needs_review: [
      { to: 'ready_to_launch', label: 'Approve' },
      { to: 'needs_revision', label: 'Request Revision', needsNote: true },
    ],
    needs_revision: [{ to: 'needs_review', label: 'Resubmit for Review' }],
    ugc_content_needed: [{ to: 'ugc_content_review', label: 'Submit for Review' }],
    ugc_content_review: [
      { to: 'ugc_content_approved', label: 'Approve UGC' },
      { to: 'ugc_content_revision', label: 'Request Revision', needsNote: true },
    ],
    ugc_content_approved: [
      { to: 'needs_editing', label: 'Send to Editor', needsAssignment: true, assignRoles: ['video_editor'] },
    ],
    ugc_content_revision: [{ to: 'ugc_content_review', label: 'Resubmit for Review' }],
    ready_to_launch: [{ to: 'launched', label: 'Mark as Launched' }],
    launched: [],
  },

  // ---- Optional: Supabase team sync -----------------------------------
  // Prefer env vars (VITE_SUPABASE_* or Vercel Marketplace NEXT_PUBLIC_SUPABASE_* /
  // SUPABASE_*). These fields are a fallback only. Leave them empty so keys
  // are not committed to git. Empty + no env vars = localStorage (per-browser data).
  supabase: {
    url: '',
    anonKey: '',
  },
}
