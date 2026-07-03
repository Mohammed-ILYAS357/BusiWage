// A small colored pill used to show a status (Paid / Pending / etc.)
export default function Chip({ children, variant = 'muted' }) {
  return <span className={`chip chip-${variant}`}>{children}</span>
}
