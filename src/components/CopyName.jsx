import { useState } from 'react'

export default function CopyName({
  value,
  label = 'Copy',
  title = 'Copy CS Name',
  className = 'copy-name',
}) {
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

  return (
    <button type="button" className={className} onClick={copy} disabled={!text} title={title}>
      {copied ? 'Copied!' : label}
    </button>
  )
}
