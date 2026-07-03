// Shows partial payment status per session using computeSessionPaymentStatuses

import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useData } from '../../context/DataContext'
import {
  summarizeWorkerSessions, formatCurrency,
  computeSessionPaymentStatuses,
} from '../../utils/wage'
import { formatDisplayDate, formatShortDate, formatTime12h } from '../../utils/date'
import Header from '../../components/common/Header'
import Card from '../../components/common/Card'
import EmptyState from '../../components/common/EmptyState'

const MAX_SHOWN = 5

export default function WorkerDetail() {
  const { workerId } = useParams()
  const navigate = useNavigate()
  const { getWorker, getSite, getSessionsForWorker, getTotalPaidForWorker, getPaymentsForWorker } = useData()

  const [searchTerm, setSearchTerm] = useState('')
  const [showAll, setShowAll] = useState(false)

  const worker = getWorker(workerId)
  if (!worker) {
    return (
      <div className="page">
        <Header title="Worker" actionIcon="✕" onAction={() => navigate('/workers')} />
        <EmptyState emoji="❓" title="Worker not found." />
      </div>
    )
  }

  const sessions = getSessionsForWorker(workerId)
  const totalPaid = getTotalPaidForWorker(workerId)
  const summary = summarizeWorkerSessions(sessions, worker.hourlyWage, totalPaid)
  const daysWorked = new Set(sessions.map((s) => s.date)).size
  const paymentHistory = getPaymentsForWorker(workerId)

  // Compute per-session payment status
  const sessionStatuses = computeSessionPaymentStatuses(sessions, totalPaid, worker.hourlyWage)
  // Map by session id for quick lookup
  const statusById = {}
  sessionStatuses.forEach((x) => { statusById[x.session.id] = x })

  // Filter sessions (newest-first from getSessionsForWorker)
  const filteredSessions = sessions.filter((s) => {
    if (!searchTerm) return true
    const site = getSite(s.siteId)
    const term = searchTerm.toLowerCase()
    return (
      s.date.includes(term) ||
      formatDisplayDate(s.date).toLowerCase().includes(term) ||
      (site?.name || '').toLowerCase().includes(term)
    )
  })

  const shownSessions = showAll ? filteredSessions : filteredSessions.slice(0, MAX_SHOWN)
  const hiddenCount = filteredSessions.length - MAX_SHOWN

  return (
    <div className="page">
      <Header title={worker.name} actionIcon="✕" onAction={() => navigate('/workers')} />

      <p className="muted" style={{ marginBottom: 14 }}>
        💵 ₹{worker.hourlyWage}/hour{worker.phone ? ` · 📞 ${worker.phone}` : ''}
      </p>

      <div className="stat-grid">
        <div className="stat-tile stat-hours">
          <div className="stat-label">Days Worked</div>
          <div className="stat-value">{daysWorked}</div>
        </div>
        <div className="stat-tile stat-earned">
          <div className="stat-label">Total Earned</div>
          <div className="stat-value">{formatCurrency(summary.totalEarned)}</div>
        </div>
        <div className="stat-tile stat-paid">
          <div className="stat-label">Paid</div>
          <div className="stat-value">{formatCurrency(summary.totalPaid)}</div>
        </div>
        <div className="stat-tile stat-pending">
          <div className="stat-label">Pending</div>
          <div className="stat-value">{formatCurrency(summary.totalPending)}</div>
        </div>
      </div>

      {paymentHistory.length > 0 && (
        <>
          <h2 className="section-title" style={{ marginTop: 8 }}>💸 Payment History</h2>
          {paymentHistory.map((p) => (
            <Card key={p.id}>
              <div className="card-row">
                <div>
                  <div style={{ fontWeight: 700, color: 'var(--color-success)' }}>
                    {formatCurrency(p.amount)} paid
                  </div>
                  <div className="muted" style={{ fontSize: 12 }}>
                    {formatShortDate(p.date)}{p.note ? ` · ${p.note}` : ''}
                  </div>
                </div>
                <span style={{ fontSize: 20 }}>🟢</span>
              </div>
            </Card>
          ))}
        </>
      )}

      <h2 className="section-title" style={{ marginTop: 16 }}>🧾 Work History</h2>

      {sessions.length > 0 && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          background: 'var(--color-card)', borderRadius: 'var(--radius-sm)',
          border: '2px solid var(--color-border)', padding: '10px 14px', marginBottom: 14,
        }}>
          <span>🔍</span>
          <input
            type="text" placeholder="Search by date or site..."
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setShowAll(false) }}
            style={{ border: 'none', background: 'transparent', fontSize: 15, color: 'var(--color-text)', flex: 1, outline: 'none', fontFamily: 'var(--font-body)' }}
          />
          {searchTerm && (
            <button onClick={() => setSearchTerm('')}
              style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--color-text-light)', fontSize: 16 }}>✕</button>
          )}
        </div>
      )}

      {filteredSessions.length === 0 ? (
        <EmptyState emoji="📋" title={searchTerm ? 'No matching sessions.' : 'No work recorded yet.'} />
      ) : (
        <>
          {shownSessions.map((s) => {
            const site = getSite(s.siteId)
            const st = statusById[s.id]
            const wage = st?.wage || 0
            const { status, paidAmount, pendingAmount } = st || {}

            return (
              <Card key={s.id}>
                <div className="card-row">
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700 }}>{formatDisplayDate(s.date)}</div>
                    <div className="muted" style={{ fontSize: 13, marginTop: 2 }}>
                      🏗️ {site?.name || 'Unknown'} · {formatTime12h(s.inTime)} – {formatTime12h(s.outTime)} ({s.hours}h)
                    </div>
                    {s.wageOverride
                      ? <div className="muted" style={{ fontSize: 11 }}>📅 Fixed day rate</div>
                      : s.hourlyWage && s.hourlyWage !== worker.hourlyWage
                        ? <div className="muted" style={{ fontSize: 11 }}>Rate that day: ₹{s.hourlyWage}/hr</div>
                        : null
                    }
                  </div>
                  <div style={{ textAlign: 'right', marginLeft: 8 }}>
                    <div style={{ fontWeight: 700 }}>{formatCurrency(wage)}</div>
                    {status === 'paid' && <span style={{ fontSize: 13 }}>🟢 Paid</span>}
                    {status === 'partial' && (
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-success)' }}>
                          {formatCurrency(paidAmount)} paid
                        </div>
                        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-warning)' }}>
                          {formatCurrency(pendingAmount)} left
                        </div>
                      </div>
                    )}
                    {status === 'unpaid' && <span style={{ fontSize: 13 }}>🟡 Pending</span>}
                  </div>
                </div>
              </Card>
            )
          })}

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
