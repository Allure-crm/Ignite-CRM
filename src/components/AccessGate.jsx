import { useState } from 'react'
import baseConfig from '../brand.config.js'

export default function AccessGate({ config, onUnlock }) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const submit = (e) => {
    e.preventDefault()
    if (password === baseConfig.accessPassword) {
      setError('')
      onUnlock()
      return
    }
    setError('Wrong password')
    setPassword('')
  }

  return (
    <div className="overlay" style={{ background: 'var(--bg)' }}>
      <div className="modal">
        <div className="modal-head">
          <h2>
            <span style={{ color: 'var(--accent2)', fontWeight: 800, letterSpacing: 2 }}>{config.brandName}</span>
          </h2>
        </div>
        <form onSubmit={submit}>
          <div className="modal-body">
            <p className="access-copy">Enter the team password once on this device. You will stay signed in here until you clear this browser.</p>
            <div className="field">
              <label>Password</label>
              <input
                type="password"
                autoFocus
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError('') }}
                placeholder="Password"
              />
            </div>
            {error && <div className="access-error">{error}</div>}
          </div>
          <div className="modal-foot">
            <button className="btn-primary" type="submit">Enter</button>
          </div>
        </form>
      </div>
    </div>
  )
}
