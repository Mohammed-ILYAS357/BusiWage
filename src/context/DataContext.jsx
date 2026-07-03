import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { loadData, saveData } from '../utils/storage'
import { newId } from '../utils/id'
import { getSessionWage } from '../utils/wage'
import { todayStr } from '../utils/date'

const DataContext = createContext(null)

export function DataProvider({ children }) {
  const [data, setData] = useState(loadData)

  useEffect(() => { saveData(data) }, [data])

  // ── Workers ──────────────────────────────────────────────────────
  const addWorker = useCallback(({ name, hourlyWage, phone }) => {
    const worker = { id: newId(), name, hourlyWage: Number(hourlyWage), phone: phone || '' }
    setData((d) => ({ ...d, workers: [...d.workers, worker] }))
    return worker
  }, [])

  const updateWorker = useCallback((id, changes) => {
    setData((d) => ({
      ...d,
      workers: d.workers.map((w) => (w.id === id ? { ...w, ...changes } : w)),
    }))
  }, [])

  // ── Sites ─────────────────────────────────────────────────────────
  const addSite = useCallback(({ name, client, location, startDate, endDate, notes }) => {
    const site = {
      id: newId(), name,
      client: client || '', location: location || '',
      startDate: startDate || '', endDate: endDate || '',
      notes: notes || '',
    }
    setData((d) => ({ ...d, sites: [...d.sites, site] }))
    return site
  }, [])

  const updateSite = useCallback((id, changes) => {
    setData((d) => ({
      ...d,
      sites: d.sites.map((s) => (s.id === id ? { ...s, ...changes } : s)),
    }))
  }, [])

  // ── Work sessions ─────────────────────────────────────────────────
  const addSession = useCallback(
    ({ date, workerId, siteId, inTime, outTime, hours, hourlyWage, wageOverride, paid }) => {
      const session = {
        id: newId(), date, workerId, siteId, inTime, outTime,
        hours: Number(hours) || 0,
        hourlyWage: Number(hourlyWage) || 0,
        wageOverride: wageOverride != null ? Number(wageOverride) : null,
        paid: !!paid,
      }
      setData((d) => ({ ...d, sessions: [...d.sessions, session] }))
      return session
    }, []
  )

  const updateSession = useCallback((id, changes) => {
    setData((d) => ({
      ...d,
      sessions: d.sessions.map((s) => (s.id === id ? { ...s, ...changes } : s)),
    }))
  }, [])

  const deleteSession = useCallback((id) => {
    setData((d) => ({ ...d, sessions: d.sessions.filter((s) => s.id !== id) }))
  }, [])

  // ── Payments ──────────────────────────────────────────────────────
  // Adds a payment record. Does NOT touch session.paid flags —
  // computeSessionPaymentStatuses() in wage.js handles per-session status
  // by distributing the running total chronologically (oldest-first).
  const addPayment = useCallback((workerId, amount, note = '') => {
    const payment = {
      id: newId(), workerId,
      amount: Number(amount) || 0,
      date: todayStr(), note,
    }
    setData((d) => ({
      ...d,
      payments: [...(d.payments || []), payment],
    }))
  }, [])

  // ── Notes: FIX 6 (append) + FIX 4 (session timing in timestamp) ──
  // sessionTimeStr: e.g. "8:00 AM – 5:00 PM" — passed from WorkLog so
  // each note entry shows what session it was written during.
  const appendNoteForDate = useCallback((dateStr, text, sessionTimeStr = null) => {
    if (!text || !text.trim()) return
    setData((d) => {
      const existing = d.notes[dateStr]
      const clockTime = new Date().toLocaleTimeString('en-IN', {
        hour: '2-digit', minute: '2-digit', hour12: true,
      })
      // FIX 4: Timestamp shows both session time and wall-clock time
      const label = sessionTimeStr
        ? `[${sessionTimeStr} · ${clockTime}]`
        : `[${clockTime}]`
      const entry = `${label} ${text.trim()}`
      const newNote = existing ? existing + '\n—\n' + entry : entry
      return { ...d, notes: { ...d.notes, [dateStr]: newNote } }
    })
  }, [])

  const setNoteForDate = useCallback((dateStr, text) => {
    setData((d) => ({ ...d, notes: { ...d.notes, [dateStr]: text } }))
  }, [])

  // ── Lookups ───────────────────────────────────────────────────────
  function getWorker(id) { return data.workers.find((w) => w.id === id) || null }
  function getSite(id) { return data.sites.find((s) => s.id === id) || null }
  function getSessionsForDate(dateStr) { return data.sessions.filter((s) => s.date === dateStr) }
  function getSessionsForWorker(workerId) {
    return data.sessions
      .filter((s) => s.workerId === workerId)
      .sort((a, b) => (a.date < b.date ? 1 : -1))
  }

  // Total paid to a worker: sum of payments array.
  // Falls back to session.paid flags for old data with no payment records.
  function getTotalPaidForWorker(workerId) {
    const payments = data.payments || []
    const fromPayments = payments
      .filter((p) => p.workerId === workerId)
      .reduce((sum, p) => sum + (Number(p.amount) || 0), 0)

    if (fromPayments === 0) {
      const worker = getWorker(workerId)
      return data.sessions
        .filter((s) => s.workerId === workerId && s.paid)
        .reduce((sum, s) => sum + getSessionWage(s, worker?.hourlyWage || 0), 0)
    }
    return fromPayments
  }

  function getPaymentsForWorker(workerId) {
    return (data.payments || [])
      .filter((p) => p.workerId === workerId)
      .sort((a, b) => (a.date < b.date ? 1 : -1))
  }

  const value = {
    workers: data.workers,
    sites: data.sites,
    sessions: data.sessions,
    notes: data.notes,
    payments: data.payments || [],
    addWorker, updateWorker,
    addSite, updateSite,
    addSession, updateSession, deleteSession,
    addPayment,
    appendNoteForDate, setNoteForDate,
    getWorker, getSite, getSessionsForDate, getSessionsForWorker,
    getTotalPaidForWorker, getPaymentsForWorker,
  }

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>
}

export function useData() { return useContext(DataContext) }
