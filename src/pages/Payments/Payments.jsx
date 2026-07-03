// FIX 1: Smart partial payment (₹500 covers ₹200 day fully + ₹300 of next day)
// FIX 1: Show/hide breakdown when >5 sessions
// FIX 3: Inline "Pay [WorkerName]" panel opens below Pay Now (no modal)

import { useState } from 'react'
import { useData } from '../../context/DataContext'
import {
  summarizeWorkerSessions, formatCurrency,
  computeSessionPaymentStatuses,
} from '../../utils/wage'
import { formatShortDate, formatTime12h } from '../../utils/date'
import Header from '../../components/common/Header'
import Navbar from '../../components/common/Navbar'
import Card from '../../components/common/Card'
import Button from '../../components/common/Button'
import Chip from '../../components/common/Chip'
import EmptyState from '../../components/common/EmptyState'

const BREAKDOWN_MAX = 5

// Status badge for a single session in the breakdown
function SessionStatusBadge({ status, paidAmount, pendingAmount }) {
  if (status === 'paid') return <span style={{ fontSize: 13 }}>🟢</span>
  if (status === 'partial') {
    return (
      <div style={{ textAlign: 'right' }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-success)' }}>
          {formatCurrency(paidAmount)} paid
        </div>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-warning)' }}>
          {formatCurrency(pendingAmount)} left
        </div>
      </div>
    )
  }
  return <span style={{ fontSize: 13 }}>🟡</span>
}

export default function Payments() {
  const { workers, getSessionsForWorker, getTotalPaidForWorker, getSite, addPayment } = useData()

  // Which worker card is expanded to show breakdown
  const [expandedId, setExpandedId] = useState(null)
  // Which worker card has breakdown fully expanded (>5 items)
  const [showAllBreakdown, setShowAllBreakdown] = useState({})

  // FIX 3: Inline payment state (per-worker)
  const [payingId, setPayingId] = useState(null)
  const [payAmount, setPayAmount] = useState('')
  const [payNote, setPayNote] = useState('')
  const [payStage, setPayStage] = useState('enter') // 'enter' | 'confirm'

  function openPay(worker, totalPending) {
    setPayingId(worker.id)
    setPayAmount(String(totalPending))
    setPayNote('')
    setPayStage('enter')
  }

  function closePay() {
    setPayingId(null)
    setPayAmount('')
    setPayNote('')
    setPayStage('enter')
  }

  function handleConfirmPay(worker) {
    addPayment(worker.id, Number(payAmount), payNote.trim())
    closePay()
    // Keep breakdown expanded so contractor sees the updated statuses
  }

  function toggleShowAll(workerId) {
    setShowAllBreakdown((prev) => ({ ...prev, [workerId]: !prev[workerId] }))
  }

  const workerSummaries = workers
    .map((w) => {
      const sessions = getSessionsForWorker(w.id)
      const totalPaid = getTotalPaidForWorker(w.id)
      const summary = summarizeWorkerSessions(sessions, w.hourlyWage, totalPaid)
      return { worker: w, sessions, totalPaid, ...summary }
    })
    .sort((a, b) => b.totalPending - a.totalPending)

  const pendingWorkers = workerSummaries.filter((x) => x.totalPending > 0)
  const paidWorkers = workerSummaries.filter((x) => x.totalPending === 0 && x.totalEarned > 0)
  const grandTotalPending = workerSummaries.reduce((sum, x) => sum + x.totalPending, 0)

  // Inline payment panel — shown inside the worker card when payingId matches
  function InlinePayPanel({ worker, totalPending }) {
    const payAmountNum = Number(payAmount) || 0
    const isOverpay = payAmountNum > totalPending
    const isPartial = payAmountNum > 0 && payAmountNum < totalPending
    const remaining = Math.max(0, totalPending - payAmountNum)

    return (
      <div style={{
        marginTop: 12, padding: '14px 14px 10px',
        background: 'var(--color-success-bg)',
        border: '2px solid var(--color-success)',
        borderRadius: 12,
      }}>
        <div style={{ fontWeight: 800, fontSize: 16, marginBottom: 12, color: 'var(--color-success)' }}>
          💸 Pay {worker.name}
        </div>

        {payStage === 'enter' && (
          <>
            <div className="field" style={{ marginBottom: 10 }}>
              <label style={{ color: 'var(--color-text-light)' }}>Amount (₹)</label>
              <input
                type="number" inputMode="decimal"
                value={payAmount}
                onChange={(e) => setPayAmount(e.target.value)}
                style={{
                  fontSize: 26, fontWeight: 800, textAlign: 'center',
                  border: '2px solid var(--color-success)',
                  borderRadius: 10, padding: '10px',
                  background: 'var(--color-card)', color: 'var(--color-text)',
                  width: '100%', fontFamily: 'var(--font-body)',
                }}
              />
            </div>

            <div className="field" style={{ marginBottom: 10 }}>
              <label style={{ color: 'var(--color-text-light)' }}>Note (Optional)</label>
              <input
                type="text" placeholder="e.g. Paid in cash"
                value={payNote} onChange={(e) => setPayNote(e.target.value)}
              />
            </div>

            {payAmountNum > 0 && !isOverpay && (
              <div style={{
                background: 'var(--color-card)', borderRadius: 8, padding: '8px 12px',
                marginBottom: 10, fontSize: 13, fontWeight: 600,
              }}>
                <div style={{ color: 'var(--color-success)' }}>
                  ✅ {formatCurrency(payAmountNum)} will be marked paid (oldest sessions first)
                </div>
                {isPartial && (
                  <div style={{ color: 'var(--color-warning)', marginTop: 4 }}>
                    ⚠️ {formatCurrency(remaining)} will remain pending
                  </div>
                )}
              </div>
            )}
            {isOverpay && (
              <div className="banner banner-error" style={{ marginBottom: 10 }}>
                ⚠️ More than what's owed ({formatCurrency(totalPending)})
              </div>
            )}

            <div style={{ display: 'flex', gap: 8 }}>
              <Button variant="outline" small onClick={closePay}>Cancel</Button>
              <Button block variant="success" small
                onClick={() => setPayStage('confirm')}
                disabled={payAmountNum <= 0 || isOverpay}
              >
                Review →
              </Button>
            </div>
          </>
        )}

        {payStage === 'confirm' && (
          <>
            <div style={{
              background: 'var(--color-card)', borderRadius: 10, padding: '12px',
              marginBottom: 12,
            }}>
              <div className="card-row" style={{ marginBottom: 6 }}>
                <span className="muted" style={{ fontSize: 13 }}>Paying</span>
                <span style={{ fontWeight: 800, fontSize: 18, color: 'var(--color-success)' }}>
                  {formatCurrency(Number(payAmount))}
                </span>
              </div>
              {Number(payAmount) < totalPending && (
                <div className="card-row">
                  <span className="muted" style={{ fontSize: 13 }}>Remaining after</span>
                  <span style={{ fontWeight: 700, color: 'var(--color-warning)' }}>
                    {formatCurrency(totalPending - Number(payAmount))}
                  </span>
                </div>
              )}
            </div>
            <div className="banner banner-error" style={{ marginBottom: 10 }}>
              ⚠️ This cannot be undone. Confirm only if correct.
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <Button variant="outline" small onClick={() => setPayStage('enter')}>← Edit</Button>
              <Button block variant="success" small onClick={() => handleConfirmPay(worker)}>
                ✅ Confirm & Pay
              </Button>
            </div>
          </>
        )}
      </div>
    )
  }

  // Per-worker day-by-day breakdown using computeSessionPaymentStatuses
  function WorkerBreakdown({ worker, sessions, totalPaid }) {
    if (sessions.length === 0) {
      return <p className="muted" style={{ fontSize: 13, padding: '8px 0' }}>No sessions recorded.</p>
    }

    // FIX 1: Use computeSessionPaymentStatuses for accurate partial payment display
    const statuses = computeSessionPaymentStatuses(sessions, totalPaid, worker.hourlyWage)
    // Newest-first for display
    const displayStatuses = [...statuses].reverse()

    const showAll = !!showAllBreakdown[worker.id]
    const shownStatuses = showAll ? displayStatuses : displayStatuses.slice(0, BREAKDOWN_MAX)
    const hiddenCount = displayStatuses.length - BREAKDOWN_MAX

    return (
      <div style={{ marginTop: 10, borderTop: '1px solid var(--color-border)', paddingTop: 10 }}>
        <div className="diary-section-title" style={{ marginBottom: 8 }}>📋 Day-by-Day Breakdown</div>

        {shownStatuses.map(({ session, wage, paidAmount, pendingAmount, status }) => {
          const site = getSite(session.siteId)
          return (
            <div key={session.id} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '9px 0', borderBottom: '1px solid var(--color-border)',
            }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 14 }}>{formatShortDate(session.date)}</div>
                <div className="muted" style={{ fontSize: 12, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  🏗️ {site?.name || '—'} · {session.hours}h
                  {session.wageOverride ? ' · fixed' : ` @ ₹${session.hourlyWage || worker.hourlyWage}/hr`}
                </div>
              </div>
              <div style={{ textAlign: 'right', marginLeft: 8 }}>
                <div style={{ fontWeight: 700, fontSize: 14 }}>{formatCurrency(wage)}</div>
                <SessionStatusBadge
                  status={status}
                  paidAmount={paidAmount}
                  pendingAmount={pendingAmount}
                />
              </div>
            </div>
          )
        })}

        {/* FIX 1: Show/hide when >5 sessions */}
        {displayStatuses.length > BREAKDOWN_MAX && (
          <button
            onClick={() => toggleShowAll(worker.id)}
            style={{
              width: '100%', marginTop: 8, padding: '9px',
              background: 'transparent', border: '1.5px solid var(--color-border)',
              borderRadius: 8, color: 'var(--color-text-light)', fontWeight: 700,
              fontSize: 13, cursor: 'pointer',
            }}
          >
            {showAll ? '↑ Show Less' : `↓ Show ${hiddenCount} More`}
          </button>
        )}
      </div>
    )
  }

  return (
    <div className="page">
      <Header title="Payments" />

      {workers.length === 0 ? (
        <EmptyState emoji="💰" title="No workers added yet." subtitle="Add workers and log work first." />
      ) : (
        <>
          {grandTotalPending > 0 && (
            <div className="card" style={{ background: 'var(--color-warning-bg)', marginBottom: 18 }}>
              <div className="muted" style={{ fontSize: 13, marginBottom: 4 }}>Total Pending Payment</div>
              <div style={{ fontFamily: 'var(--font-heading)', fontSize: 28, fontWeight: 800, color: 'var(--color-warning)' }}>
                {formatCurrency(grandTotalPending)}
              </div>
            </div>
          )}

          {pendingWorkers.length > 0 && (
            <>
              <h2 className="section-title">🟡 Payment Pending</h2>
              {pendingWorkers.map(({ worker, sessions, totalPaid, totalEarned, totalPending, totalHours }) => (
                <Card key={worker.id}>
                  {/* Worker header — tap to expand breakdown */}
                  <div
                    onClick={() => setExpandedId(expandedId === worker.id ? null : worker.id)}
                    style={{ cursor: 'pointer' }}
                  >
                    <div className="card-row" style={{ marginBottom: 6 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div className="avatar">{worker.name.charAt(0).toUpperCase()}</div>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: 16 }}>{worker.name}</div>
                          <div className="muted" style={{ fontSize: 12 }}>
                            ₹{worker.hourlyWage}/hr · {totalHours}h worked
                          </div>
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontWeight: 800, fontSize: 18, color: 'var(--color-warning)' }}>
                          {formatCurrency(totalPending)}
                        </div>
                        <div className="muted" style={{ fontSize: 11 }}>of {formatCurrency(totalEarned)}</div>
                      </div>
                    </div>
                    <div className="muted" style={{ fontSize: 12, textAlign: 'center', marginBottom: 8 }}>
                      {expandedId === worker.id ? '↑ Hide breakdown' : '↓ Tap for day-by-day breakdown'}
                    </div>
                  </div>

                  {expandedId === worker.id && (
                    <WorkerBreakdown worker={worker} sessions={sessions} totalPaid={totalPaid} />
                  )}

                  {/* FIX 3: Pay Now button toggles inline panel */}
                  <div style={{ marginTop: 12 }}>
                    <Button
                      block
                      variant={payingId === worker.id ? 'outline' : 'success'}
                      small
                      onClick={() => {
                        if (payingId === worker.id) closePay()
                        else openPay(worker, totalPending)
                      }}
                      icon={payingId === worker.id ? undefined : '💸'}
                    >
                      {payingId === worker.id ? 'Cancel Payment' : 'Pay Now'}
                    </Button>
                  </div>

                  {/* FIX 3: Inline payment panel — appears right below Pay Now */}
                  {payingId === worker.id && (
                    <InlinePayPanel worker={worker} totalPending={totalPending} />
                  )}
                </Card>
              ))}
            </>
          )}

          {paidWorkers.length > 0 && (
            <>
              <h2 className="section-title" style={{ marginTop: pendingWorkers.length > 0 ? 22 : 0 }}>
                🟢 All Paid
              </h2>
              {paidWorkers.map(({ worker, sessions, totalPaid, totalEarned, totalHours }) => (
                <Card key={worker.id}>
                  <div
                    onClick={() => setExpandedId(expandedId === worker.id ? null : worker.id)}
                    className="card-row"
                    style={{ cursor: 'pointer', marginBottom: expandedId === worker.id ? 8 : 0 }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div className="avatar" style={{ background: 'var(--color-success)' }}>
                        {worker.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontWeight: 700 }}>{worker.name}</div>
                        <div className="muted" style={{ fontSize: 12 }}>{totalHours}h · {formatCurrency(totalEarned)} total</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Chip variant="paid">🟢 Paid</Chip>
                      <span className="muted">{expandedId === worker.id ? '↑' : '↓'}</span>
                    </div>
                  </div>
                  {expandedId === worker.id && (
                    <WorkerBreakdown worker={worker} sessions={sessions} totalPaid={totalPaid} />
                  )}
                </Card>
              ))}
            </>
          )}

          {grandTotalPending === 0 && paidWorkers.length === 0 && (
            <EmptyState emoji="📋" title="No work logged yet." subtitle="Use Work Log to record daily work." />
          )}
        </>
      )}

      <Navbar />
    </div>
  )
}
