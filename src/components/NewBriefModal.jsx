import { useState } from 'react'
import {
  UNASSIGNED_EDITOR,
  angleOptions,
  buildCsName,
  editorNames,
  nextBriefNumber,
  strategistNames,
  uuid,
  todayKey,
  withCsName,
} from '../lib/helpers'
import FormatTypeField from './FormatTypeField'
import CreatableSelect from './CreatableSelect'
import CsName from './CsName'

export default function NewBriefModal({ config, user, briefs, onClose, onCreate, onRememberName }) {
  const strategists = strategistNames(config, briefs)
  const editors = editorNames(config, briefs)
  const defaultStrategist = strategists.includes(user.name) ? user.name : (strategists[0] || '')
  const [form, setForm] = useState({
    strategist: defaultStrategist,
    editor: UNASSIGNED_EDITOR,
    date: todayKey(),
    persona: '',
    funnel: '',
    awareness: '',
    type: '',
    formatType: '',
    facebookPage: '',
    landingPage: '',
    adConcept: '',
    angle: '',
    scriptLink: '',
  })
  const set = (k, v) => setForm((f) => {
    const next = { ...f, [k]: v }
    if (k === 'type' && v !== f.type) next.formatType = ''
    return next
  })

  const complete = form.strategist && form.date && form.persona && form.funnel && form.awareness && form.type && form.formatType && form.facebookPage && form.landingPage
  const preview = buildCsName(form)
  const number = nextBriefNumber(briefs)

  const remember = (kind, value) => {
    if (value && onRememberName) onRememberName(kind, value)
  }

  const create = () => {
    const now = Date.now()
    remember('strategist', form.strategist)
    remember('editor', form.editor)
    remember('angle', form.angle)
    onCreate(withCsName({
      id: uuid(),
      ...form,
      awarenessStage: form.awareness,
      finalVideoLink: '',
      ugcAssetsLink: '',
      assignedTo: form.editor !== UNASSIGNED_EDITOR ? form.editor : null,
      status: 'scripting',
      briefNumber: number,
      createdAt: now,
      updatedAt: now,
      launchedAt: null,
      history: [{ status: 'scripting', by: user.name, at: now, note: 'Brief created' }],
    }))
  }

  const Choices = ({ field, options }) => (
    <div className="choice-row">
      {options.map((o) => (
        <button type="button" key={o} className={`choice ${form[field] === o ? 'selected' : ''}`} onClick={() => set(field, o)}>
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
          <CsName value={preview} />

          <CreatableSelect
            label="Creative Strategist"
            value={form.strategist}
            options={strategists}
            onChange={(v) => { set('strategist', v); remember('strategist', v) }}
          />

          <CreatableSelect
            label={config.fieldLabels.editor}
            value={form.editor}
            options={editors}
            onChange={(v) => { set('editor', v || UNASSIGNED_EDITOR); remember('editor', v) }}
          />

          <div className="field">
            <label>Date</label>
            <input type="date" value={form.date} onChange={(e) => set('date', e.target.value)} />
          </div>

          <div className="field">
            <label>{config.fieldLabels.type}</label>
            <Choices field="type" options={config.types} />
          </div>

          <FormatTypeField
            config={config}
            format={form.type}
            value={form.formatType}
            onChange={(v) => set('formatType', v)}
          />

          <div className="field">
            <label>{config.fieldLabels.funnel}</label>
            <Choices field="funnel" options={config.funnels} />
          </div>

          <div className="field">
            <label>{config.fieldLabels.awarenessStage}</label>
            <Choices field="awareness" options={config.awarenessStages} />
          </div>

          <div className="field">
            <label>{config.fieldLabels.persona}</label>
            <Choices field="persona" options={config.personas} />
          </div>

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
            <input
              type="text"
              list="new-brief-angles"
              placeholder="What's the angle?"
              value={form.angle}
              onChange={(e) => set('angle', e.target.value)}
            />
            <datalist id="new-brief-angles">
              {angleOptions(config, briefs).map((o) => <option key={o} value={o} />)}
            </datalist>
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
