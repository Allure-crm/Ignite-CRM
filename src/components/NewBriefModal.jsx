import { useState } from 'react'
import {
  AD_TYPES,
  UNASSIGNED_EDITOR,
  buildCsName,
  nextStrategistNumber,
  todayKey,
  uuid,
  withCsName,
} from '../lib/helpers'
import NamingFields from './NamingFields'

export default function NewBriefModal({ config, user, briefs, onClose, onCreate, onRememberName }) {
  const [form, setForm] = useState({
    strategist: user.role === 'creative_strategist' || user.role === 'strategist' ? user.name : '',
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
    adType: '',
    hookNumber: 1,
    scriptLink: '',
  })

  const number = nextStrategistNumber(briefs, form.strategist)
  const preview = { ...form, briefNumber: number, awarenessStage: form.awareness }
  const complete = form.strategist && form.date && form.funnel && form.awareness && form.type && form.formatType && form.adType && form.angle

  const create = () => {
    const now = Date.now()
    if (form.strategist) onRememberName?.('strategist', form.strategist)
    if (form.editor) onRememberName?.('editor', form.editor)
    onCreate(withCsName({
      id: uuid(),
      ...form,
      awarenessStage: form.awareness,
      name: buildCsName(preview),
      finalVideoLink: '',
      ugcAssetsLink: '',
      assignedTo: form.editor !== UNASSIGNED_EDITOR ? form.editor : null,
      status: 'scripting',
      briefNumber: number,
      createdAt: now,
      updatedAt: now,
      launchedAt: null,
      launchedDate: '',
      history: [{ status: 'scripting', by: user.name, at: now, note: 'Brief created' }],
    }))
  }

  const Choices = ({ field, options }) => (
    <div className="choice-row">
      {options.map((o) => (
        <button type="button" key={o} className={`choice ${form[field] === o ? 'selected' : ''}`} onClick={() => setForm((f) => ({ ...f, [field]: o }))}>
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
          <NamingFields
            config={config}
            briefs={briefs}
            value={preview}
            onChange={(next) => setForm((f) => ({
              ...f,
              ...next,
              awareness: next.awareness || next.awarenessStage || f.awareness,
              awarenessStage: next.awareness || next.awarenessStage || f.awareness,
            }))}
            onAddPerson={(role, name) => onRememberName?.(role === 'video_editor' ? 'editor' : 'strategist', name)}
          />

          <div className="field">
            <label>Date</label>
            <input type="date" value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} />
          </div>

          <div className="field">
            <label>{config.fieldLabels.adType}</label>
            <Choices field="adType" options={config.adTypes || AD_TYPES} />
          </div>

          <div className="field">
            <label>{config.fieldLabels.page}</label>
            <select value={form.facebookPage} onChange={(e) => setForm((f) => ({ ...f, facebookPage: e.target.value }))}>
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
            <input type="text" placeholder="Short label for the batch…" value={form.adConcept} onChange={(e) => setForm((f) => ({ ...f, adConcept: e.target.value }))} />
          </div>

          <div className="field">
            <label>{config.fieldLabels.angle}</label>
            <textarea
              rows={6}
              placeholder="Full creative write-up…"
              value={form.angle}
              onChange={(e) => setForm((f) => ({ ...f, angle: e.target.value }))}
            />
          </div>

          <div className="field">
            <label>{config.fieldLabels.scriptLink}</label>
            <input type="url" placeholder="Paste doc link…" value={form.scriptLink} onChange={(e) => setForm((f) => ({ ...f, scriptLink: e.target.value }))} />
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
