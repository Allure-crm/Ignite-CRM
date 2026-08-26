import { useMemo, useState } from 'react'
import {
  todayKey,
  weekStartKey,
  weekRangeLabel,
  addDays,
  addMonths,
  dayLabel,
  monthKey,
  monthLabel,
  briefsInPeriod,
  PIPELINE_LANES,
  formatByWeekMatrix,
} from '../lib/helpers'
import FormatByWeek from './FormatByWeek'
import BriefCard from './BriefCard'

export default function Overview({ config, user, briefs, onOpen, onAction }) {
  const [period, setPeriod] = useState('weekly') // 'daily' | 'weekly'
  const [mode, setMode] = useState('summary') // 'pipeline' | 'summary'
  const [daySel, setDaySel] = useState(null)
  const [weekSel, setWeekSel] = useState(null)
  const [monthSel, setMonthSel] = useState(null)

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

  const monthsWithData = useMemo(
    () => [...new Set(briefs.map((b) => monthKey(b.date)).filter(Boolean))].sort().reverse(),
    [briefs]
  )

  const months = useMemo(() => {
    const keys = new Set(monthsWithData)
    keys.add(monthKey(todayKey()))
    return [...keys].sort().reverse()
  }, [monthsWithData])

  const day = daySel ?? days[0] ?? todayKey()
  const week = weekSel ?? weeksWithData[0] ?? weekStartKey(todayKey())
  const month = monthSel ?? monthsWithData[0] ?? monthKey(todayKey())

  const periodKey = period === 'daily' ? day : week
  const scoped = useMemo(
    () => briefsInPeriod(briefs, period, periodKey),
    [briefs, period, periodKey]
  )

  const matrix = useMemo(() => formatByWeekMatrix(briefs, month), [briefs, month])

  const periodLabel = period === 'daily' ? dayLabel(day) : `Week of ${weekRangeLabel(week)}`
  const summaryLabel = monthLabel(month)

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
          <div className="sub">
            {mode === 'summary'
              ? `${summaryLabel} · ${matrix.total} batch${matrix.total === 1 ? '' : 'es'}`
              : `${periodLabel} · ${scoped.length} batch${scoped.length === 1 ? '' : 'es'}`}
          </div>
        </div>
        <div className="ov-controls">
          {mode === 'pipeline' && (
            <select className="ov-select" value={period} onChange={(e) => onPeriodChange(e.target.value)}>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
            </select>
          )}
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
        {mode === 'summary' ? (
          <>
            <div className="ov-period-nav">
              <button className="ov-step" onClick={() => setMonthSel(addMonths(month, -1))} aria-label="Previous month">‹</button>
              <select className="ov-select" value={month} onChange={(e) => setMonthSel(e.target.value)}>
                {months.map((m) => (
                  <option key={m} value={m}>{monthLabel(m)}</option>
                ))}
                {!months.includes(month) && <option value={month}>{monthLabel(month)}</option>}
              </select>
              <button className="ov-step" onClick={() => setMonthSel(addMonths(month, 1))} aria-label="Next month">›</button>
              <button className="ov-today" onClick={() => setMonthSel(monthKey(todayKey()))}>This month</button>
            </div>
            <FormatByWeek matrix={matrix} />
          </>
        ) : (
          <>
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
            <PipelineBoard config={config} user={user} briefs={scoped} onOpen={onOpen} onAction={onAction} />
          </>
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
