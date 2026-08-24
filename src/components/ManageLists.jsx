import { useState } from 'react'

// Manage Lists + Brand Settings. Edits are saved as runtime overrides on
// top of brand.config.js and sync via the active data store.
export default function ManageLists({ config, overrides, onClose, onSave }) {
  const [tab, setTab] = useState('personas')
  const [draft, setDraft] = useState({
    personas: config.personas,
    pages: config.pages,
    landingPages: config.landingPages,
    types: config.types,
    formatTypes: config.formatTypes || [],
    users: config.users,
    brandName: config.brandName,
    brandTagline: config.brandTagline,
    accentColor: config.accentColor,
    accentColor2: config.accentColor2,
  })
  const [input, setInput] = useState('')
  const defaultRole = Object.keys(config.roles)[0] || 'creative_strategist'
  const [newUser, setNewUser] = useState({ name: '', role: defaultRole, abbr: '' })

  const set = (k, v) => setDraft((d) => ({ ...d, [k]: v }))

  const listTabs = [
    { key: 'personas', label: config.fieldLabels.persona + 's' },
    { key: 'pages', label: config.fieldLabels.page + 's' },
    { key: 'landingPages', label: config.fieldLabels.landingPage + 's' },
    { key: 'types', label: 'Formats' },
    { key: 'formatTypes', label: 'Format Types' },
    { key: 'team', label: 'Team' },
    { key: 'brand', label: 'Brand' },
  ]

  const addItem = () => {
    const v = input.trim()
    if (!v || draft[tab].includes(v)) return
    set(tab, [...draft[tab], v])
    setInput('')
  }

  const save = () => {
    onSave({ ...overrides, ...draft })
    onClose()
  }

  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal wide" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h2>Manage Lists & Brand</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="tabs">
          {listTabs.map((t) => (
            <button key={t.key} className={`tab ${tab === t.key ? 'active' : ''}`} onClick={() => setTab(t.key)}>
              {t.label}
            </button>
          ))}
        </div>
        <div className="modal-body">
          {['personas', 'pages', 'landingPages', 'types', 'formatTypes'].includes(tab) && (
            <>
              <div className="add-row">
                <input
                  type="text"
                  className="search"
                  style={{ width: '100%' }}
                  placeholder="Add new…"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addItem()}
                />
                <button className="btn-small" onClick={addItem}>+ Add</button>
              </div>
              {draft[tab].map((item) => (
                <div className="list-item" key={item}>
                  {item}
                  <button className="del" onClick={() => set(tab, draft[tab].filter((x) => x !== item))}>✕</button>
                </div>
              ))}
            </>
          )}

          {tab === 'team' && (
            <>
              <div className="add-row">
                <input type="text" className="search" style={{ flex: 2 }} placeholder="Name" value={newUser.name}
                  onChange={(e) => setNewUser({ ...newUser, name: e.target.value })} />
                <input type="text" className="search" style={{ width: 70 }} placeholder="Abbr" maxLength={3} value={newUser.abbr}
                  onChange={(e) => setNewUser({ ...newUser, abbr: e.target.value.toUpperCase() })} />
                <select className="search" value={newUser.role} onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}>
                  {Object.entries(config.roles).map(([k, r]) => <option key={k} value={k}>{r.label}</option>)}
                </select>
                <button className="btn-small" onClick={() => {
                  if (!newUser.name.trim()) return
                  set('users', [...draft.users, { ...newUser, name: newUser.name.trim(), abbr: newUser.abbr || newUser.name.slice(0, 2).toUpperCase() }])
                  setNewUser({ name: '', role: defaultRole, abbr: '' })
                }}>+ Add</button>
              </div>
              {draft.users.map((u) => (
                <div className="list-item" key={u.name}>
                  <b>{u.name}</b>
                  <span className="sub">{u.abbr} · {config.roles[u.role]?.label || u.role}</span>
                  <button className="del" onClick={() => set('users', draft.users.filter((x) => x.name !== u.name))}>✕</button>
                </div>
              ))}
            </>
          )}

          {tab === 'brand' && (
            <>
              <div className="field">
                <label>Brand name</label>
                <input type="text" value={draft.brandName} onChange={(e) => set('brandName', e.target.value)} />
              </div>
              <div className="field">
                <label>Tagline</label>
                <input type="text" value={draft.brandTagline} onChange={(e) => set('brandTagline', e.target.value)} />
              </div>
              <div className="field">
                <label>Accent color</label>
                <input type="color" value={draft.accentColor} onChange={(e) => set('accentColor', e.target.value)} style={{ width: 60, height: 36, background: 'none', border: '1px solid var(--border)', borderRadius: 8 }} />
              </div>
              <div className="field">
                <label>Accent color 2 (gradient end)</label>
                <input type="color" value={draft.accentColor2} onChange={(e) => set('accentColor2', e.target.value)} style={{ width: 60, height: 36, background: 'none', border: '1px solid var(--border)', borderRadius: 8 }} />
              </div>
              <p style={{ color: 'var(--faint)', fontSize: 12 }}>
                For permanent per-brand defaults (and field renames like "{config.fieldLabels.page}"), edit <code>src/brand.config.js</code>.
              </p>
            </>
          )}
        </div>
        <div className="modal-foot">
          <button className="btn-primary" onClick={save}>Save Changes</button>
        </div>
      </div>
    </div>
  )
}
