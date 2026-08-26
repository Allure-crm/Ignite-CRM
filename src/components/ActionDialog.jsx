import { useState } from 'react'
import CsName from './CsName'

// Prompts for an assignee and/or a revision note before a transition runs.
export default function ActionDialog({ config, brief, transition, onClose, onConfirm }) {
  const candidates = transition.needsAssignment
    ? config.users.filter((u) => (transition.assignRoles || []).includes(u.role))
    : []
  const [assignTo, setAssignTo] = useState(candidates[0]?.name || '')
  const [note, setNote] = useState('')

  const ready = (!transition.needsAssignment || assignTo) && (!transition.needsNote || note.trim())

  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h2>{transition.label}</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <CsName value={brief.name} />
          {transition.needsAssignment && (
            <div className="field">
              <label>Assign to</label>
              <select value={assignTo} onChange={(e) => setAssignTo(e.target.value)}>
                {candidates.map((u) => (
                  <option key={u.name} value={u.name}>
                    {u.name} ({config.roles[u.role]?.label || u.role})
                  </option>
                ))}
              </select>
            </div>
          )}
          {transition.needsNote && (
            <div className="field">
              <label>{transition.noteLabel || 'Revision note'}</label>
              <textarea
                rows={4}
                placeholder={transition.notePlaceholder || 'What needs to change…'}
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </div>
          )}
        </div>
        <div className="modal-foot">
          <button
            className="btn-primary"
            disabled={!ready}
            style={{ opacity: ready ? 1 : 0.45 }}
            onClick={() => onConfirm({ brief, transition, note: note.trim(), assignTo })}
          >
            {transition.confirmLabel || 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  )
}
