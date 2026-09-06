import { briefAwareness, displayName, monthLabel } from './helpers.js'

function csvEscape(value) {
  const s = String(value ?? '')
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`
  return s
}

export function trackerSheetFilename({ month, filters }) {
  if (filters.dateFrom && filters.dateFrom === filters.dateTo) {
    return `creative-tracker-${filters.dateFrom}.csv`
  }
  if (filters.dateFrom || filters.dateTo) {
    return `creative-tracker-${filters.dateFrom || 'start'}_to_${filters.dateTo || 'end'}.csv`
  }
  if (!month || month === 'all') return 'creative-tracker-all.csv'
  return `creative-tracker-${monthLabel(month).replace(/\s+/g, '-')}.csv`
}

export function briefsToCsv(briefs, config) {
  const headers = [
    '#',
    'Date',
    config.fieldLabels.launchedDate || 'Date Launched',
    config.fieldLabels.csName || 'CS Name',
    config.fieldLabels.adName || 'Ad Name',
    'Format',
    'Format Type',
    config.fieldLabels.adType || 'Ad Type',
    'Funnel',
    'Awareness',
    'Persona',
    config.fieldLabels.page,
    config.fieldLabels.landingPage,
    'Ad Concept',
    'Angle',
    'Brief Link',
    'Video Link',
    'Post ID',
    'Status',
    'Result',
    'Learnings',
    'Editor',
  ]
  const rows = briefs.map((b, i) => [
    b.briefNumber || i + 1,
    b.date || '',
    b.launchedDate || '',
    b.strategist || '',
    displayName(b),
    b.type || '',
    b.formatType || '',
    b.adType || '',
    b.funnel || '',
    briefAwareness(b) || b.awarenessStage || '',
    b.persona || '',
    b.facebookPage || '',
    b.landingPage || '',
    b.adConcept || '',
    b.angle || '',
    b.scriptLink || '',
    b.finalVideoLink || '',
    b.postId || '',
    config.statuses[b.status]?.label || b.status || '',
    b.result || '',
    b.learnings || '',
    b.editor || b.assignedTo || 'Unassigned',
  ])
  return '\uFEFF' + [headers, ...rows].map((row) => row.map(csvEscape).join(',')).join('\n')
}

export function downloadCsv(filename, csv) {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
