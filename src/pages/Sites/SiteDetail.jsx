// FIX 1: Search sessions + show/hide >5
// FIX 4: End date editable at any time (makes site "ongoing" again if moved forward)
// FIX 8: Uses getSessionWage so fixed day rates are calculated correctly

import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useData } from '../../context/DataContext'
import { formatDisplayDate, formatTime12h } from '../../utils/date'
import { getSessionWage, formatCurrency } from '../../utils/wage'
import Header from '../../components/common/Header'
import Card from '../../components/common/Card'
import Chip from '../../components/common/Chip'
import EmptyState from '../../components/common/EmptyState'

const MAX_SHOWN = 5

export default function SiteDetail() {
  const { siteId } = useParams()
  const navigate = useNavigate()
  const { getSite, getWorker, sessions, updateSite } = useData()

  const [searchTerm, setSearchTerm] = useState('')
  const [showAll, setShowAll] = useState(false)
  // FIX 4: End date editing
  const [editingEndDate, setEditingEndDate] = useState(false)
  const [newEndDate, setNewEndDate] = useState('')

  const site = getSite(siteId)
  if (!site) {
    return (
      <div className="page">
        <Header title="Site" actionIcon="✕" onAction={() => navigate('/sites')} />
        <EmptyState emoji="❓" title="Site not found." />
      </div>
    )
  }

  const siteSessions = sessions
    .filter((s) => s.siteId === siteId)
    .sort((a, b) => (a.date < b.date ? 1 : -1))

  // FIX 8: Use getSessionWage — respects fixed day rate stored on each session
  const totalHours = siteSessions.reduce((sum, s) => sum + (Number(s.hours) || 0), 0)
  const totalCost = siteSessions.reduce((sum, s) => {
    const w = getWorker(s.workerId)
    return sum + getSessionWage(s, w?.hourlyWage || 0)
  }, 0)

  // FIX 1: Filter by worker name or date
  const filteredSessions = siteSessions.filter((s) => {
    if (!searchTerm) return true
    const worker = getWorker(s.workerId)
    const term = searchTerm.toLowerCase()
    return (
      (worker?.name || '').toLowerCase().includes(term) ||
      s.date.includes(term) ||
      formatDisplayDate(s.date).toLowerCase().includes(term)
    )
  })

  const shownSessions = showAll ? filteredSessions : filteredSessions.slice(0, MAX_SHOWN)
  const hiddenCount = filteredSessions.length - MAX_SHOWN

  function handleSaveEndDate() {
    updateSite(siteId, { endDate: newEndDate })
    setEditingEndDate(false)
  }

  return (
    <div className="page">
      <Header title={site.name} actionIcon="✕" onAction={() => navigate('/sites')} />

      {/* Site info card */}
      <Card>
        {site.client && (
          <div className="card-row" style={{ marginBottom: 8 }}>
            <span className="muted">👤 Client</span><span>{site.client}</span>
          </div>
        )}
        {site.location && (
          <div className="card-row" style={{ marginBottom: 8 }}>
            <span className="muted">📍 Location</span><span>{site.location}</span>
          </div>
        )}
        {site.startDate && (
          <div className="card-row" style={{ marginBottom: 8 }}>
            <span className="muted">🚧 Start</span>
            <span>{formatDisplayDate(site.startDate)}</span>
          </div>
        )}

        {/* FIX 4: Editable end date */}
        <div className="card-row" style={{ marginBottom: 4, alignItems: 'flex-start' }}>
          <span className="muted">🏁 End Date</span>
          {editingEndDate ? (
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <input
                type="date"
                value={newEndDate}
                onChange={(e) => setNewEndDate(e.target.value)}
                style={{
                  fontSize: 14, padding: '6px 10px',
                  border: '2px solid var(--color-primary)',
                  borderRadius: 8, background: 'var(--color-bg)', color: 'var(--color-text)',
                }}
              />
              <button
                onClick={handleSaveEndDate}
                style={{
                  background: 'var(--color-success)', color: '#fff',
                  border: 'none', borderRadius: 8, padding: '6px 12px',
                  fontWeight: 700, cursor: 'pointer', fontSize: 13,
                }}
              >Save</button>
              <button
                onClick={() => setEditingEndDate(false)}
                style={{
                  background: 'transparent', border: 'none',
                  color: 'var(--color-text-light)', cursor: 'pointer', fontSize: 16,
                }}
              >✕</button>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>{site.endDate ? formatDisplayDate(site.endDate) : 'Not set'}</span>
              <button
                onClick={() => { setNewEndDate(site.endDate || ''); setEditingEndDate(true) }}
                style={{
                  background: 'var(--color-info-bg)', border: 'none', borderRadius: 6,
                  padding: '3px 8px', color: 'var(--color-info)', cursor: 'pointer',
                  fontSize: 12, fontWeight: 700,
                }}
              >✏️ Edit</button>
            </div>
          )}
        </div>
        {site.endDate && (() => {
          const today = new Date().toISOString().slice(0, 10)
          const isOngoing = site.endDate >= today
          return (
            <div style={{ marginTop: 6 }}>
              <Chip variant={isOngoing ? 'info' : 'muted'}>
                {isOngoing ? '🚧 Ongoing' : '✅ Completed'}
              </Chip>
            </div>
          )
        })()}
        {site.notes && (
          <div style={{ marginTop: 10 }} className="diary-note-box">{site.notes}</div>
        )}
      </Card>

      {/* Totals */}
      <div className="stat-grid">
        <div className="stat-tile stat-hours">
          <div className="stat-label">Total Hours</div>
          <div className="stat-value">{totalHours}h</div>
        </div>
        <div className="stat-tile stat-earned">
          <div className="stat-label">Site Cost</div>
          <div className="stat-value">{formatCurrency(totalCost)}</div>
        </div>
      </div>

      {/* Sessions with search + show/hide */}
      <h2 className="section-title" style={{ marginTop: 10 }}>📝 Work Sessions</h2>

      {siteSessions.length > 0 && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          background: 'var(--color-card)', borderRadius: 'var(--radius-sm)',
          border: '2px solid var(--color-border)', padding: '10px 14px', marginBottom: 14,
        }}>
          <span>🔍</span>
          <input
            type="text" placeholder="Search by worker or date..."
            value={searchTerm} onChange={(e) => { setSearchTerm(e.target.value); setShowAll(false) }}
            style={{
              border: 'none', background: 'transparent', fontSize: 15,
              color: 'var(--color-text)', flex: 1, outline: 'none', fontFamily: 'var(--font-body)',
            }}
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--color-text-light)', fontSize: 16 }}
            >✕</button>
          )}
        </div>
      )}

      {filteredSessions.length === 0 ? (
        <EmptyState emoji="📋" title={searchTerm ? 'No matching sessions.' : 'No work recorded here yet.'} />
      ) : (
        <>
          {shownSessions.map((s) => {
            const worker = getWorker(s.workerId)
            const wage = getSessionWage(s, worker?.hourlyWage || 0)
            return (
              <Card key={s.id}>
                <div className="card-row">
                  <div>
                    <div style={{ fontWeight: 700 }}>{worker?.name || 'Unknown worker'}</div>
                    <div className="muted" style={{ fontSize: 13, marginTop: 2 }}>
                      {formatDisplayDate(s.date)} · {formatTime12h(s.inTime)} – {formatTime12h(s.outTime)} ({s.hours}h)
                    </div>
                    {s.wageOverride && (
                      <div className="muted" style={{ fontSize: 11 }}>📅 Fixed day rate</div>
                    )}
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 700 }}>{formatCurrency(wage)}</div>
                    <Chip variant={s.paid ? 'paid' : 'pending'}>
                      {s.paid ? '🟢 Paid' : '🟡 Pending'}
                    </Chip>
                  </div>
                </div>
              </Card>
            )
          })}

          {/* FIX 1: Show/Hide toggle */}
          {!searchTerm && hiddenCount > 0 && (
            <button
              onClick={() => setShowAll(!showAll)}
              style={{
                width: '100%', padding: '12px', background: 'var(--color-card)',
                border: '2px solid var(--color-border)', borderRadius: 'var(--radius-sm)',
                color: 'var(--color-text-light)', fontWeight: 700, fontSize: 14,
                cursor: 'pointer', marginBottom: 10,
              }}
            >
              {showAll ? '↑ Show Less' : `↓ Show ${hiddenCount} More`}
            </button>
          )}
        </>
      )}
    </div>
  )
}
