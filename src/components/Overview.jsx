import { useMemo, useState } from 'react'
import {
  todayKey,
  weekStartKey,
  weekRangeLabel,
  addDays,
  dayLabel,
  briefsInPeriod,
  PIPELINE_LANES,
} from '../lib/helpers'
import BatchSheet from './BatchSheet'
import BriefCard from './BriefCard'

export default function Overview({ config, user, briefs, onOpen, onAction }) {
  const [period, setPeriod] = useState('weekly') // 'daily' | 'weekly'
  const [mode, setMode] = useState('summary') // 'pipeline' | 'summary'
  const [daySel, setDaySel] = useState(null)
  const [weekSel, setWeekSel] = useState(null)

  const weeksWithData = useMemo(() => {
    const keys = new Set(briefs.map((b) => weekStartKey(b.date)).filter(Boolean))
    return [...keys].sort().reverse()
  }, [briefs])

  const weeks = useMemo(() => {
    const keys = new Set(weeksWithData)
    keys.add(weekStartKey(todayKey()))
    return [...keys].sort().reverse()
  }, [weeksWithData])

  const days = useMemo(
    () => [...new Set(briefs.map((b) => b.date).filter(Boolean))].sort().reverse(),
    [briefs]
  )

  const day = daySel ?? days[0] ?? todayKey()
  const week = weekSel ?? weeksWithData[0] ?? weekStartKey(todayKey())

  const periodKey = period === 'daily' ? day : week
  const scoped = useMemo(
    () => [...briefsInPeriod(briefs, period, periodKey)].sort((a, b) => (a.briefNumber || 0) - (b.briefNumber || 0)),
    [briefs, period, periodKey]
  )

  const dailyGroups = useMemo(() => {
    if (period !== 'weekly') return null
    const map = new Map()
    for (const b of scoped) {
      const key = b.date || 'undated'
      if (!map.has(key)) map.set(key, [])
      map.get(key).push(b)
    }
    return [...map.entries()]
      .sort(([a], [b]) => (a < b ? -1 : 1))
      .map(([key, rows]) => ({
        key,
        title: key === 'undated' ? 'No date set' : dayLabel(key),
        rows,
      }))
  }, [period, scoped])

  const periodLabel = period === 'daily' ? dayLabel(day) : `Week of ${weekRangeLabel(week)}`

  const onPeriodChange = (next) => {
    setPeriod(next)
    if (next === 'weekly') setWeekSel(weekStartKey(day))
    if (next === 'daily') setDaySel(week)
  }

  return (
    <main className="main">
      <div className="topbar">
        <div>
          <h1>Summary</h1>
          <div className="sub">{periodLabel} · {scoped.length} batch{scoped.length === 1 ? '' : 'es'}</div>
        </div>
        <div className="ov-controls">
          <select className="ov-select" value={period} onChange={(e) => onPeriodChange(e.target.value)}>
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
          </select>
          <div className="seg" role="tablist" aria-label="View mode">
            <button
              className={mode === 'pipeline' ? 'on' : ''}
              onClick={() => setMode('pipeline')}
            >
              Pipeline
            </button>
            <button
              className={mode === 'summary' ? 'on' : ''}
              onClick={() => setMode('summary')}
            >
              Summary
            </button>
          </div>
        </div>
      </div>

      <div className="content">
        <div className="ov-period-nav">
          {period === 'daily' ? (
            <>
              <button className="ov-step" onClick={() => setDaySel(addDays(day, -1))} aria-label="Previous day">‹</button>
              <input type="date" value={day} onChange={(e) => setDaySel(e.target.value)} />
              <button className="ov-step" onClick={() => setDaySel(addDays(day, 1))} aria-label="Next day">›</button>
              <button className="ov-today" onClick={() => setDaySel(todayKey())}>Today</button>
            </>
          ) : (
            <>
              <button
                className="ov-step"
                onClick={() => setWeekSel(addDays(week, -7))}
                aria-label="Previous week"
              >
                ‹
              </button>
              <select className="ov-select" value={week} onChange={(e) => setWeekSel(e.target.value)}>
                {weeks.map((w) => (
                  <option key={w} value={w}>{weekRangeLabel(w)}</option>
                ))}
                {!weeks.includes(week) && <option value={week}>{weekRangeLabel(week)}</option>}
              </select>
              <button
                className="ov-step"
                onClick={() => setWeekSel(addDays(week, 7))}
                aria-label="Next week"
              >
                ›
              </button>
              <button className="ov-today" onClick={() => setWeekSel(weekStartKey(todayKey()))}>This week</button>
            </>
          )}
        </div>

        {mode === 'pipeline' ? (
          <PipelineBoard config={config} user={user} briefs={scoped} onOpen={onOpen} onAction={onAction} />
        ) : (
          <BatchSheet
            config={config}
            rows={scoped}
            groups={dailyGroups}
            onOpen={onOpen}
            emptyText={`No batches inputted ${period === 'daily' ? 'on this day' : 'this week'}.`}
          />
        )}
      </div>
    </main>
  )
}

function PipelineBoard({ config, user, briefs, onOpen, onAction }) {
  return (
    <div>
      <div className="pipe-strip">
        {PIPELINE_LANES.map((lane, i) => {
          const count = briefs.filter((b) => lane.statuses.includes(b.status)).length
          return (
            <div key={lane.key} className="pipe-step">
              {i > 0 && <span className="pipe-arrow">→</span>}
              <div className="pipe-chip" style={{ borderColor: lane.color + '66' }}>
                <span className="pipe-dot" style={{ background: lane.color }} />
                <span>{lane.label}</span>
                <span className="pipe-count">{count}</span>
              </div>
            </div>
          )
        })}
      </div>
      <div className="kanban">
        {PIPELINE_LANES.map((lane) => {
          const laneBriefs = briefs.filter((b) => lane.statuses.includes(b.status))
          return (
            <div className="lane" key={lane.key}>
              <div className="lane-head">
                <span className="dot" style={{ width: 8, height: 8, borderRadius: '50%', background: lane.color }} />
                {lane.label}
                <span className="count">{laneBriefs.length}</span>
              </div>
              {laneBriefs.length === 0 && <div className="lane-empty">No batches</div>}
              {laneBriefs.map((b) => (
                <BriefCard key={b.id} brief={b} config={config} user={user} onOpen={onOpen} onAction={onAction} />
              ))}
            </div>
          )
        })}
      </div>
    </div>
  )
}
