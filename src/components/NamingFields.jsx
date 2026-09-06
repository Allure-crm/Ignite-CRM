import {
  UNASSIGNED_EDITOR,
  buildCsName,
  buildEditorFilename,
  editorNames,
  formatTypeOptionsFor,
  strategistNames,
} from '../lib/helpers'
import CopyName from './CopyName'

export default function NamingFields({
  config,
  briefs,
  value,
  onChange,
  onAddPerson,
  showPreview = true,
}) {
  const set = (key, next) => {
    onChange({
      ...value,
      [key]: next,
      ...(key === 'type' ? { formatType: '' } : {}),
    })
  }

  const addPerson = (role, label) => {
    const typed = window.prompt(`Add a new ${label.toLowerCase()} name`)
    const name = String(typed || '').trim()
    if (!name) return
    onAddPerson?.(role, name)
    set(role === 'video_editor' ? 'editor' : 'strategist', name)
  }

  const csName = buildCsName(value)
  const fileName = buildEditorFilename(value)
  const formatOptions = formatTypeOptionsFor(config, value.type, value.formatType ? [value.formatType] : [])

  return (
    <>
      {showPreview && (
        <>
          <div className="name-preview">
            <div className="label">CS Name (auto-generated)</div>
            <div className="value copy-value">
              <span>{csName || 'Choose CS, editor, and date to build the CS Name…'}</span>
              <CopyName value={csName} />
            </div>
          </div>
          <div className="name-preview">
            <div className="label">Editor filename</div>
            <div className="value copy-value">
              <span>{fileName || 'CS Name + _Hook_#'}</span>
              <CopyName value={fileName} label="Copy file" title="Copy editor filename" />
            </div>
          </div>
        </>
      )}

      <PersonSelect
        label={config.fieldLabels.strategist || 'Strategist'}
        value={value.strategist || ''}
        options={strategistNames(config, briefs)}
        onChange={(v) => set('strategist', v)}
        onAdd={() => addPerson('creative_strategist', 'Strategist')}
      />
      <PersonSelect
        label={config.fieldLabels.editor || 'Editor'}
        value={value.editor || UNASSIGNED_EDITOR}
        options={editorNames(config, briefs)}
        onChange={(v) => set('editor', v || UNASSIGNED_EDITOR)}
        onAdd={() => addPerson('video_editor', 'Editor')}
      />
      <div className="field">
        <label>Hook #</label>
        <input
          type="number"
          min="1"
          step="1"
          value={value.hookNumber || 1}
          onChange={(e) => set('hookNumber', Math.max(1, Number(e.target.value) || 1))}
        />
      </div>
      <FieldSelect
        label={config.fieldLabels.type}
        value={value.type || ''}
        options={config.types}
        onChange={(v) => set('type', v)}
      />
      <FieldSelect
        label={config.fieldLabels.formatType}
        value={value.formatType || ''}
        options={formatOptions}
        disabled={!value.type}
        onChange={(v) => set('formatType', v)}
      />
      <FieldSelect
        label={config.fieldLabels.funnel || 'Funnel'}
        value={value.funnel || ''}
        options={config.funnels || []}
        onChange={(v) => set('funnel', v)}
      />
      <FieldSelect
        label={config.fieldLabels.awarenessStage}
        value={value.awareness || value.awarenessStage || ''}
        options={config.awarenessStages}
        onChange={(v) => set('awareness', v)}
      />
      <FieldSelect
        label={`${config.fieldLabels.persona} (optional)`}
        value={value.persona || ''}
        options={config.personas}
        onChange={(v) => set('persona', v)}
      />
    </>
  )
}

function PersonSelect({ label, value, options, onChange, onAdd }) {
  return (
    <div className="field">
      <label>{label}</label>
      <select
        value={value}
        onChange={(e) => {
          if (e.target.value === '__add_new__') {
            onAdd?.()
            return
          }
          onChange(e.target.value)
        }}
      >
        {!value && <option value="">Select…</option>}
        {options.map((option) => (
          <option key={option} value={option}>{option}</option>
        ))}
        <option value="__add_new__">+ Add new name…</option>
      </select>
    </div>
  )
}

function FieldSelect({ label, value, options, onChange, disabled = false }) {
  return (
    <div className="field">
      <label>{label}</label>
      <select value={value} disabled={disabled} onChange={(e) => onChange(e.target.value)}>
        <option value="">Select…</option>
        {options.map((option) => (
          <option key={option} value={option}>{option}</option>
        ))}
      </select>
    </div>
  )
}
