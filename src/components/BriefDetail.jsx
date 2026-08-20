import { useState } from 'react'
import { fmtDate } from '../lib/helpers'

export default function BriefDetail({ config, brief, onClose, onSave, onDelete, onAction }) {
  const [edit, setEdit] = useState({
    date: brief?.date || '',
    persona: brief?.persona || '',
    awarenessStage: brief?.awarenessStage || '',
    type: brief?.type || '',
    formatType: brief?.formatType || '',
    facebookPage: brief?.facebookPage || '',
    landingPage: brief?.landingPage || '',
    adConcept: brief?.adConcept || '',
    angle: brief?.angle || '',
    strategist: brief?.strategist || '',
    scriptLink: brief?.scriptLink || '',
    finalVideoLink: brief?.finalVideoLink || '',
    ugcAssetsLink: brief?.ugcAssetsLink || '',
    postId: brief?.postId || '',
    learnings: brief?.learnings || '',
    result: brief?.result || '',
  })
  if (!brief) return null

  const transitions = config.transitions[brief.status] || []
  const set = (k, v) => setEdit((e) => ({ ...e, [k]: v }))
  const latestNote = [...(brief.history || [])].reverse().find((h) => h.note)

  const strategistRoles = ['strategist', 'creative_strategist']
  const strategists = config.users.filter((u) => strategistRoles.includes(u.role))

  const save = () => {
    onSave({ ...brief, ...edit, updatedAt: Date.now() })
    onClose()
  }

  const Choices = ({ field, options }) => (
    <div className="choice-row">
      {options.map((o) => (
        <button key={o} className={`choice ${edit[field] === o ? 'selected' : ''}`} onClick={() => set(field, o)}>
          {o}
        </button>
      ))}
    </div>
  )

  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal wide" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h2 style={{ fontSize: 14, fontFamily: 'ui-monospace, monospace' }}>{brief.name}</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <div className="detail-grid">
            <div className="detail-item"><div className="k">Status</div>
              <div className="v" style={{ color: config.statuses[brief.status]?.color, fontWeight: 600 }}>
                {config.statuses[brief.status]?.label}
              </div>
            </div>
            <div className="detail-item"><div className="k">Assigned To</div><div className="v">{brief.assignedTo || '—'}</div></div>
            <div className="detail-item"><div className="k">Launched</div><div className="v">{brief.launchedAt ? fmtDate(brief.launchedAt) : '—'}</div></div>
          </div>

          {brief.status === 'script_revision' && latestNote?.note && (
            <div className="field">
              <label>Script revision comments</label>
              <div className="card-note" style={{ marginTop: 0 }}>“{latestNote.note}”</div>
            </div>
          )}

          <div className="field">
            <label>Result</label>
            <Choices field="result" options={config.results} />
          </div>

          <div className="field">
            <label>Creative Strategist</label>
            <select value={edit.strategist} onChange={(e) => set('strategist', e.target.value)}>
              {strategists.map((s) => <option key={s.name} value={s.name}>{s.name} ({s.abbr})</option>)}
            </select>
          </div>

          <div className="field">
            <label>Date</label>
            <input type="date" value={edit.date} onChange={(e) => set('date', e.target.value)} />
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

          <div className="field">
            <label>{config.fieldLabels.page}</label>
            <select value={edit.facebookPage} onChange={(e) => set('facebookPage', e.target.value)}>
              {config.pages.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>

          <div className="field">
            <label>{config.fieldLabels.landingPage}</label>
            <Choices field="landingPage" options={config.landingPages} />
          </div>

          <div className="field">
            <label>{config.fieldLabels.adConcept}</label>
            <input type="text" placeholder="Describe the ad concept…" value={edit.adConcept} onChange={(e) => set('adConcept', e.target.value)} />
          </div>

          <div className="field">
            <label>{config.fieldLabels.angle}</label>
            <input type="text" placeholder="What's the angle?" value={edit.angle} onChange={(e) => set('angle', e.target.value)} />
          </div>

          <div className="field">
            <label>{config.fieldLabels.formatType}</label>
            <input type="text" placeholder="e.g. AI Animated, Broll + VO, UGC-Style…" value={edit.formatType} onChange={(e) => set('formatType', e.target.value)} />
          </div>

          <div className="field">
            <label>{config.fieldLabels.postId}</label>
            <input type="text" placeholder="Facebook Post ID…" value={edit.postId} onChange={(e) => set('postId', e.target.value)} />
          </div>

          <div className="field">
            <label>{config.fieldLabels.learnings}</label>
            <textarea placeholder="Key learnings from this batch…" value={edit.learnings} onChange={(e) => set('learnings', e.target.value)} rows={3} style={{ width: '100%', resize: 'vertical' }} />
          </div>

          <div className="field">
            <label>{config.fieldLabels.scriptLink}</label>
            <input type="url" placeholder="Paste link…" value={edit.scriptLink} onChange={(e) => set('scriptLink', e.target.value)} />
          </div>
          <div className="field">
            <label>{config.fieldLabels.finalVideoLink}</label>
            <input type="url" placeholder="Paste link…" value={edit.finalVideoLink} onChange={(e) => set('finalVideoLink', e.target.value)} />
          </div>
          <div className="field">
            <label>{config.fieldLabels.ugcAssetsLink}</label>
            <input type="url" placeholder="Paste link…" value={edit.ugcAssetsLink} onChange={(e) => set('ugcAssetsLink', e.target.value)} />
          </div>

          {transitions.length > 0 && (
            <div className="card-actions" style={{ borderTop: 'none', paddingTop: 0 }}>
              {transitions.map((t) => (
                <button key={t.to + t.label} className="btn-action primary" onClick={() => { onClose(); onAction(brief, t) }}>
                  {t.label}
                </button>
              ))}
            </div>
          )}

          <div className="history">
            <h3>History</h3>
            {[...(brief.history || [])].reverse().map((h, i) => (
              <div className="hist-item" key={i}>
                <span className="dot" style={{ background: config.statuses[h.status]?.color || '#666' }} />
                <div>
                  <div>
                    <b>{config.statuses[h.status]?.label || h.status}</b>
                    <span className="meta"> — {h.by}, {new Date(h.at).toLocaleString()}</span>
                  </div>
                  {h.note && <div className="note">"{h.note}"</div>}
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="modal-foot" style={{ display: 'flex', gap: 10 }}>
          <button className="btn-primary" onClick={save}>Save Changes</button>
          <button
            className="btn-small"
            style={{ color: '#E85040' }}
            onClick={() => { if (confirm('Delete this brief?')) onDelete(brief.id) }}
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  )
}
