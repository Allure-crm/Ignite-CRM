import { useState } from 'react'
import {
  UNASSIGNED_EDITOR,
  allowedTransitions,
  angleOptions,
  applyNamingPatch,
  buildCsName,
  canCreateBriefs,
  canDeleteBriefs,
  editorNames,
  fmtDate,
  strategistNames,
} from '../lib/helpers'
import FormatTypeField from './FormatTypeField'
import CreatableSelect from './CreatableSelect'
import CsName from './CsName'

export default function BriefDetail({ config, user, brief, briefs = [], onClose, onSave, onDelete, onAction, onDuplicate, onRememberName }) {
  const [edit, setEdit] = useState({
    date: brief?.date || '',
    persona: brief?.persona || '',
    funnel: brief?.funnel || '',
    awareness: brief?.awareness || '',
    type: brief?.type || '',
    formatType: brief?.formatType || '',
    facebookPage: brief?.facebookPage || '',
    landingPage: brief?.landingPage || '',
    adConcept: brief?.adConcept || '',
    angle: brief?.angle || '',
    strategist: brief?.strategist || '',
    editor: brief?.editor || brief?.assignedTo || UNASSIGNED_EDITOR,
    scriptLink: brief?.scriptLink || '',
    finalVideoLink: brief?.finalVideoLink || '',
    ugcAssetsLink: brief?.ugcAssetsLink || '',
    postId: brief?.postId || '',
    learnings: brief?.learnings || '',
    result: brief?.result || '',
  })
  if (!brief) return null

  const transitions = allowedTransitions(config, brief.status, user?.role)
  const set = (k, v) => setEdit((e) => {
    const next = { ...e, [k]: v }
    if (k === 'type' && v !== e.type) next.formatType = ''
    return next
  })
  const latestNote = [...(brief.history || [])].reverse().find((h) => h.note)
  const preview = buildCsName({ ...brief, ...edit, nameIsCopy: false })

  const save = () => {
    if (edit.strategist) onRememberName?.('strategist', edit.strategist)
    if (edit.editor) onRememberName?.('editor', edit.editor)
    if (edit.angle) onRememberName?.('angle', edit.angle)
    onSave(applyNamingPatch(brief, { ...edit, awarenessStage: edit.awareness }, { by: user.name, config }))
    onClose()
  }

  const Choices = ({ field, options }) => (
    <div className="choice-row">
      {options.map((o) => (
        <button type="button" key={o} className={`choice ${edit[field] === o ? 'selected' : ''}`} onClick={() => set(field, o)}>
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
          <CsName value={preview} />

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

          <CreatableSelect
            label="Creative Strategist"
            value={edit.strategist}
            options={strategistNames(config, briefs)}
            onChange={(v) => set('strategist', v)}
          />

          <CreatableSelect
            label={config.fieldLabels.editor}
            value={edit.editor}
            options={editorNames(config, briefs)}
            onChange={(v) => set('editor', v || UNASSIGNED_EDITOR)}
          />

          <div className="field">
            <label>Date</label>
            <input type="date" value={edit.date} onChange={(e) => set('date', e.target.value)} />
          </div>

          <div className="field">
            <label>{config.fieldLabels.type}</label>
            <Choices field="type" options={config.types} />
          </div>

          <FormatTypeField
            config={config}
            format={edit.type}
            value={edit.formatType}
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
            <input
              type="text"
              list="detail-angles"
              placeholder="What's the angle?"
              value={edit.angle}
              onChange={(e) => set('angle', e.target.value)}
            />
            <datalist id="detail-angles">
              {angleOptions(config, briefs).map((o) => <option key={o} value={o} />)}
            </datalist>
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
            {edit.scriptLink && (
              <a className="field-open-link" href={edit.scriptLink} target="_blank" rel="noreferrer">↗ View Brief</a>
            )}
          </div>
          <div className="field">
            <label>{config.fieldLabels.finalVideoLink}</label>
            <input type="url" placeholder="Paste link…" value={edit.finalVideoLink} onChange={(e) => set('finalVideoLink', e.target.value)} />
            {edit.finalVideoLink && (
              <a className="field-open-link" href={edit.finalVideoLink} target="_blank" rel="noreferrer">↗ View Asset</a>
            )}
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
                <span className="dot" style={{ background: h.kind === 'editor' ? '#fb923c' : (config.statuses[h.status]?.color || '#666') }} />
                <div>
                  <div>
                    <b>{h.kind === 'editor' ? 'Editor assignment' : (config.statuses[h.status]?.label || h.status)}</b>
                    <span className="meta"> — {h.by}, {new Date(h.at).toLocaleString()}</span>
                  </div>
                  {h.kind === 'editor' && (
                    <div className="note">{h.from || 'Unassigned'} → {h.to}</div>
                  )}
                  {h.note && h.kind !== 'editor' && <div className="note">"{h.note}"</div>}
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="modal-foot" style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button className="btn-primary" onClick={save}>Save Changes</button>
          {onDuplicate && canCreateBriefs(user?.role) && (
            <button className="btn-small" onClick={() => { onDuplicate(brief); onClose() }}>Duplicate</button>
          )}
          {canDeleteBriefs(user?.role) && (
            <button
              className="btn-small"
              style={{ color: '#E85040' }}
              onClick={() => { if (confirm('Delete this brief?')) onDelete(brief.id) }}
            >
              Delete
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
