import { useState } from 'react'

export default function CreatableSelect({
  label,
  value,
  options,
  onChange,
  placeholder = 'Select…',
  allowCreate = true,
}) {
  const [adding, setAdding] = useState(false)
  const [draft, setDraft] = useState('')
  const list = options || []
  const known = list.some((o) => o === value)

  const commit = () => {
    const next = draft.trim()
    if (!next) return
    onChange(next)
    setDraft('')
    setAdding(false)
  }

  return (
    <div className="field">
      {label && <label>{label}</label>}
      {adding ? (
        <div className="add-row">
          <input
            type="text"
            autoFocus
            placeholder="Add a new name…"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commit()
              if (e.key === 'Escape') { setAdding(false); setDraft('') }
            }}
          />
          <button type="button" className="btn-small" onClick={commit}>Add</button>
          <button type="button" className="btn-small" onClick={() => { setAdding(false); setDraft('') }}>Cancel</button>
        </div>
      ) : (
        <select
          value={known ? value : (value || '')}
          onChange={(e) => {
            if (e.target.value === '__add__') {
              setAdding(true)
              return
            }
            onChange(e.target.value)
          }}
        >
          <option value="">{placeholder}</option>
          {!known && value ? <option value={value}>{value}</option> : null}
          {list.map((o) => (
            <option key={o} value={o}>{o}</option>
          ))}
          {allowCreate && <option value="__add__">+ Add new…</option>}
        </select>
      )}
    </div>
  )
}
