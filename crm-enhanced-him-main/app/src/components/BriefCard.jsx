import { fmtDate, ageDays } from '../lib/helpers'

export default function BriefCard({ brief, config, onOpen, onAction }) {
  const transitions = config.transitions[brief.status] || []
  const days = ageDays(brief.updatedAt || brief.createdAt)
  const ageClass = days >= 5 ? 'late' : days >= 2 ? 'warn' : ''
  const latestNote = [...(brief.history || [])].reverse().find((h) => h.note)?.note

  return (
    <div className="card" onClick={() => onOpen(brief)}>
      <span className={`age ${ageClass}`}>{days}d</span>
      <div className="card-top">
        <div className="card-name">{brief.name}</div>
        <span className="badge type">{brief.type}</span>
      </div>
      {brief.angle && <div className="card-angle">{brief.angle}</div>}
      {latestNote && brief.status === 'script_revision' && (
        <div className="card-note">“{latestNote}”</div>
      )}
      <div className="pills">
        <span className="pill stage">{brief.awarenessStage}</span>
        {brief.formatType && <span className="pill">{brief.formatType}</span>}
        {brief.persona && <span className="pill">Persona {brief.persona}</span>}
        <span className="pill" style={{ color: config.statuses[brief.status]?.color }}>
          {config.statuses[brief.status]?.label}
        </span>
      </div>
      <div className="card-meta">
        <span>
          {brief.strategist}
          {brief.assignedTo ? ` → ${brief.assignedTo}` : ''}
        </span>
        <span>{fmtDate(brief.date)}</span>
      </div>
      <div className="chips">
        {brief.facebookPage && <span className="chip" title={brief.facebookPage}>{brief.facebookPage}</span>}
        {brief.landingPage && <span className="chip lp">{brief.landingPage}</span>}
      </div>
      {brief.scriptLink && (
        <a
          className="card-link"
          href={brief.scriptLink}
          target="_blank"
          rel="noreferrer"
          onClick={(e) => e.stopPropagation()}
        >
          ↗ View Brief
        </a>
      )}
      {transitions.length > 0 && (
        <div className="card-actions" onClick={(e) => e.stopPropagation()}>
          {transitions.map((t) => (
            <button key={t.to + t.label} className="btn-action" onClick={() => onAction(brief, t)}>
              {t.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
