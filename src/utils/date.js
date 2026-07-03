// Helper functions for working with dates. Dates are always stored as
// plain "YYYY-MM-DD" text — easy to compare, sort, and use as a key.

export function todayStr() {
  return toDateStr(new Date())
}

export function toDateStr(d) {
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// "2026-06-29" -> "Mon, 29 Jun 2026"
export function formatDisplayDate(dateStr) {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-IN', {
    weekday: 'short', day: '2-digit', month: 'short', year: 'numeric',
  })
}

// "2026-06-29" -> "29 Jun"
export function formatShortDate(dateStr) {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })
}

export function addDays(dateStr, n) {
  const d = new Date(dateStr + 'T00:00:00')
  d.setDate(d.getDate() + n)
  return toDateStr(d)
}

// How many whole days from today until dateStr (negative if in the past).
export function daysFromToday(dateStr) {
  const today = new Date(todayStr() + 'T00:00:00')
  const target = new Date(dateStr + 'T00:00:00')
  return Math.round((target - today) / 86400000)
}

export const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

export function shiftMonth(year, month, delta) {
  let m = month + delta
  let y = year
  if (m < 0) { m = 11; y -= 1 }
  if (m > 11) { m = 0; y += 1 }
  return { year: y, month: m }
}

// Builds a calendar grid (array of weeks of 7 cells) for one month.
// Each cell is either null (blank padding) or { dateStr, day }.
export function getMonthMatrix(year, month) {
  const firstDay = new Date(year, month, 1)
  const startWeekday = firstDay.getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const cells = []
  for (let i = 0; i < startWeekday; i++) cells.push(null)
  for (let day = 1; day <= daysInMonth; day++) {
    const d = new Date(year, month, day)
    cells.push({ dateStr: toDateStr(d), day })
  }
  while (cells.length % 7 !== 0) cells.push(null)

  const weeks = []
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7))
  return weeks
}

// Converts "08:00" (24h, from <input type="time">) to "8:00 AM" for display.
export function formatTime12h(time24) {
  if (!time24) return ''
  const [hStr, mStr] = time24.split(':')
  let h = parseInt(hStr, 10)
  const ampm = h >= 12 ? 'PM' : 'AM'
  h = h % 12
  if (h === 0) h = 12
  return `${h}:${mStr} ${ampm}`
}

// Hours between two "HH:MM" 24-hour times, rounded to nearest 0.25h.
// Handles overnight shifts (out time earlier than in time) by assuming
// the work crossed midnight.
export function hoursBetween(inTime, outTime) {
  if (!inTime || !outTime) return 0
  const [inH, inM] = inTime.split(':').map(Number)
  const [outH, outM] = outTime.split(':').map(Number)
  let minutes = (outH * 60 + outM) - (inH * 60 + inM)
  if (minutes < 0) minutes += 24 * 60
  return Math.round((minutes / 60) * 4) / 4
}
