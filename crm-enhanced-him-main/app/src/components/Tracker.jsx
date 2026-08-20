import { useState, useMemo } from 'react'
import { monthKey, monthLabel, weekStartKey, weekRangeLabel } from '../lib/helpers'
import { briefsToCsv, downloadCsv, trackerSheetFilename } from '../lib/exportSheet'
import BatchSheet from './BatchSheet'

const RESULT_COLORS = {
  'Winner': '#22c55e',
  'Loser': '#ef4444',
  'Needs Iteration': '#f59e0b',
  'Testing': '#3b82f6',
  'KPI Winner': '#8b5cf6',
}

export default function Tracker({ config, briefs, onOpen }) {
  const [filters, setFilters] = useState({ dateFrom: '', dateTo: '', persona: '', page: '', landing: '', status: '' })
  const [monthSel, setMonthSel] = useState('all')
  const [groupByWeek, setGroupByWeek] = useState(true)
  const setF = (k, v) => setFilters((f) => ({ ...f, [k]: v }))

  const unique = (field) => [...new Set(briefs.map((b) => b[field]).filter(Boolean))].sort()

  const months = useMemo(
    () => [...new Set(briefs.map((b) => monthKey(b.date)).filter(Boolean))].sort().reverse(),
    [briefs]
  )
  const month = monthSel || 'all'

  const filtered = useMemo(() => {
    return briefs.filter((b) => {
      if (month !== 'all' && monthKey(b.date) !== month) return false
      if (filters.dateFrom && (b.date || '') < filters.dateFrom) return false
      if (filters.dateTo && (b.date || '') > filters.dateTo) return false
      if (filters.persona && b.persona !== filters.persona) return false
      if (filters.page && b.facebookPage !== filters.page) return false
      if (filters.landing && b.landingPage !== filters.landing) return false
      if (filters.status && b.status !== filters.status) return false
      return true
    })
  }, [briefs, filters, month])

  const sorted = useMemo(
    () => [...filtered].sort((a, b) => (a.briefNumber || 0) - (b.briefNumber || 0)),
    [filtered]
  )

  const weeks = useMemo(() => {
    const map = new Map()
    for (const b of sorted) {
      const key = weekStartKey(b.date) || 'undated'
      if (!map.has(key)) map.set(key, [])
      map.get(key).push(b)
    }
    return [...map.entries()]
      .sort(([a], [b]) => (a === 'undated' ? 1 : b === 'undated' ? -1 : a < b ? -1 : 1))
      .map(([key, rows], i) => ({
        key,
        title: key === 'undated' ? 'No date set' : `Week ${i + 1}`,
        subtitle: key === 'undated' ? '' : weekRangeLabel(key),
        rows,
      }))
  }, [sorted])

  const summary = useMemo(() => {
    const byStatus = {}
    const byResult = {}
    for (const b of sorted) {
      if (b.status) byStatus[b.status] = (byStatus[b.status] || 0) + 1
      if (b.result) byResult[b.result] = (byResult[b.result] || 0) + 1
    }
    return { byStatus, byResult }
  }, [sorted])

  const hasFilters = Object.values(filters).some(Boolean)

  const scopeLabel = month === 'all' ? 'All months' : monthLabel(month)

  const avgPerWeek = weeks.length ? (sorted.length / weeks.length).toFixed(1) : '0'

  return (
    <div>
      <div className="tracker-filters">
        <div className="filter-group">
          <label>Month</label>
          <select value={month} onChange={(e) => setMonthSel(e.target.value)}>
            {months.map((m) => (
              <option key={m} value={m}>{monthLabel(m)}</option>
            ))}
            <option value="all">All months</option>
          </select>
        </div>
        <div className="filter-group">
          <label>From</label>
          <input type="date" value={filters.dateFrom} onChange={(e) => setF('dateFrom', e.target.value)} />
        </div>
        <div className="filter-group">
          <label>To</label>
          <input type="date" value={filters.dateTo} onChange={(e) => setF('dateTo', e.target.value)} />
        </div>
        <div className="filter-group">
          <label>Persona</label>
          <select value={filters.persona} onChange={(e) => setF('persona', e.target.value)}>
            <option value="">All</option>
            {unique('persona').map((v) => <option key={v} value={v}>{v}</option>)}
          </select>
        </div>
        <div className="filter-group">
          <label>{config.fieldLabels.page}</label>
          <select value={filters.page} onChange={(e) => setF('page', e.target.value)}>
            <option value="">All</option>
            {unique('facebookPage').map((v) => <option key={v} value={v}>{v}</option>)}
          </select>
        </div>
        <div className="filter-group">
          <label>{config.fieldLabels.landingPage}</label>
          <select value={filters.landing} onChange={(e) => setF('landing', e.target.value)}>
            <option value="">All</option>
            {unique('landingPage').map((v) => <option key={v} value={v}>{v}</option>)}
          </select>
        </div>
        <div className="filter-group">
          <label>Status</label>
          <select value={filters.status} onChange={(e) => setF('status', e.target.value)}>
            <option value="">All</option>
            {Object.entries(config.statuses).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
        </div>
        <button
          className={'filter-toggle' + (groupByWeek ? ' on' : '')}
          onClick={() => setGroupByWeek((g) => !g)}
        >
          {groupByWeek ? '✓ Grouped by week' : 'Group by week'}
        </button>
        <button
          className="filter-toggle"
          disabled={sorted.length === 0}
          onClick={() => downloadCsv(
            trackerSheetFilename({ month, filters }),
            briefsToCsv(sorted, config)
          )}
        >
          Export sheet
        </button>
        {hasFilters && (
          <button className="filter-clear" onClick={() => setFilters({ dateFrom: '', dateTo: '', persona: '', page: '', landing: '', status: '' })}>
            Clear filters
          </button>
        )}
      </div>

      <div className="mtd-bar">
        <div className="mtd-scope">
          <div className="mtd-scope-label">{scopeLabel}</div>
          <div className="mtd-scope-sub">{weeks.length} {weeks.length === 1 ? 'week' : 'weeks'} · {avgPerWeek} batches/week avg</div>
        </div>
        <div className="mtd-tiles">
          <div className="mtd-tile">
            <div className="mtd-value">{sorted.length}</div>
            <div className="mtd-label">Batches</div>
          </div>
          {Object.entries(config.statuses).map(([key, s]) =>
            summary.byStatus[key] ? (
              <div className="mtd-tile" key={key}>
                <div className="mtd-value" style={{ color: s.color }}>{summary.byStatus[key]}</div>
                <div className="mtd-label">{s.label}</div>
              </div>
            ) : null
          )}
          {Object.entries(summary.byResult).map(([key, count]) => (
            <div className="mtd-tile" key={'r-' + key}>
              <div className="mtd-value" style={{ color: RESULT_COLORS[key] || '#666' }}>{count}</div>
              <div className="mtd-label">{key}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="tracker-count">
        Showing {sorted.length} of {briefs.length} briefs
      </div>

      <BatchSheet
        config={config}
        rows={sorted}
        groups={groupByWeek ? weeks : null}
        onOpen={onOpen}
        emptyText={hasFilters || month !== 'all' ? 'No briefs match the current filters.' : 'No briefs yet. Create one to see it here.'}
      />
    </div>
  )
}
