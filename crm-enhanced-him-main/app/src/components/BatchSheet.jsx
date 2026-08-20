import { useState } from 'react'

const RESULT_COLORS = {
  Winner: '#22c55e',
  Loser: '#ef4444',
  'Needs Iteration': '#f59e0b',
  Testing: '#3b82f6',
  'KPI Winner': '#8b5cf6',
}

export const BATCH_SHEET_COLUMNS = 18

export default function BatchSheet({ config, rows, onOpen, groups, emptyText }) {
  const statusLabel = (key) => config.statuses[key]?.label || key
  const statusColor = (key) => config.statuses[key]?.color || '#666'

  const linkCell = (url, label) => {
    if (!url) return <span className="tracker-empty">—</span>
    return (
      <a href={url} target="_blank" rel="noreferrer" className="tracker-link" onClick={(e) => e.stopPropagation()}>
        {label || 'Open'}
      </a>
    )
  }

  const renderRow = (b, i) => (
    <tr key={b.id} className="tracker-row" onClick={() => onOpen(b)}>
      <td className="tracker-td tracker-num">{b.briefNumber || i + 1}</td>
      <td className="tracker-td">{b.date || '—'}</td>
      <td className="tracker-td tracker-name">{b.name || '—'}</td>
      <td className="tracker-td">{b.type || '—'}</td>
      <td className="tracker-td">{b.formatType || '—'}</td>
      <td className="tracker-td">{b.awarenessStage || '—'}</td>
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

  const hasGroups = Array.isArray(groups) && groups.length > 0
  const empty = hasGroups ? groups.every((g) => !g.rows?.length) : !rows?.length

  return (
    <div className="tracker-wrap">
      <table className="tracker-table">
        <thead>
          <tr>
            <th className="tracker-th">#</th>
            <th className="tracker-th">Date</th>
            <th className="tracker-th">Batch Name</th>
            <th className="tracker-th">Format</th>
            <th className="tracker-th">Format Type</th>
            <th className="tracker-th">Awareness</th>
            <th className="tracker-th">Persona</th>
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
              <td colSpan={BATCH_SHEET_COLUMNS} className="tracker-empty-row">
                {emptyText || 'No batches in this period.'}
              </td>
            </tr>
          )}
          {!empty && hasGroups && groups.map((g) => (
            <SheetGroup key={g.key} group={g} renderRow={renderRow} />
          ))}
          {!empty && !hasGroups && rows.map((b, i) => renderRow(b, i))}
        </tbody>
      </table>
    </div>
  )
}

function SheetGroup({ group, renderRow }) {
  const [open, setOpen] = useState(true)
  return (
    <>
      <tr className="tracker-week-row" onClick={() => setOpen((o) => !o)}>
        <td className="tracker-week-cell" colSpan={BATCH_SHEET_COLUMNS}>
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
