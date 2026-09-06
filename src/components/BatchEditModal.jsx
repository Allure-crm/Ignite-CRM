import { useMemo, useState } from 'react'
import {
  UNASSIGNED_EDITOR,
  applyNamingPatches,
  batchNamingPreview,
  editorNames,
  formatTypeOptionsFor,
  strategistNames,
} from '../lib/helpers'
import FormatTypeField from './FormatTypeField'

const EMPTY = '__keep__'

export default function BatchEditModal({ config, briefs, selected, onClose, onApply, user }) {
  const targets = briefs.filter((b) => selected.has(b.id))
  const [patch, setPatch] = useState({})
  const set = (k, v) => setPatch((p) => {
    const next = { ...p }
    if (v === EMPTY || v === undefined) delete next[k]
    else next[k] = v
    if (k === 'type') {
      if (next.formatType && !formatTypeOptionsFor(config, next.type).includes(next.formatType)) {
        delete next.formatType
      }
    }
    return next
  })

  const preview = useMemo(
    () => batchNamingPreview(targets, patch, { config, briefs }),
    [targets, patch, config, briefs]
  )
  const hasPatch = Object.keys(patch).length > 0
  const changed = preview.filter((row) => row.oldName !== row.newName)

  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal wide" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h2>Batch update naming ({targets.length})</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <p className="batch-help">Leave a field on “Keep current” to skip it. New briefs use CS_Editor_Month_Batch_# (per strategist, resets each month). Existing briefs keep their original naming scheme.</p>

          <div className="batch-fields">
            <FieldSelect
              label="Strategist"
              value={patch.strategist ?? EMPTY}
              onChange={(v) => set('strategist', v)}
              options={strategistNames(config, briefs)}
            />
            <FieldSelect
              label="Editor"
              value={patch.editor ?? EMPTY}
              onChange={(v) => set('editor', v)}
              options={editorNames(config, briefs)}
            />
            <FieldSelect
              label={config.fieldLabels.type}
              value={patch.type ?? EMPTY}
              onChange={(v) => set('type', v)}
              options={config.types}
            />
            {patch.type ? (
              <FormatTypeField
                config={config}
                format={patch.type}
                value={patch.formatType || ''}
                onChange={(v) => set('formatType', v)}
              />
            ) : (
              <div className="field">
                <label>{config.fieldLabels.formatType}</label>
                <div className="field-hint">Choose a format to batch-set format type</div>
              </div>
            )}
            <FieldSelect
              label={config.fieldLabels.funnel}
              value={patch.funnel ?? EMPTY}
              onChange={(v) => set('funnel', v)}
              options={config.funnels}
            />
            <FieldSelect
              label={config.fieldLabels.awarenessStage}
              value={patch.awareness ?? EMPTY}
              onChange={(v) => set('awareness', v)}
              options={config.awarenessStages}
            />
            <FieldSelect
              label={config.fieldLabels.persona}
              value={patch.persona ?? EMPTY}
              onChange={(v) => set('persona', v)}
              options={config.personas}
            />
            <FieldSelect
              label={config.fieldLabels.adType}
              value={patch.adType ?? EMPTY}
              onChange={(v) => set('adType', v)}
              options={config.adTypes || []}
            />
            <div className="field">
              <label>{config.fieldLabels.angle}</label>
              <textarea
                placeholder="Keep current, or paste a new write-up"
                value={patch.angle ?? ''}
                onChange={(e) => set('angle', e.target.value === '' ? EMPTY : e.target.value)}
                rows={4}
              />
            </div>
          </div>

          <div className="batch-preview">
            <h3>Confirmation preview</h3>
            {!hasPatch && <div className="field-hint">Choose at least one field to see name changes.</div>}
            {hasPatch && changed.length === 0 && <div className="field-hint">Fields will update. CS names stay the same.</div>}
            {changed.map((row) => (
              <div className="batch-preview-row" key={row.id}>
                <span className="old">{row.oldName || '(untitled)'}</span>
                <span className="arrow">→</span>
                <span className="new">{row.newName || '(untitled)'}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="modal-foot" style={{ display: 'flex', gap: 10 }}>
          <button
            className="btn-primary"
            disabled={!hasPatch}
            style={{ opacity: hasPatch ? 1 : 0.45 }}
            onClick={() => onApply(applyNamingPatches(targets, patch, { config, by: user?.name, briefs }))}
          >
            Apply to {targets.length} brief{targets.length === 1 ? '' : 's'}
          </button>
          <button className="btn-small" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  )
}

function FieldSelect({ label, value, options, onChange }) {
  return (
    <div className="field">
      <label>{label}</label>
      <select value={value} onChange={(e) => onChange(e.target.value)}>
        <option value={EMPTY}>Keep current</option>
        {options.map((o) => <option key={o} value={o}>{o === UNASSIGNED_EDITOR ? o : o}</option>)}
      </select>
    </div>
  )
}
