import { useMemo, useState } from 'react'
import {
  addDays,
  addMonths,
  briefEditor,
  briefsInPeriod,
  monthKey,
  monthLabel,
  todayKey,
  weekRangeLabel,
  weekStartKey,
} from '../lib/helpers'

const CS_PALETTE = ['#3FC1C9', '#7FD1A0', '#E8A34C', '#A78BFA', '#F27E9D', '#C9A54E', '#60a5fa', '#fb7185']

const EDITING = new Set(['assign_editor', 'needs_editing', 'needs_revision'])
const LIVE = new Set(['launched'])
const READY = new Set(['ready_to_launch'])

function colorFor(name) {
  const text = String(name || '')
  let hash = 0
  for (let i = 0; i < text.length; i += 1) hash = (hash * 31 + text.charCodeAt(i)) >>> 0
  return CS_PALETTE[hash % CS_PALETTE.length]
}

function statusGroup(status) {
  if (LIVE.has(status)) return 'live'
  if (EDITING.has(status)) return 'editing'
  if (READY.has(status)) return 'ready'
  return 'other'
}

function statusTag(status, config) {
  const group = statusGroup(status)
  if (group === 'live') return { label: 'Live', className: 'live' }
  if (group === 'editing') return { label: 'Editing', className: 'edit' }
  if (group === 'ready') return { label: 'Ready', className: 'ready' }
  return { label: config.statuses[status]?.label || status || '—', className: '' }
}

function briefLink(brief) {
  if (brief.status === 'launched' || brief.status === 'ready_to_launch') {
    return { href: brief.finalVideoLink || brief.scriptLink, label: brief.finalVideoLink ? 'View ad' : (brief.scriptLink ? 'Brief' : '') }
  }
  return { href: brief.scriptLink || brief.finalVideoLink, label: brief.scriptLink ? 'Brief' : (brief.finalVideoLink ? 'View ad' : '') }
}

export default function CreativeOutput({ config, briefs, onOpen }) {
  const [period, setPeriod] = useState('weekly')
  const [weekSel, setWeekSel] = useState(null)
  const [monthSel, setMonthSel] = useState(null)
  const [csFilter, setCsFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [formatFilter, setFormatFilter] = useState('')
  const [adTypeFilter, setAdTypeFilter] = useState('')
  const [openRow, setOpenRow] = useState(null)

  const weeksWithData = useMemo(() => {
    const keys = new Set(briefs.map((b) => weekStartKey(b.date)).filter(Boolean))
    return [...keys].sort().reverse()
  }, [briefs])
  const weeks = useMemo(() => {
    const keys = new Set(weeksWithData)
    keys.add(weekStartKey(todayKey()))
    return [...keys].sort().reverse()
  }, [weeksWithData])
  const monthsWithData = useMemo(
    () => [...new Set(briefs.map((b) => monthKey(b.date)).filter(Boolean))].sort().reverse(),
    [briefs]
  )
  const months = useMemo(() => {
    const keys = new Set(monthsWithData)
    keys.add(monthKey(todayKey()))
    return [...keys].sort().reverse()
  }, [monthsWithData])

  const week = weekSel ?? weeksWithData[0] ?? weekStartKey(todayKey())
  const month = monthSel ?? monthsWithData[0] ?? monthKey(todayKey())

  const periodBriefs = useMemo(() => {
    if (period === 'monthly') return briefs.filter((b) => monthKey(b.date) === month)
    return briefsInPeriod(briefs, 'weekly', week)
  }, [briefs, period, week, month])

  const filtered = useMemo(() => {
    return periodBriefs.filter((b) => {
      if (csFilter && b.strategist !== csFilter) return false
      if (statusFilter && statusGroup(b.status) !== statusFilter) return false
      if (typeFilter && b.type !== typeFilter) return false
      if (formatFilter && (b.formatType || 'Unlabeled') !== formatFilter) return false
      if (adTypeFilter && b.adType !== adTypeFilter) return false
      return true
    })
  }, [periodBriefs, csFilter, statusFilter, typeFilter, formatFilter, adTypeFilter])

  const byCS = useMemo(() => {
    const map = {}
    for (const b of filtered) {
      const key = b.strategist || 'Unassigned'
      ;(map[key] = map[key] || []).push(b)
    }
    return Object.entries(map).sort((a, b) => b[1].length - a[1].length)
  }, [filtered])

  const byFT = useMemo(() => {
    const map = {}
    for (const b of filtered) {
      const key = b.formatType || 'Unlabeled'
      ;(map[key] = map[key] || []).push(b)
    }
    return Object.entries(map).sort((a, b) => b[1].length - a[1].length)
  }, [filtered])

  const csMax = byCS[0]?.[1].length || 1
  const ftMax = byFT[0]?.[1].length || 1

  const kpis = useMemo(() => ({
    total: filtered.length,
    live: filtered.filter((b) => statusGroup(b.status) === 'live').length,
    editing: filtered.filter((b) => statusGroup(b.status) === 'editing').length,
    ready: filtered.filter((b) => statusGroup(b.status) === 'ready').length,
  }), [filtered])

  const periodLabel = period === 'monthly' ? monthLabel(month) : `Week of ${weekRangeLabel(week)}`
  const uniqueCS = [...new Set(periodBriefs.map((b) => b.strategist).filter(Boolean))].sort()
  const uniqueTypes = [...new Set(periodBriefs.map((b) => b.type).filter(Boolean))].sort()
  const uniqueFT = [...new Set(periodBriefs.map((b) => b.formatType || 'Unlabeled'))].sort()
  const hasFilters = Boolean(csFilter || statusFilter || typeFilter || formatFilter || adTypeFilter)

  const toggleRow = (id) => setOpenRow((cur) => (cur === id ? null : id))

  return (
    <main className="main">
      <div className="topbar">
        <div>
          <h1>Creative Output</h1>
          <div className="sub">{periodLabel} · {filtered.length} batch{filtered.length === 1 ? '' : 'es'}</div>
        </div>
        <div className="ov-controls">
          <div className="seg" role="tablist" aria-label="Period">
            <button className={period === 'weekly' ? 'on' : ''} onClick={() => setPeriod('weekly')}>Weekly</button>
            <button className={period === 'monthly' ? 'on' : ''} onClick={() => setPeriod('monthly')}>Monthly</button>
          </div>
        </div>
      </div>

      <div className="content output-page">
        <div className="ov-period-nav">
          {period === 'weekly' ? (
            <>
              <button className="ov-step" onClick={() => setWeekSel(addDays(week, -7))} aria-label="Previous week">‹</button>
              <select className="ov-select" value={week} onChange={(e) => setWeekSel(e.target.value)}>
                {weeks.map((w) => <option key={w} value={w}>{weekRangeLabel(w)}</option>)}
                {!weeks.includes(week) && <option value={week}>{weekRangeLabel(week)}</option>}
              </select>
              <button className="ov-step" onClick={() => setWeekSel(addDays(week, 7))} aria-label="Next week">›</button>
              <button className="ov-today" onClick={() => setWeekSel(weekStartKey(todayKey()))}>This week</button>
            </>
          ) : (
            <>
              <button className="ov-step" onClick={() => setMonthSel(addMonths(month, -1))} aria-label="Previous month">‹</button>
              <select className="ov-select" value={month} onChange={(e) => setMonthSel(e.target.value)}>
                {months.map((m) => <option key={m} value={m}>{monthLabel(m)}</option>)}
                {!months.includes(month) && <option value={month}>{monthLabel(month)}</option>}
              </select>
              <button className="ov-step" onClick={() => setMonthSel(addMonths(month, 1))} aria-label="Next month">›</button>
              <button className="ov-today" onClick={() => setMonthSel(monthKey(todayKey()))}>This month</button>
            </>
          )}
        </div>

        <div className="out-kpis">
          <div className="out-kpi total"><small>Total output</small><b>{kpis.total}</b></div>
          <div className="out-kpi"><small>Live</small><b>{kpis.live}</b></div>
          <div className="out-kpi"><small>In editing</small><b>{kpis.editing}</b></div>
          <div className="out-kpi"><small>Ready to launch</small><b>{kpis.ready}</b></div>
        </div>

        <div className="out-filters">
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">All statuses</option>
            <option value="live">Live</option>
            <option value="editing">In editing</option>
            <option value="ready">Ready to launch</option>
            <option value="other">Other</option>
          </select>
          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
            <option value="">All formats</option>
            {uniqueTypes.map((v) => <option key={v} value={v}>{v}</option>)}
          </select>
          <select value={formatFilter} onChange={(e) => setFormatFilter(e.target.value)}>
            <option value="">All format types</option>
            {uniqueFT.map((v) => <option key={v} value={v}>{v}</option>)}
          </select>
          <select value={adTypeFilter} onChange={(e) => setAdTypeFilter(e.target.value)}>
            <option value="">All ad types</option>
            {(config.adTypes || []).map((v) => <option key={v} value={v}>{v}</option>)}
          </select>
          {hasFilters && (
            <button className="filter-clear" onClick={() => {
              setCsFilter('')
              setStatusFilter('')
              setTypeFilter('')
              setFormatFilter('')
              setAdTypeFilter('')
            }}>
              Clear filters
            </button>
          )}
        </div>

        <section className="out-section">
          <h2 className="out-title">Output by strategist</h2>
          <p className="out-hint">Click a name to open their batches. Live batches link to the ad when one exists; others link to the brief.</p>
          <div className="out-rows">
            {byCS.length === 0 && <div className="lane-empty">No batches in this period.</div>}
            {byCS.map(([cs, items]) => (
              <ExpandRow
                key={`cs-${cs}`}
                id={`cs-${cs}`}
                open={openRow === `cs-${cs}`}
                onToggle={() => {
                  toggleRow(`cs-${cs}`)
                  setCsFilter(cs)
                }}
                name={cs}
                count={items.length}
                max={csMax}
                color={colorFor(cs)}
                config={config}
                items={items}
                onOpen={onOpen}
                showFT
              />
            ))}
          </div>
        </section>

        <section className="out-section">
          <h2 className="out-title">Format types</h2>
          <p className="out-hint">The bar shows who made them.</p>
          <div className="out-rows">
            {byFT.map(([ft, items]) => {
              const owners = {}
              items.forEach((d) => { const cs = d.strategist || 'Unassigned'; owners[cs] = (owners[cs] || 0) + 1 })
              const segments = Object.entries(owners).sort((a, b) => b[1] - a[1])
              return (
                <ExpandRow
                  key={`ft-${ft}`}
                  id={`ft-${ft}`}
                  open={openRow === `ft-${ft}`}
                  onToggle={() => {
                    toggleRow(`ft-${ft}`)
                    setFormatFilter(ft)
                  }}
                  name={ft}
                  count={items.length}
                  max={ftMax}
                  segments={segments}
                  config={config}
                  items={items}
                  onOpen={onOpen}
                  showCS
                />
              )
            })}
          </div>
        </section>

        <section className="out-section">
          <h2 className="out-title">Creative Strategist breakdown</h2>
          <div className="out-chips">
            <button className={`out-chip ${!csFilter ? 'on' : ''}`} onClick={() => setCsFilter('')}>
              All {periodBriefs.length}
            </button>
            {uniqueCS.map((cs) => (
              <button
                key={cs}
                className={`out-chip ${csFilter === cs ? 'on' : ''}`}
                onClick={() => setCsFilter(cs)}
              >
                {cs} {periodBriefs.filter((b) => b.strategist === cs).length}
              </button>
            ))}
          </div>
          <div className="out-count">Showing {filtered.length} of {periodBriefs.length}</div>
          <div className="out-tablewrap">
            <table className="out-table">
              <thead>
                <tr>
                  <th>Batch</th>
                  <th>CS</th>
                  <th>Format type</th>
                  <th>Ad Type</th>
                  <th>Status</th>
                  <th>Concept</th>
                  <th>Link</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 && (
                  <tr><td colSpan={7} className="tracker-empty-row">No batches match the current filters.</td></tr>
                )}
                {filtered.map((b) => {
                  const tag = statusTag(b.status, config)
                  const link = briefLink(b)
                  return (
                    <tr key={b.id} onClick={() => onOpen(b)}>
                      <td>{b.briefNumber ? `#${b.briefNumber}` : '—'}</td>
                      <td>{b.strategist || '—'}</td>
                      <td>{b.formatType || 'Unlabeled'}</td>
                      <td>{b.adType || '—'}</td>
                      <td>
                        <span className={`out-tag ${tag.className}`}>{tag.label}</span>
                      </td>
                      <td>{b.adConcept || b.angle || b.name || '—'}</td>
                      <td onClick={(e) => e.stopPropagation()}>
                        {link.href ? (
                          <a href={link.href} target="_blank" rel="noreferrer">{link.label}</a>
                        ) : '—'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  )
}

function ExpandRow({ id, open, onToggle, name, count, max, color, segments, config, items, onOpen, showFT, showCS }) {
  return (
    <div className={`out-row ${open ? 'open' : ''}`}>
      <button
        type="button"
        className="out-row-head"
        aria-expanded={open}
        aria-controls={`${id}-body`}
        onClick={onToggle}
      >
        {color && <span className="out-dot" style={{ background: color }} />}
        <span className="out-row-name">{name}</span>
        <span className="out-bar-track">
          {segments ? segments.map(([cs, n]) => (
            <span
              key={cs}
              className="out-bar"
              style={{ width: `${(n / max) * 100}%`, background: colorFor(cs) }}
              title={`${cs}: ${n}`}
            />
          )) : (
            <span className="out-bar" style={{ width: `${(count / max) * 100}%`, background: color }} />
          )}
        </span>
        <span className="out-row-num">{count}</span>
        <span className="out-caret">▶</span>
      </button>
      {open && (
        <div className="out-row-body" id={`${id}-body`}>
          {items.map((b) => {
            const tag = statusTag(b.status, config)
            const link = briefLink(b)
            return (
              <div className="out-batch" key={b.id}>
                <span className="out-bnum">{b.briefNumber ? `#${b.briefNumber}` : '·'}</span>
                {showCS && <span className="out-tag who" style={{ background: colorFor(b.strategist), color: '#0E1420' }}>{b.strategist}</span>}
                {showFT && <span className="out-mini">{b.formatType || 'Unlabeled'}</span>}
                <span className={`out-tag ${tag.className}`}>{tag.label}</span>
                <button type="button" className="out-bangle" onClick={() => onOpen(b)}>
                  {b.adConcept || b.angle || b.name || 'Untitled'}
                </button>
                <span className="out-editor">{briefEditor(b)}</span>
                {link.href ? (
                  <a href={link.href} target="_blank" rel="noreferrer">{link.label}</a>
                ) : (
                  <span className="out-wait">no link</span>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
