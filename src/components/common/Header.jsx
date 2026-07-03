// Top bar shown on every page: logo + page title, with an optional
// action button on the right (e.g. "+" to add something new).
// Top bar — uses the real BusiWage logo image instead of the letter "B".
import logo from '../../assets/logo.png'

export default function Header({ title, actionIcon, onAction }) {
  return (
    <div className="header">
      <div className="header-brand">
        <img
          src={logo}
          alt="BusiWage"
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            objectFit: 'contain',
          }}
        />
        <h1 className="header-title">{title}</h1>
      </div>
      {actionIcon && (
        <button className="header-action" onClick={onAction} aria-label="action">
          {actionIcon}
        </button>
      )}
    </div>
  )
}