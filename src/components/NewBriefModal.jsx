import { useState } from 'react'
import { briefName, nextBriefNumber, uuid, todayKey } from '../lib/helpers'
import FormatTypeField from './FormatTypeField'

export default function NewBriefModal({ config, user, briefs, onClose, onCreate }) {
  const strategistRoles = ['strategist', 'creative_strategist']
  const strategists = config.users.filter((u) => strategistRoles.includes(u.role))
  const [form, setForm] = useState({
    strategist: strategistRoles.includes(user.role) ? user.name : (strategists[0]?.name || ''),
    date: todayKey(),
    persona: '',
    awarenessStage: '',
    type: '',
    formatType: '',
    facebookPage: '',
    landingPage: '',
    adConcept: '',
    angle: '',
    scriptLink: '',
  })
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  const complete = form.strategist && form.date && form.persona && form.awarenessStage && form.type && form.facebookPage && form.landingPage
  const abbr = config.users.find((u) => u.name === form.strategist)?.abbr || form.strategist.slice(0, 2).toUpperCase()
  const number = nextBriefNumber(briefs)
  const preview = form.strategist ? briefName({ abbr, briefNumber: number }) : ''

  const create = () => {
    const now = Date.now()
    onCreate({
      id: uuid(),
      name: preview,
      ...form,
      finalVideoLink: '',
      ugcAssetsLink: '',
      assignedTo: null,
      status: 'scripting',
      briefNumber: number,
      createdAt: now,
      updatedAt: now,
      launchedAt: null,
      history: [{ status: 'scripting', by: user.name, at: now, note: 'Brief created' }],
    })
  }

  const Choices = ({ field, options }) => (
    <div className="choice-row">
      {options.map((o) => (
        <button key={o} className={`choice ${form[field] === o ? 'selected' : ''}`} onClick={() => set(field, o)}>
          {o}
        </button>
      ))}
    </div>
  )

  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal wide" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h2>Create New Brief</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <div className="name-preview">
            <div className="label">Brief name (auto-generated)</div>
            <div className={`value ${preview ? '' : 'placeholder'}`}>{preview || 'Fill in all fields to preview…'}</div>
          </div>

          <div className="field">
            <label>Creative Strategist</label>
            <select value={form.strategist} onChange={(e) => set('strategist', e.target.value)}>
              {strategists.map((s) => <option key={s.name} value={s.name}>{s.name} ({s.abbr})</option>)}
            </select>
          </div>

          <div className="field">
            <label>Date</label>
            <input type="date" value={form.date} onChange={(e) => set('date', e.target.value)} />
          </div>

          <div className="field">
            <label>{config.fieldLabels.persona}</label>
            <Choices field="persona" options={config.personas} />
          </div>

          <div className="field">
            <label>{config.fieldLabels.awarenessStage}</label>
            <Choices field="awarenessStage" options={config.awarenessStages} />
          </div>

          <div className="field">
            <label>{config.fieldLabels.type}</label>
            <Choices field="type" options={config.types} />
          </div>

          <FormatTypeField
            config={config}
            value={form.formatType}
            onChange={(v) => set('formatType', v)}
            extraOptions={briefs.map((b) => b.formatType)}
          />

          <div className="field">
            <label>{config.fieldLabels.page}</label>
            <select value={form.facebookPage} onChange={(e) => set('facebookPage', e.target.value)}>
              <option value="">Select…</option>
              {config.pages.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>

          <div className="field">
            <label>{config.fieldLabels.landingPage}</label>
            <Choices field="landingPage" options={config.landingPages} />
          </div>

          <div className="field">
            <label>{config.fieldLabels.adConcept}</label>
            <input type="text" placeholder="Describe the ad concept…" value={form.adConcept} onChange={(e) => set('adConcept', e.target.value)} />
          </div>

          <div className="field">
            <label>{config.fieldLabels.angle}</label>
            <input type="text" placeholder="What's the angle?" value={form.angle} onChange={(e) => set('angle', e.target.value)} />
          </div>

          <div className="field">
            <label>{config.fieldLabels.scriptLink}</label>
            <input type="url" placeholder="Paste doc link…" value={form.scriptLink} onChange={(e) => set('scriptLink', e.target.value)} />
          </div>
        </div>
        <div className="modal-foot">
          <button className="btn-primary" disabled={!complete} style={{ opacity: complete ? 1 : 0.45 }} onClick={create}>
            Create Brief
          </button>
        </div>
      </div>
    </div>
  )
}
