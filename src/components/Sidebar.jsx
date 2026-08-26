import { canCreateBriefs, roleQueue, TRACKER_ROLES } from '../lib/helpers'

export default function Sidebar({ config, user, view, briefs, onView, onNewBrief, onManageLists, onSwitchUser, isSupabase, storeError }) {
  const queue = roleQueue(config, user.role)
  const countFor = (status) => briefs.filter((b) => b.status === status).length
  const launchedCount = briefs.filter((b) => b.status === 'launched').length
  const showTracker = TRACKER_ROLES.includes(user.role)
  const showQueue = queue.length > 0

  return (
    <aside className="sidebar">
      <div className="logo">
        <span className="name">{config.brandName}</span>
        <span className="tag">{config.brandTagline}</span>
      </div>
      <div className="userchip">
        <div className="avatar">{user.abbr || user.name[0]}</div>
        <div>
          <div className="uname">{user.name}</div>
          <div className="urole">{config.roles[user.role]?.label || user.role}</div>
        </div>
      </div>

      {canCreateBriefs(user.role) && (
        <button className="btn-primary" onClick={onNewBrief}>+ New Brief</button>
      )}

      {showQueue && (
        <div className="nav-section">
          <div className="nav-label">My Queue</div>
          {queue.map((status) => (
            <button
              key={status}
              className={`nav-item ${view === status ? 'active' : ''}`}
              onClick={() => onView(status)}
            >
              <span className="dot" style={{ background: config.statuses[status]?.color }} />
              {config.statuses[status]?.label || status}
              <span className="count">{countFor(status)}</span>
            </button>
          ))}
        </div>
      )}

      <div className="nav-section">
        <div className="nav-label">Overview</div>
        <button className={`nav-item ${view === 'summary' ? 'active' : ''}`} onClick={() => onView('summary')}>
          ▤ Summary
        </button>
        <button className={`nav-item ${view === 'all' ? 'active' : ''}`} onClick={() => onView('all')}>
          ▦ All Briefs <span className="count">{briefs.length}</span>
        </button>
        <button className={`nav-item ${view === 'launched' ? 'active' : ''}`} onClick={() => onView('launched')}>
          🚀 Launched <span className="count">{launchedCount}</span>
        </button>
        {showTracker && (
          <button className={`nav-item ${view === 'tracker' ? 'active' : ''}`} onClick={() => onView('tracker')}>
            📊 Tracker <span className="count">{briefs.length}</span>
          </button>
        )}
        {showTracker && (
          <button className={`nav-item ${view === 'intake' ? 'active' : ''}`} onClick={() => onView('intake')}>
            📋 Weekly Intake
          </button>
        )}
      </div>

      <div className="spacer" />
      <div className="footer">
        <button className="nav-item" onClick={onManageLists}>⚙ Manage Lists</button>
        <button className="nav-item" onClick={onSwitchUser}>⇄ Switch User</button>
        <div className="sync-banner">
          Data: <b>{isSupabase ? 'Supabase (team sync)' : 'this browser only'}</b>
        </div>
        {storeError && (
          <div className="store-error" role="alert">{storeError}</div>
        )}
      </div>
    </aside>
  )
}
