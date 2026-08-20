import { useState, useMemo } from 'react'

function mondayOf(date) {
  const d = new Date(date + 'T00:00:00')
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  d.setDate(diff)
  return d.toISOString().slice(0, 10)
}

function formatWeekLabel(monday) {
  const start = new Date(monday + 'T00:00:00')
  const end = new Date(start)
  end.setDate(end.getDate() + 6)
  const fmt = (d) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  return `Week of ${fmt(start)} – ${fmt(end)}`
}

export default function WeeklyIntake({ user, intakes, onSave }) {
  const thisMonday = mondayOf(new Date().toISOString().slice(0, 10))

  const [selectedWeek, setSelectedWeek] = useState(thisMonday)
  const existing = intakes.find((e) => e.weekOf === selectedWeek)

  const [form, setForm] = useState({
    output: existing?.output || '',
    learnings: existing?.learnings || '',
    focus: existing?.focus || '',
  })
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  const selectWeek = (week) => {
    setSelectedWeek(week)
    const entry = intakes.find((e) => e.weekOf === week)
    setForm({
      output: entry?.output || '',
      learnings: entry?.learnings || '',
      focus: entry?.focus || '',
    })
  }

  const weeks = useMemo(() => {
    const allWeeks = new Set([thisMonday])
    intakes.forEach((e) => allWeeks.add(e.weekOf))
    return [...allWeeks].sort().reverse()
  }, [intakes, thisMonday])

  const hasContent = form.output || form.learnings || form.focus
  const isCurrentWeek = selectedWeek === thisMonday

  const handleSave = () => {
    onSave({
      weekOf: selectedWeek,
      strategist: user.name,
      output: form.output,
      learnings: form.learnings,
      focus: form.focus,
      updatedAt: Date.now(),
    })
  }

  return (
    <div className="intake-container">
      <div className="intake-sidebar">
        <div className="intake-sidebar-label">Weekly Reports</div>
        {weeks.map((w) => {
          const entry = intakes.find((e) => e.weekOf === w)
          const filled = entry && (entry.output || entry.learnings || entry.focus)
          return (
            <button
              key={w}
              className={`intake-week-btn ${selectedWeek === w ? 'active' : ''}`}
              onClick={() => selectWeek(w)}
            >
              <span>{formatWeekLabel(w)}</span>
              {filled ? <span className="intake-dot filled" /> : <span className="intake-dot empty" />}
            </button>
          )
        })}
      </div>

      <div className="intake-form">
        <div className="intake-header">
          <h2>{formatWeekLabel(selectedWeek)}</h2>
          {isCurrentWeek && <span className="intake-badge-current">Current Week</span>}
          {existing && (
            <span className="intake-meta">
              Last updated by {existing.strategist} — {new Date(existing.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
            </span>
          )}
        </div>

        <div className="intake-field">
          <label>Creative Output from Last Week</label>
          <p className="intake-hint">What formats did you create briefs for? How many of each?</p>
          <textarea
            value={form.output}
            onChange={(e) => set('output', e.target.value)}
            placeholder="e.g. 12 AI Animated videos, 4 Broll + VO, 3 Native ads, 2 Statics…"
            rows={5}
          />
        </div>

        <div className="intake-field">
          <label>Learnings</label>
          <p className="intake-hint">What worked, what didn't? Any patterns or insights?</p>
          <textarea
            value={form.learnings}
            onChange={(e) => set('learnings', e.target.value)}
            placeholder="e.g. Disney avatar style getting strongest CTR. Podcast reactions underperforming — need stronger hooks…"
            rows={5}
          />
        </div>

        <div className="intake-field">
          <label>Creative Focus for This Week</label>
          <p className="intake-hint">What angles, formats, or experiments will you prioritize?</p>
          <textarea
            value={form.focus}
            onChange={(e) => set('focus', e.target.value)}
            placeholder="e.g. Double down on claymation TOF ads. Test 3 new MOF retargeting angles. Launch first BOF statics…"
            rows={5}
          />
        </div>

        <div className="intake-actions">
          <button className="btn-primary" style={{ width: 'auto', padding: '10px 28px' }} onClick={handleSave} disabled={!hasContent}>
            {existing ? 'Update Report' : 'Submit Report'}
          </button>
        </div>
      </div>
    </div>
  )
}
