import { useState } from 'react'
import {
  AD_TYPES,
  UNASSIGNED_EDITOR,
  allowedTransitions,
  applyNamingPatch,
  buildEditorFilename,
  canCreateBriefs,
  canDeleteBriefs,
  displayName,
  fmtDate,
} from '../lib/helpers'
import NamingFields from './NamingFields'
import CopyName from './CopyName'

export default function BriefDetail({ config, user, brief, briefs = [], onClose, onSave, onDelete, onAction, onDuplicate, onRememberName }) {
  const [edit, setEdit] = useState({
    date: brief?.date || '',
    persona: brief?.persona || '',
    funnel: brief?.funnel || '',
    awareness: brief?.awareness || brief?.awarenessStage || '',
    type: brief?.type || '',
    formatType: brief?.formatType || '',
    facebookPage: brief?.facebookPage || '',
    landingPage: brief?.landingPage || '',
    adConcept: brief?.adConcept || '',
    angle: brief?.angle || '',
    adType: brief?.adType || '',
    launchedDate: brief?.launchedDate || '',
    strategist: brief?.strategist || '',
    editor: brief?.editor || brief?.assignedTo || UNASSIGNED_EDITOR,
    hookNumber: brief?.hookNumber || 1,
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
  const draft = { ...brief, ...edit, awarenessStage: edit.awareness }
  const preview = displayName(draft)
  const editorFilename = buildEditorFilename(draft)

  const save = () => {
    if (edit.strategist) onRememberName?.('strategist', edit.strategist)
    if (edit.editor) onRememberName?.('editor', edit.editor)
    onSave(applyNamingPatch(brief, { ...edit, awarenessStage: edit.awareness }, { by: user.name, config, briefs }))
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
          <div className="modal-title-name">
            <h2 style={{ fontSize: 14, fontFamily: 'ui-monospace, monospace' }}>{preview}</h2>
            <CopyName value={preview} />
            <CopyName value={editorFilename} label="Copy file" title="Copy editor filename" />
          </div>
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
            <div className="detail-item"><div className="k">{config.fieldLabels.launchedDate}</div><div className="v">{edit.launchedDate ? fmtDate(edit.launchedDate) : (brief.launchedAt ? fmtDate(brief.launchedAt) : '—')}</div></div>
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

          <NamingFields
            config={config}
            briefs={briefs}
            value={draft}
            showPreview={false}
            onChange={(next) => setEdit((e) => ({
              ...e,
              strategist: next.strategist,
              editor: next.editor || UNASSIGNED_EDITOR,
              hookNumber: next.hookNumber || 1,
              type: next.type,
              formatType: next.formatType,
              funnel: next.funnel,
              awareness: next.awareness || next.awarenessStage || '',
              persona: next.persona,
            }))}
            onAddPerson={(role, name) => onRememberName?.(role === 'video_editor' ? 'editor' : 'strategist', name)}
          />

          <div className="field">
            <label>Date</label>
            <input type="date" value={edit.date} onChange={(e) => set('date', e.target.value)} />
          </div>

          <div className="field">
            <label>{config.fieldLabels.launchedDate}</label>
            <input type="date" value={edit.launchedDate} onChange={(e) => set('launchedDate', e.target.value)} />
          </div>

          <div className="field">
            <label>{config.fieldLabels.adType}</label>
            <Choices field="adType" options={config.adTypes || AD_TYPES} />
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
            <input type="text" placeholder="Short concept label…" value={edit.adConcept} onChange={(e) => set('adConcept', e.target.value)} />
          </div>

          <div className="field">
            <label>{config.fieldLabels.angle}</label>
            <textarea
              placeholder="Full creative write-up / angle…"
              value={edit.angle}
              onChange={(e) => set('angle', e.target.value)}
              rows={6}
            />
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
          {onDuplicate && canCreateBriefs(user?.role, config) && (
            <button className="btn-small" onClick={() => { onDuplicate(brief); onClose() }}>Duplicate</button>
          )}
          {canDeleteBriefs(user?.role, config) && (
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
