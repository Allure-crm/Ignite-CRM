import { formatTypeOptions } from '../lib/helpers'

export default function FormatTypeField({ config, value, onChange, extraOptions = [] }) {
  const pills = formatTypeOptions(config, [value])
  const suggestions = formatTypeOptions(config, extraOptions.concat(value || ''))
  const listId = 'format-type-suggestions'

  return (
    <div className="field">
      <label>{config.fieldLabels.formatType}</label>
      {pills.length > 0 && (
        <div className="choice-row">
          {pills.map((option) => (
            <button
              type="button"
              key={option}
              className={`choice ${value === option ? 'selected' : ''}`}
              onClick={() => onChange(option)}
            >
              {option}
            </button>
          ))}
        </div>
      )}
      <input
        type="text"
        list={listId}
        placeholder="e.g. AI Animated, Broll + VO, UGC-Style…"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      <datalist id={listId}>
        {suggestions.map((option) => (
          <option key={option} value={option} />
        ))}
      </datalist>
    </div>
  )
}
