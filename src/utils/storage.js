// Every piece of BusiWage's data lives in the browser's localStorage —
// that's what makes the app work completely offline. This file is the
// only place that talks to localStorage directly; everything else goes
// through DataContext, which uses these functions.
// All data lives here in localStorage — fully offline, no internet needed.

const KEY = 'busiwage_data_v1'

const EMPTY_DATA = {
  workers: [],   // { id, name, hourlyWage, phone }
  sites: [],     // { id, name, client, location, startDate, endDate, notes }
  sessions: [],  // { id, date, workerId, siteId, inTime, outTime, hours, hourlyWage, paid }
  notes: {},     // { "2026-06-29": "Heavy rain today..." }
  payments: [],  // { id, workerId, amount, date, note }  ← NEW
}

export function loadData() {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return { ...EMPTY_DATA }
    const parsed = JSON.parse(raw)
    // Merge so old saved data still works even after we add new fields.
    return { ...EMPTY_DATA, ...parsed }
  } catch (err) {
    console.error('Could not read saved data, starting fresh.', err)
    return { ...EMPTY_DATA }
  }
}

export function saveData(data) {
  try {
    localStorage.setItem(KEY, JSON.stringify(data))
    return true
  } catch (err) {
    console.error('Could not save data.', err)
    return false
  }
}