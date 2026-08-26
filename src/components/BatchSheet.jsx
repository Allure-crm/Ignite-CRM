import { useState } from 'react'
import CsName from './CsName'

const RESULT_COLORS = {
  Winner: '#22c55e',
  Loser: '#ef4444',
  'Needs Iteration': '#f59e0b',
  Testing: '#3b82f6',
  'KPI Winner': '#8b5cf6',
}

export const BATCH_SHEET_COLUMNS = 20

const SORTABLE = [
  { key: 'briefNumber', label: '#' },
  { key: 'date', label: 'Date' },
  { key: 'name', label: 'CS Name' },
  { key: 'editor', label: 'Editor' },
  { key: 'type', label: 'Format' },
  { key: 'formatType', label: 'Format Type' },
  { key: 'funnel', label: 'Funnel' },
  { key: 'awareness', label: 'Awareness' },
  { key: 'persona', label: 'Persona' },
]

export default function BatchSheet({
  config,
  rows,
  onOpen,
  groups,
  emptyText,
  selected,
  onToggle,
  onToggleAll,
  sortKey,
  sortDir,
  onSort,
}) {
  const statusLabel = (key) => config.statuses[key]?.label || key
  const statusColor = (key) => config.statuses[key]?.color || '#666'
  const selectable = Boolean(selected && onToggle)
  const hasGroups = Array.isArray(groups) && groups.length > 0
  const colCount = BATCH_SHEET_COLUMNS + (selectable ? 1 : 0)

  const linkCell = (url, label) => {
    if (!url) return <span className="tracker-empty">—</span>
    return (
      <a href={url} target="_blank" rel="noreferrer" className="tracker-link" onClick={(e) => e.stopPropagation()}>
        {label || 'Open'}
      </a>
    )
  }

  const sortMark = (key) => {
    if (sortKey !== key) return ''
    return sortDir === 'desc' ? ' ↓' : ' ↑'
  }

  const Th = ({ col }) => (
    <th
      className={`tracker-th ${onSort && SORTABLE.some((s) => s.key === col.key) ? 'sortable' : ''}`}
      onClick={() => onSort && SORTABLE.some((s) => s.key === col.key) && onSort(col.key)}
    >
      {col.label}{sortMark(col.key)}
    </th>
  )

  const visibleIds = (hasGroups ? groups.flatMap((g) => g.rows || []) : rows || []).map((b) => b.id)
  const allSelected = selectable && visibleIds.length > 0 && visibleIds.every((id) => selected.has(id))

  const renderRow = (b, i) => (
    <tr key={b.id} className={`tracker-row ${selectable && selected.has(b.id) ? 'selected' : ''}`} onClick={() => onOpen(b)}>
      {selectable && (
        <td className="tracker-td tracker-check" onClick={(e) => e.stopPropagation()}>
          <input type="checkbox" checked={selected.has(b.id)} onChange={() => onToggle(b.id)} />
        </td>
      )}
      <td className="tracker-td tracker-num">{b.briefNumber || i + 1}</td>
      <td className="tracker-td">{b.date || '—'}</td>
      <td className="tracker-td tracker-name" onClick={(e) => e.stopPropagation()}>
        <CsName value={b.name} compact />
      </td>
      <td className="tracker-td">{b.editor || b.assignedTo || 'Unassigned'}</td>
      <td className="tracker-td">{b.type || '—'}</td>
      <td className="tracker-td">{b.formatType || '—'}</td>
      <td className="tracker-td">{b.funnel || '—'}</td>
      <td className="tracker-td">{b.awareness || '—'}</td>
      <td className="tracker-td">{b.persona || '—'}</td>
      <td className="tracker-td">{b.facebookPage || '—'}</td>
      <td className="tracker-td">{b.landingPage || '—'}</td>
      <td className="tracker-td">{b.adConcept || '—'}</td>
      <td className="tracker-td">{b.angle || '—'}</td>
      <td className="tracker-td">{linkCell(b.scriptLink, '📄 Brief')}</td>
      <td className="tracker-td">{linkCell(b.finalVideoLink, '🎬 Video')}</td>
      <td className="tracker-td">{b.postId || '—'}</td>
      <td className="tracker-td">
        <span className="tracker-status" style={{ background: statusColor(b.status) + '22', color: statusColor(b.status), borderColor: statusColor(b.status) + '44' }}>
          {statusLabel(b.status)}
        </span>
      </td>
      <td className="tracker-td">
        {b.result ? (
          <span className="tracker-status" style={{ background: (RESULT_COLORS[b.result] || '#666') + '22', color: RESULT_COLORS[b.result] || '#666', borderColor: (RESULT_COLORS[b.result] || '#666') + '44' }}>
            {b.result}
          </span>
        ) : <span className="tracker-empty">—</span>}
      </td>
      <td className="tracker-td">{b.learnings || '—'}</td>
      <td className="tracker-td">{b.assignedTo || '—'}</td>
    </tr>
  )

  const empty = hasGroups ? groups.every((g) => !g.rows?.length) : !rows?.length

  return (
    <div className="tracker-wrap">
      <table className="tracker-table">
        <thead>
          <tr>
            {selectable && (
              <th className="tracker-th tracker-check">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={() => onToggleAll && onToggleAll(visibleIds, !allSelected)}
                  aria-label="Select all visible briefs"
                />
              </th>
            )}
            <Th col={{ key: 'briefNumber', label: '#' }} />
            <Th col={{ key: 'date', label: 'Date' }} />
            <Th col={{ key: 'name', label: config.fieldLabels.csName || 'CS Name' }} />
            <Th col={{ key: 'editor', label: 'Editor' }} />
            <Th col={{ key: 'type', label: 'Format' }} />
            <Th col={{ key: 'formatType', label: 'Format Type' }} />
            <Th col={{ key: 'funnel', label: 'Funnel' }} />
            <Th col={{ key: 'awareness', label: 'Awareness' }} />
            <Th col={{ key: 'persona', label: 'Persona' }} />
            <th className="tracker-th">{config.fieldLabels.page}</th>
            <th className="tracker-th">{config.fieldLabels.landingPage}</th>
            <th className="tracker-th">Ad Concept</th>
            <th className="tracker-th">Angle</th>
            <th className="tracker-th">Brief Link</th>
            <th className="tracker-th">Video Link</th>
            <th className="tracker-th">Post ID</th>
            <th className="tracker-th">Status</th>
            <th className="tracker-th">Result</th>
            <th className="tracker-th">Learnings</th>
            <th className="tracker-th">Assigned To</th>
          </tr>
        </thead>
        <tbody>
          {empty && (
            <tr>
              <td colSpan={colCount} className="tracker-empty-row">
                {emptyText || 'No batches in this period.'}
              </td>
            </tr>
          )}
          {!empty && hasGroups && groups.map((g) => (
            <SheetGroup key={g.key} group={g} renderRow={renderRow} colCount={colCount} />
          ))}
          {!empty && !hasGroups && rows.map((b, i) => renderRow(b, i))}
        </tbody>
      </table>
    </div>
  )
}

function SheetGroup({ group, renderRow, colCount }) {
  const [open, setOpen] = useState(true)
  return (
    <>
      <tr className="tracker-week-row" onClick={() => setOpen((o) => !o)}>
        <td className="tracker-week-cell" colSpan={colCount}>
          <span className="tracker-week-caret">{open ? '▾' : '▸'}</span>
          <span className="tracker-week-title">{group.title}</span>
          {group.subtitle && <span className="tracker-week-range">{group.subtitle}</span>}
          <span className="tracker-week-count">
            {group.rows.length} {group.rows.length === 1 ? 'batch' : 'batches'}
          </span>
        </td>
      </tr>
      {open && group.rows.map((b, i) => renderRow(b, i))}
    </>
  )
}
