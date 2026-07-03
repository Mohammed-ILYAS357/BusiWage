// FIX 1: Uses computeSessionPaymentStatuses for accurate green/yellow cells
// Partial payments (e.g. ₹300 of a ₹500 session) are reflected correctly.

import { useState } from 'react'
import { useData } from '../../context/DataContext'
import {
  todayStr, shiftMonth, getMonthMatrix, MONTH_NAMES,
  formatDisplayDate, formatTime12h,
} from '../../utils/date'
import { computeSessionPaymentStatuses, formatCurrency } from '../../utils/wage'
import Header from '../../components/common/Header'
import Navbar from '../../components/common/Navbar'

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

function shortAmt(n) {
  if (n >= 10000) return '₹' + Math.round(n / 1000) + 'k'
  if (n >= 1000) return '₹' + (n / 1000).toFixed(1).replace('.0', '') + 'k'
  return '₹' + n
}

export default function Calendar() {
  const { sessions, notes, workers, getWorker, getSite, getTotalPaidForWorker } = useData()
  const today = todayStr()
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth())
  const [selectedDate, setSelectedDate] = useState(today)

  function goPrev() {
    const { year: y, month: m } = shiftMonth(year, month, -1)
    setYear(y); setMonth(m)
  }
  function goNext() {
    const { year: y, month: m } = shiftMonth(year, month, 1)
    setYear(y); setMonth(m)
  }

  // FIX 1: Build dayMap using computeSessionPaymentStatuses so partial
  // payments (e.g. ₹300 of ₹500 session) are correctly reflected.
  // A day turns green only when all its wage is fully covered.
  const dayMap = {}
  workers.forEach((w) => {
    const wSessions = sessions.filter((s) => s.workerId === w.id)
    const totalPaid = getTotalPaidForWorker(w.id)
    const statuses = computeSessionPaymentStatuses(wSessions, totalPaid, w.hourlyWage)
    statuses.forEach(({ session, wage, paidAmount }) => {
      if (!dayMap[session.date]) dayMap[session.date] = { total: 0, paid: 0 }
      dayMap[session.date].total += wage
      dayMap[session.date].paid += paidAmount
    })
  })

  const weeks = getMonthMatrix(year, month)

  // Diary data
  const daySessions = sessions.filter((s) => s.date === selectedDate)
  const dayNote = notes[selectedDate] || ''
  const dayWorkerIds = [...new Set(daySessions.map((s) => s.workerId))]
  const daySiteIds = [...new Set(daySessions.map((s) => s.siteId))]
  const totalHours = daySessions.reduce((sum, s) => sum + (Number(s.hours) || 0), 0)

  // Payment totals for selected date from dayMap
  const selectedDayData = dayMap[selectedDate]
  const dayTotalWage = selectedDayData?.total || 0
  const dayPaidWage = selectedDayData?.paid || 0
  const dayPendingWage = dayTotalWage - dayPaidWage

  return (
    <div className="page">
      <Header title="Calendar" />

      <div className="calendar-header">
        <button className="calendar-nav-btn" onClick={goPrev}>‹</button>
        <h3>{MONTH_NAMES[month]} {year}</h3>
        <button className="calendar-nav-btn" onClick={goNext}>›</button>
      </div>

      <div className="calendar-weekdays">
        {WEEKDAYS.map((d, i) => <div key={i}>{d}</div>)}
      </div>

      <div className="calendar-grid" style={{ marginBottom: 10 }}>
        {weeks.flat().map((cell, i) => {
          if (!cell) return <div key={i} className="calendar-cell empty" />

          const d = dayMap[cell.dateStr]
          const hasActivity = !!d && d.total > 0
          // Green only when every rupee earned that day is paid
          const allPaid = hasActivity && d.paid >= d.total
          const isToday = cell.dateStr === today
          const isSelected = cell.dateStr === selectedDate

          let bgColor = 'var(--color-unmarked)'
          let textColor = 'var(--color-text)'
          if (allPaid) { bgColor = 'var(--color-success)'; textColor = '#fff' }
          else if (hasActivity) { bgColor = 'var(--color-warning)'; textColor = '#fff' }

          return (
            <div
              key={cell.dateStr}
              className={`calendar-cell${isToday ? ' today' : ''}`}
              onClick={() => setSelectedDate(cell.dateStr)}
              style={{
                background: bgColor, color: textColor,
                outline: isSelected ? '2px solid var(--color-navy)' : 'none',
                outlineOffset: 1,
              }}
            >
              <span style={{ fontSize: 13, display: 'block', fontWeight: 700 }}>{cell.day}</span>
              {hasActivity && (
                <span style={{ fontSize: 8, fontWeight: 700, display: 'block', lineHeight: 1.2, opacity: 0.95 }}>
                  {shortAmt(d.total)}
                </span>
              )}
            </div>
          )
        })}
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 20, flexWrap: 'wrap' }}>
        {[
          { color: 'var(--color-success)', label: 'All Paid' },
          { color: 'var(--color-warning)', label: 'Pending / Partial' },
          { color: 'var(--color-unmarked)', label: 'No Work' },
        ].map((item) => (
          <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, color: 'var(--color-text-light)' }}>
            <span style={{ width: 12, height: 12, borderRadius: 3, background: item.color, display: 'inline-block' }} />
            {item.label}
          </div>
        ))}
      </div>

      {/* Diary view */}
      <h2 className="section-title" style={{ marginBottom: 14 }}>
        📖 {formatDisplayDate(selectedDate)}{selectedDate === today ? ' (Today)' : ''}
      </h2>

      {daySessions.length === 0 && !dayNote ? (
        <div className="card text-center" style={{ padding: '30px 16px', color: 'var(--color-text-light)' }}>
          ⚪ Nothing recorded on this date.
        </div>
      ) : (
        <>
          {/* Payment summary */}
          {dayTotalWage > 0 && (
            <div className="card" style={{ marginBottom: 14 }}>
              <div className="diary-section-title" style={{ marginBottom: 10 }}>💰 Daily Payment</div>
              <div className="card-row" style={{ marginBottom: 6 }}>
                <span style={{ fontWeight: 600 }}>Total</span>
                <span style={{ fontWeight: 800, fontSize: 18 }}>{formatCurrency(dayTotalWage)}</span>
              </div>
              {dayPaidWage > 0 && (
                <div className="card-row" style={{ marginBottom: 4 }}>
                  <span style={{ color: 'var(--color-success)', fontWeight: 600 }}>🟢 Paid</span>
                  <span style={{ color: 'var(--color-success)', fontWeight: 700 }}>{formatCurrency(dayPaidWage)}</span>
                </div>
              )}
              {dayPendingWage > 0 && (
                <div className="card-row">
                  <span style={{ color: 'var(--color-warning)', fontWeight: 600 }}>🟡 Pending</span>
                  <span style={{ color: 'var(--color-warning)', fontWeight: 700 }}>{formatCurrency(dayPendingWage)}</span>
                </div>
              )}
            </div>
          )}

          {daySiteIds.length > 0 && (
            <div className="diary-section">
              <div className="diary-section-title">🏗️ Sites Worked</div>
              {daySiteIds.map((id) => {
                const site = getSite(id)
                return (
                  <div key={id} className="diary-row">
                    <span style={{ fontWeight: 700 }}>{site?.name || 'Unknown site'}</span>
                    {site?.location && <span className="muted" style={{ fontSize: 12 }}>📍 {site.location}</span>}
                  </div>
                )
              })}
            </div>
          )}

          {dayWorkerIds.length > 0 && (
            <div className="diary-section">
              <div className="diary-section-title">👷 Workers Present</div>
              {dayWorkerIds.map((id) => {
                const worker = getWorker(id)
                const workerSessions = daySessions.filter((s) => s.workerId === id)
                const workerHours = workerSessions.reduce((sum, s) => sum + (Number(s.hours) || 0), 0)
                // Use computeSessionPaymentStatuses for this worker's per-day paid amount
                const allWkrSessions = sessions.filter((s) => s.workerId === id)
                const totalPaid = getTotalPaidForWorker(id)
                const statuses = computeSessionPaymentStatuses(allWkrSessions, totalPaid, worker?.hourlyWage || 0)
                const dayStatuses = statuses.filter((x) => x.session.date === selectedDate)
                const workerDayWage = dayStatuses.reduce((sum, x) => sum + x.wage, 0)
                const workerDayPaid = dayStatuses.reduce((sum, x) => sum + x.paidAmount, 0)
                return (
                  <div key={id} className="diary-row">
                    <div>
                      <span style={{ fontWeight: 700 }}>{worker?.name || 'Unknown'}</span>
                      <div className="muted" style={{ fontSize: 12 }}>
                        {workerSessions.map((s, idx) => (
                          <span key={idx}>
                            {formatTime12h(s.inTime)}–{formatTime12h(s.outTime)}
                            {idx < workerSessions.length - 1 ? ', ' : ''}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: 700, color: 'var(--color-info)', fontSize: 14 }}>{workerHours}h</div>
                      <div style={{ fontSize: 12, fontWeight: 600 }}>{formatCurrency(workerDayWage)}</div>
                      {workerDayPaid > 0 && workerDayPaid < workerDayWage && (
                        <div style={{ fontSize: 11, color: 'var(--color-warning)' }}>
                          ₹{workerDayPaid} paid
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {totalHours > 0 && (
            <div className="diary-section">
              <div className="diary-section-title">⏱️ Total Hours</div>
              <div className="card-row">
                <span style={{ fontWeight: 700, fontSize: 18 }}>{totalHours} hours</span>
                <span className="muted" style={{ fontSize: 13 }}>
                  {dayWorkerIds.length} worker{dayWorkerIds.length !== 1 ? 's' : ''}
                </span>
              </div>
            </div>
          )}

          {dayNote && (
            <div className="diary-section">
              <div className="diary-section-title">📝 Notes</div>
              {dayNote.split('\n—\n').map((entry, i, arr) => (
                <div key={i} className="diary-note-box"
                  style={{ marginBottom: i < arr.length - 1 ? 8 : 0, fontSize: 13 }}>
                  {entry}
                </div>
              ))}
            </div>
          )}
        </>
      )}

      <div style={{ height: 20 }} />
      <Navbar />
    </div>
  )
}
