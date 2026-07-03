// Pure math helpers — no storage code here, just numbers.

export function calculateWage(hours, hourlyWage) {
  const h = Number(hours) || 0
  const r = Number(hourlyWage) || 0
  return Math.round(h * r)
}

export function formatCurrency(amount) {
  const value = Math.round(Number(amount) || 0)
  return '₹' + value.toLocaleString('en-IN')
}

// Gets the wage for a single session.
// Priority: wageOverride (fixed day) → session.hourlyWage → fallbackHourlyWage
export function getSessionWage(session, fallbackHourlyWage = 0) {
  if (session.wageOverride != null && session.wageOverride > 0) {
    return Math.round(session.wageOverride)
  }
  const rate =
    session.hourlyWage != null && session.hourlyWage > 0
      ? session.hourlyWage
      : fallbackHourlyWage
  return calculateWage(session.hours, rate)
}

// Summarizes sessions for one worker.
// totalPaidManual = total from payments array (overrides session.paid flags).
export function summarizeWorkerSessions(sessions = [], fallbackHourlyWage = 0, totalPaidManual = null) {
  let totalHours = 0
  let totalEarned = 0
  let totalPaidFromSessions = 0

  sessions.forEach((s) => {
    const wage = getSessionWage(s, fallbackHourlyWage)
    totalHours += Number(s.hours) || 0
    totalEarned += wage
    if (s.paid) totalPaidFromSessions += wage
  })

  const totalPaid =
    totalPaidManual !== null
      ? Math.min(Number(totalPaidManual) || 0, totalEarned)
      : totalPaidFromSessions

  return { totalHours, totalEarned, totalPaid, totalPending: totalEarned - totalPaid }
}

// FIX 1: Distributes totalPaid across sessions oldest-first.
// Supports partial payment of a single session:
//   e.g. sessions [₹200, ₹500, ₹300], totalPaid = ₹500
//   → ₹200 session: paid ✅
//   → ₹500 session: ₹300 paid, ₹200 pending (status: 'partial')
//   → ₹300 session: unpaid
//
// Returns array of { session, wage, paidAmount, pendingAmount, status }
// where status is 'paid' | 'partial' | 'unpaid'
// Array is sorted oldest-first so UI can show chronological breakdown.
export function computeSessionPaymentStatuses(sessions = [], totalPaid = 0, fallbackHourlyWage = 0) {
  const sorted = [...sessions].sort((a, b) => (a.date > b.date ? 1 : -1))
  let remaining = Math.max(0, Number(totalPaid) || 0)

  return sorted.map((s) => {
    const wage = getSessionWage(s, fallbackHourlyWage)
    let paidAmount = 0
    let status = 'unpaid'

    if (wage === 0) {
      // Zero-wage sessions (e.g. absent) are treated as paid automatically
      status = 'paid'
    } else if (remaining >= wage) {
      paidAmount = wage
      status = 'paid'
      remaining -= wage
    } else if (remaining > 0) {
      paidAmount = remaining
      status = 'partial'
      remaining = 0
    }

    return { session: s, wage, paidAmount, pendingAmount: wage - paidAmount, status }
  })
}
