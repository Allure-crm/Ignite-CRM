export default function SwitchUser({ config, onPick }) {
  return (
    <div className="overlay" style={{ background: 'var(--bg)' }}>
      <div className="modal wide">
        <div className="modal-head">
          <h2>
            <span style={{ color: 'var(--accent2)', fontWeight: 800, letterSpacing: 2 }}>{config.brandName}</span>
            {' '}— Who are you?
          </h2>
        </div>
        <div className="modal-body">
          <div className="user-grid">
            {config.users.map((u) => (
              <div className="user-card" key={u.name} onClick={() => onPick(u)}>
                <div className="avatar">{u.abbr || u.name[0]}</div>
                <div>
                  <div style={{ fontWeight: 600 }}>{u.name}</div>
                  <div style={{ color: 'var(--muted)', fontSize: 12 }}>{config.roles[u.role]?.label || u.role}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
