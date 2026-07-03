// Friendly placeholder shown whenever a list (workers, sites, etc.) is empty.
export default function EmptyState({ emoji = '📭', title, subtitle }) {
  return (
    <div className="empty-state">
      <span className="empty-emoji">{emoji}</span>
      <p>{title}</p>
      {subtitle && <p className="muted">{subtitle}</p>}
    </div>
  )
}
