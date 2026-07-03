// A reusable button so every button in the app looks and behaves the same.

export default function Button({
  children, onClick, variant = 'primary', block = false, small = false,
  disabled = false, icon = null, type = 'button',
}) {
  const classes = ['btn', `btn-${variant}`, block ? 'btn-block' : '', small ? 'btn-sm' : '']
    .filter(Boolean).join(' ')
  return (
    <button type={type} className={classes} onClick={onClick} disabled={disabled}>
      {icon && <span>{icon}</span>}
      {children}
    </button>
  )
}
