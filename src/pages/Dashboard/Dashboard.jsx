// The contractor's home page — answers today's most important questions
// instantly, then provides 4 big buttons to the main sections.
// No charts. No complexity. Pure overview.
import logo from '../../assets/logo.png'
import { useNavigate } from 'react-router-dom'
import { useData } from '../../context/DataContext'
import { todayStr, daysFromToday, formatDisplayDate } from '../../utils/date'
import { summarizeWorkerSessions, formatCurrency } from '../../utils/wage'
import Navbar from '../../components/common/Navbar'
import Card from '../../components/common/Card'

export default function Dashboard() {
  const { workers, sites, sessions, notes, getSessionsForWorker, getTotalPaidForWorker } = useData()
  const navigate = useNavigate()
  const today = todayStr()
  const todaySessions = sessions.filter((s) => s.date === today)

  const totalPending = workers.reduce((sum, w) => {
    const s = summarizeWorkerSessions(
      getSessionsForWorker(w.id),
      w.hourlyWage,
      getTotalPaidForWorker(w.id)   // ← third arg (payment total)
    )
    return sum + s.totalPending
  }, 0)

  const pendingWorkerCount = workers.filter((w) => {
    const s = summarizeWorkerSessions(
      getSessionsForWorker(w.id),
      w.hourlyWage,
      getTotalPaidForWorker(w.id)
    )
    return s.totalPending > 0
  }).length

  const activeSites = sites.filter((s) => !s.endDate || daysFromToday(s.endDate) >= 0)

  const reminders = []
  sites.forEach((site) => {
    if (site.startDate) {
      const diff = daysFromToday(site.startDate)
      if (diff === 1) reminders.push({ emoji: '🚩', text: `"${site.name}" starts tomorrow` })
      if (diff === 0) reminders.push({ emoji: '🚩', text: `"${site.name}" starts today` })
    }
    if (site.endDate) {
      const diff = daysFromToday(site.endDate)
      if (diff === 2) reminders.push({ emoji: '⚠️', text: `"${site.name}" finishes in 2 days` })
      if (diff === 1) reminders.push({ emoji: '⚠️', text: `"${site.name}" finishes tomorrow` })
      if (diff === 0) reminders.push({ emoji: '⚠️', text: `"${site.name}" finishes today` })
    }
  })
  if (pendingWorkerCount > 0) {
    reminders.push({
      emoji: '💰',
      text: `${pendingWorkerCount} worker${pendingWorkerCount > 1 ? 's' : ''} waiting for payment`,
    })
  }

  const dayNote = notes[today]
  const todayWorkerCount = new Set(todaySessions.map((s) => s.workerId)).size

  return (
    <div className="page">
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
        <img
          src={logo}
          alt="BusiWage"
          style={{ width: 42, height: 42, borderRadius: 13, objectFit: 'contain' }}
        />
        <div>
          <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: 18 }}>BusiWage</div>
          <div className="muted" style={{ fontSize: 12 }}>Your Digital Work Diary</div>
        </div>
      </div>

      <div className="muted" style={{ fontSize: 13, marginBottom: 18, marginTop: 12 }}>
        📅 Today — {formatDisplayDate(today)}
      </div>

      <div className="stat-grid">
        <div className="stat-tile stat-hours">
          <div className="stat-label">Total Workers</div>
          <div className="stat-value">{workers.length}</div>
        </div>
        <div className="stat-tile" style={{ background: 'var(--color-info-bg)', color: 'var(--color-info)' }}>
          <div className="stat-label">Active Sites</div>
          <div className="stat-value">{activeSites.length}</div>
        </div>
        <div className="stat-tile stat-pending">
          <div className="stat-label">Pending Pay</div>
          <div className="stat-value">{formatCurrency(totalPending)}</div>
        </div>
        <div className="stat-tile stat-paid">
          <div className="stat-label">Today's Workers</div>
          <div className="stat-value">{todayWorkerCount}</div>
        </div>
      </div>

      {reminders.length > 0 && (
        <div style={{ marginBottom: 18 }}>
          {reminders.map((r, i) => (
            <div key={i} className="banner banner-info" style={{ marginBottom: 8 }}>
              {r.emoji} {r.text}
            </div>
          ))}
        </div>
      )}

      {dayNote && (
        <Card>
          <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--color-text-light)', marginBottom: 6 }}>📌 Today's Note</div>
          <div style={{ fontSize: 14, lineHeight: 1.5 }}>{dayNote}</div>
        </Card>
      )}

      <div className="tile-grid" style={{ marginTop: 8 }}>
        <div className="tile" onClick={() => navigate('/workers')}>
          <span className="tile-emoji">👷</span>
          <span className="tile-label">Workers</span>
          <span className="muted" style={{ fontSize: 11 }}>{workers.length} added</span>
        </div>
        <div className="tile" onClick={() => navigate('/sites')}>
          <span className="tile-emoji">🏗️</span>
          <span className="tile-label">Sites</span>
          <span className="muted" style={{ fontSize: 11 }}>{activeSites.length} active</span>
        </div>
        <div className="tile" onClick={() => navigate('/worklog')}>
          <span className="tile-emoji">📝</span>
          <span className="tile-label">Work Log</span>
          <span className="muted" style={{ fontSize: 11 }}>Record today</span>
        </div>
        <div className="tile" onClick={() => navigate('/payments')}>
          <span className="tile-emoji">💰</span>
          <span className="tile-label">Payments</span>
          <span
            className="muted"
            style={{
              fontSize: 11,
              color: pendingWorkerCount > 0 ? 'var(--color-warning)' : undefined,
              fontWeight: pendingWorkerCount > 0 ? 700 : undefined,
            }}
          >
            {pendingWorkerCount > 0 ? `${pendingWorkerCount} pending` : 'All clear'}
          </span>
        </div>
      </div>

      <button
        className="fab"
        onClick={() => navigate('/worklog')}
        aria-label="Log Work"
        style={{ bottom: 88 }}
      >
        📝
      </button>

      <Navbar />
    </div>
  )
}