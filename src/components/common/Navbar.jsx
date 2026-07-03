// Bottom navigation — the app's five sections, always one thumb away.

import { NavLink } from 'react-router-dom'
import { useTheme } from '../../context/ThemeContext'

const TABS = [
  { to: '/', icon: '🏠', label: 'Home', end: true },
  { to: '/workers', icon: '👷', label: 'Workers' },
  { to: '/sites', icon: '🏗️', label: 'Sites' },
  { to: '/calendar', icon: '📅', label: 'Calendar' },
  { to: '/payments', icon: '💰', label: 'Payments' },
]

export default function Navbar() {
  const { theme, toggleTheme } = useTheme()

  return (
    <>
      {/* Theme toggle — floats just above the navbar on the right */}
      <button
        onClick={toggleTheme}
        aria-label="Toggle dark mode"
        style={{
          position: 'fixed',
          bottom: 72,
          right: 14,
          width: 36,
          height: 36,
          borderRadius: '50%',
          border: '1.5px solid var(--color-border)',
          background: 'var(--color-card)',
          fontSize: 18,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: 'var(--shadow-card)',
          zIndex: 20,
        }}
      >
        {theme === 'dark' ? '☀️' : '🌙'}
      </button>

      <nav className="navbar">
        {TABS.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            end={tab.end}
            className={({ isActive }) => `navbar-item${isActive ? ' active' : ''}`}
          >
            <span className="navbar-icon">{tab.icon}</span>
            <span>{tab.label}</span>
          </NavLink>
        ))}
      </nav>
    </>
  )
}