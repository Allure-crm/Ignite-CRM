import { useState } from 'react'

export default function CsName({ value, placeholder = 'Name builds as fields are filled…', compact = false }) {
  const [copied, setCopied] = useState(false)
  const text = String(value || '').trim()

  const copy = async (e) => {
    e?.stopPropagation?.()
    if (!text) return
    try {
      await navigator.clipboard.writeText(text)
    } catch {
      const el = document.createElement('textarea')
      el.value = text
      document.body.appendChild(el)
      el.select()
      document.execCommand('copy')
      document.body.removeChild(el)
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 1200)
  }

  if (compact) {
    return (
      <span className="cs-name-inline" title={text || placeholder}>
        <span className="cs-name-text">{text || '—'}</span>
        {text ? (
          <button type="button" className="cs-copy" onClick={copy} title="Copy CS Name">
            {copied ? 'Copied' : 'Copy'}
          </button>
        ) : null}
      </span>
    )
  }

  return (
    <div className="name-preview">
      <div className="label">CS Name (auto-generated)</div>
      <div className="cs-name-row">
        <div className={`value ${text ? '' : 'placeholder'}`}>{text || placeholder}</div>
        {text ? (
          <button type="button" className="cs-copy" onClick={copy}>
            {copied ? 'Copied' : 'Copy'}
          </button>
        ) : null}
      </div>
    </div>
  )
}
