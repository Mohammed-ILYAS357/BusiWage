// Multi-select list of workers for Work Log step 2. Tap to check/uncheck.

export default function WorkerSelectList({ workers, selectedIds, onToggle }) {
  return (
    <div className="worker-select-list">
      {workers.map((w) => {
        const selected = selectedIds.includes(w.id)
        return (
          <div
            key={w.id}
            className={`worker-select-item${selected ? ' selected' : ''}`}
            onClick={() => onToggle(w.id)}
          >
            <span className="checkbox">{selected ? '✓' : ''}</span>
            <div>
              <div style={{ fontWeight: 700 }}>{w.name}</div>
              <div className="muted" style={{ fontSize: 12 }}>₹{w.hourlyWage}/hour</div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
