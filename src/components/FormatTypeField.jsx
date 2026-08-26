import { formatTypeOptionsFor } from '../lib/helpers'

export default function FormatTypeField({ config, format, value, onChange }) {
  const options = formatTypeOptionsFor(config, format, value ? [value] : [])

  return (
    <div className="field">
      <label>{config.fieldLabels.formatType}</label>
      {!format ? (
        <div className="field-hint">Select a format first</div>
      ) : (
        <div className="choice-row">
          {options.map((option) => (
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
    </div>
  )
}
