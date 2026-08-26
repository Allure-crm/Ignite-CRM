import { useState, useMemo } from 'react'
import { monthKey, monthLabel, weekStartKey, weekRangeLabel, matchesCsNameQuery } from '../lib/helpers'
import { briefsToCsv, downloadCsv, trackerSheetFilename } from '../lib/exportSheet'
import BatchSheet from './BatchSheet'

const RESULT_COLORS = {
  'Winner': '#22c55e',
  'Loser': '#ef4444',
  'Needs Iteration': '#f59e0b',
  'Testing': '#3b82f6',
  'KPI Winner': '#8b5cf6',
}

const EMPTY_FILTERS = {
  dateFrom: '', dateTo: '', persona: '', page: '', landing: '', status: '',
  csName: '', strategist: '', editor: '', type: '', formatType: '', funnel: '', awareness: '',
}

function sortBriefs(list, sortKey, sortDir) {
  const dir = sortDir === 'desc' ? -1 : 1
  return [...list].sort((a, b) => {
    const av = a[sortKey] ?? a.briefNumber ?? ''
    const bv = b[sortKey] ?? b.briefNumber ?? ''
    if (sortKey === 'briefNumber') return ((a.briefNumber || 0) - (b.briefNumber || 0)) * dir
    return String(av).localeCompare(String(bv), undefined, { numeric: true, sensitivity: 'base' }) * dir
  })
}

export default function Tracker({ config, briefs, onOpen, onBatchEdit }) {
  const [filters, setFilters] = useState(EMPTY_FILTERS)
  const [monthSel, setMonthSel] = useState('all')
  const [groupByWeek, setGroupByWeek] = useState(true)
  const [selected, setSelected] = useState(() => new Set())
  const [sortKey, setSortKey] = useState('briefNumber')
  const [sortDir, setSortDir] = useState('asc')
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
      if (filters.strategist && b.strategist !== filters.strategist) return false
      if (filters.editor && (b.editor || b.assignedTo || 'Unassigned') !== filters.editor) return false
      if (filters.type && b.type !== filters.type) return false
      if (filters.formatType && b.formatType !== filters.formatType) return false
      if (filters.funnel && b.funnel !== filters.funnel) return false
      if (filters.awareness && b.awareness !== filters.awareness) return false
      if (filters.csName && !matchesCsNameQuery(b, filters.csName)) return false
      return true
    })
  }, [briefs, filters, month])

  const sorted = useMemo(
    () => sortBriefs(filtered, sortKey, sortDir),
    [filtered, sortKey, sortDir]
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

  const toggle = (id) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }
  const toggleAll = (ids, on) => {
    setSelected((prev) => {
      const next = new Set(prev)
      ids.forEach((id) => { if (on) next.add(id); else next.delete(id) })
      return next
    })
  }
  const onSort = (key) => {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else { setSortKey(key); setSortDir('asc') }
  }

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
          <label>CS Name</label>
          <input
            type="search"
            placeholder="TOF, Video, editor…"
            value={filters.csName}
            onChange={(e) => setF('csName', e.target.value)}
          />
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
          <label>Strategist</label>
          <select value={filters.strategist} onChange={(e) => setF('strategist', e.target.value)}>
            <option value="">All</option>
            {unique('strategist').map((v) => <option key={v} value={v}>{v}</option>)}
          </select>
        </div>
        <div className="filter-group">
          <label>Editor</label>
          <select value={filters.editor} onChange={(e) => setF('editor', e.target.value)}>
            <option value="">All</option>
            {[...new Set(briefs.map((b) => b.editor || b.assignedTo || 'Unassigned'))].sort().map((v) => (
              <option key={v} value={v}>{v}</option>
            ))}
          </select>
        </div>
        <div className="filter-group">
          <label>Format</label>
          <select value={filters.type} onChange={(e) => setF('type', e.target.value)}>
            <option value="">All</option>
            {unique('type').map((v) => <option key={v} value={v}>{v}</option>)}
          </select>
        </div>
        <div className="filter-group">
          <label>Format Type</label>
          <select value={filters.formatType} onChange={(e) => setF('formatType', e.target.value)}>
            <option value="">All</option>
            {unique('formatType').map((v) => <option key={v} value={v}>{v}</option>)}
          </select>
        </div>
        <div className="filter-group">
          <label>Funnel</label>
          <select value={filters.funnel} onChange={(e) => setF('funnel', e.target.value)}>
            <option value="">All</option>
            {(config.funnels || []).map((v) => <option key={v} value={v}>{v}</option>)}
          </select>
        </div>
        <div className="filter-group">
          <label>Awareness</label>
          <select value={filters.awareness} onChange={(e) => setF('awareness', e.target.value)}>
            <option value="">All</option>
            {unique('awareness').concat(config.awarenessStages.filter((v) => !unique('awareness').includes(v))).map((v) => (
              <option key={v} value={v}>{v}</option>
            ))}
          </select>
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
          <button className="filter-clear" onClick={() => setFilters(EMPTY_FILTERS)}>
            Clear filters
          </button>
        )}
      </div>

      {selected.size > 0 && (
        <div className="batch-bar">
          <span>{selected.size} selected</span>
          <button className="btn-small" onClick={() => onBatchEdit(selected)}>Batch edit naming</button>
          <button className="filter-clear" onClick={() => setSelected(new Set())}>Clear selection</button>
        </div>
      )}

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
        selected={selected}
        onToggle={toggle}
        onToggleAll={toggleAll}
        sortKey={sortKey}
        sortDir={sortDir}
        onSort={onSort}
        emptyText={hasFilters || month !== 'all' ? 'No briefs match the current filters.' : 'No briefs yet. Create one to see it here.'}
      />
    </div>
  )
}
