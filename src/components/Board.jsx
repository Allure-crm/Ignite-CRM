import BriefCard from './BriefCard'

export default function Board({ config, user, view, briefs, search, onSearch, onOpen, onAction }) {
  const q = search.trim().toLowerCase()
  const matches = (b) =>
    !q ||
    [b.name, b.persona, b.strategist, b.facebookPage, b.landingPage, b.assignedTo]
      .filter(Boolean).some((s) => s.toLowerCase().includes(q))

  const filtered = briefs.filter(matches)
  const statusKeys = Object.keys(config.statuses)

  let title, body
  if (view === 'all') {
    title = 'All Briefs'
    const visible = statusKeys.filter((s) => s !== 'launched')
    body = (
      <div className="kanban">
        {visible.map((status) => {
          const lane = filtered.filter((b) => b.status === status)
          return (
            <div className="lane" key={status}>
              <div className="lane-head">
                <span className="dot" style={{ width: 8, height: 8, borderRadius: '50%', background: config.statuses[status].color }} />
                {config.statuses[status].label}
                <span className="count">{lane.length}</span>
              </div>
              {lane.length === 0 && <div className="lane-empty">No briefs</div>}
              {lane.map((b) => (
                <BriefCard key={b.id} brief={b} config={config} user={user} onOpen={onOpen} onAction={onAction} />
              ))}
            </div>
          )
        })}
      </div>
    )
  } else {
    const isLaunched = view === 'launched'
    const status = isLaunched ? 'launched' : view
    title = config.statuses[status]?.label || 'Briefs'
    const lane = filtered.filter((b) => b.status === status)
    body = lane.length === 0 ? (
      <div className="empty-state">
        <div className="icon">📄</div>
        <h3>No briefs here</h3>
        <p>{user.role === 'video_editor' ? 'Nothing in this lane right now.' : 'Click "New Brief" in the sidebar to create your first brief.'}</p>
      </div>
    ) : (
      <div className="cards-grid">
        {lane.map((b) => (
          <BriefCard key={b.id} brief={b} config={config} user={user} onOpen={onOpen} onAction={onAction} />
        ))}
      </div>
    )
  }

  const count = view === 'all' ? filtered.length : filtered.filter((b) => b.status === (view === 'launched' ? 'launched' : view)).length

  return (
    <main className="main">
      <div className="topbar">
        <div>
          <h1>{title}</h1>
          <div className="sub">{count} brief{count === 1 ? '' : 's'}</div>
        </div>
        <input
          className="search"
          placeholder="Search briefs…"
          value={search}
          onChange={(e) => onSearch(e.target.value)}
        />
      </div>
      <div className="content">{body}</div>
    </main>
  )
}
