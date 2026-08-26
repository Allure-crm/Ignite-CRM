export default function FormatByWeek({ matrix }) {
  const { weeks, rows, highlightAt } = matrix

  if (!weeks.length) {
    return <div className="fmt-empty">Pick a month to see format counts.</div>
  }

  if (!rows.length) {
    return <div className="fmt-empty">No batches with a date in this month.</div>
  }

  return (
    <div className="fmt-wrap">
      <table className="fmt-table">
        <thead>
          <tr>
            <th className="fmt-title" colSpan={weeks.length + 2}>Format by week</th>
          </tr>
          <tr>
            <th className="fmt-th fmt-th-format">Format</th>
            {weeks.map((w) => (
              <th key={w.key} className="fmt-th fmt-th-week">{w.label}</th>
            ))}
            <th className="fmt-th fmt-th-mtd">MTD</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.format}>
              <td className="fmt-td fmt-td-format">{row.format}</td>
              {row.counts.map((count, i) => (
                <td
                  key={weeks[i].key}
                  className={`fmt-td fmt-td-num${count >= highlightAt ? ' fmt-hot' : ''}`}
                >
                  {count}
                </td>
              ))}
              <td className="fmt-td fmt-td-num fmt-mtd">{row.mtd}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
