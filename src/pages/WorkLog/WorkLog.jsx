// FIX 2: Default IN time = previous session's OUT time on same day
// FIX 4: Note timestamp includes session IN-OUT time
// FIX 5: Sites filtered by selected date range
// FIX 6: Notes append, never overwrite

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useData } from '../../context/DataContext'
import { todayStr, hoursBetween, formatTime12h, daysFromToday } from '../../utils/date'
import { calculateWage, formatCurrency } from '../../utils/wage'
import Header from '../../components/common/Header'
import Navbar from '../../components/common/Navbar'
import Button from '../../components/common/Button'
import EmptyState from '../../components/common/EmptyState'
import WorkerSelectList from '../../components/worklog/WorkerSelectList'

const TOTAL_STEPS = 5

function toMins(t) {
  if (!t) return 0
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}
function timesOverlap(in1, out1, in2, out2) {
  return toMins(in1) < toMins(out2) && toMins(in2) < toMins(out1)
}

function StepTrack({ current }) {
  return (
    <div className="step-track">
      {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
        <div key={i} className={`step-dot${i < current ? ' done' : i === current ? ' active' : ''}`} />
      ))}
    </div>
  )
}

export default function WorkLog() {
  const { workers, sites, sessions, addSession, appendNoteForDate, notes } = useData()
  const navigate = useNavigate()
  const today = todayStr()

  const [step, setStep] = useState(0)
  const [date, setDate] = useState(today)
  const [siteId, setSiteId] = useState('')
  const [selectedWorkerIds, setSelectedWorkerIds] = useState([])
  const [rateMode, setRateMode] = useState({})
  const [rateOverrides, setRateOverrides] = useState({})
  const [wageOverrides, setWageOverrides] = useState({})
  const [inTime, setInTime] = useState('08:00')
  const [outTime, setOutTime] = useState('17:00')
  const [paid, setPaid] = useState(false)
  const [newNoteText, setNewNoteText] = useState('')
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)

  const hours = hoursBetween(inTime, outTime)

  // FIX 5: Only sites active on the chosen date
  const sitesForDate = sites.filter((s) => {
    if (s.startDate && s.startDate > date) return false
    if (s.endDate && s.endDate < date) return false
    return true
  })

  function getMode(w) { return rateMode[w] || 'hourly' }
  function getRate(workerId) {
    const w = workers.find((x) => x.id === workerId)
    return rateOverrides[workerId] !== undefined ? rateOverrides[workerId] : (w?.hourlyWage || 0)
  }
  function getFixedWage(workerId) {
    return wageOverrides[workerId] !== undefined ? wageOverrides[workerId] : ''
  }
  function getEffectiveWage(workerId) {
    if (getMode(workerId) === 'fixed') return Number(getFixedWage(workerId)) || 0
    return calculateWage(hours, getRate(workerId))
  }
  function handleRateChange(workerId, val) {
    setRateOverrides((prev) => ({ ...prev, [workerId]: val === '' ? '' : Number(val) }))
  }
  function handleWageChange(workerId, val) {
    setWageOverrides((prev) => ({ ...prev, [workerId]: val === '' ? '' : Number(val) }))
  }
  function toggleWorker(id) {
    setSelectedWorkerIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }

  function checkOverlap() {
    const conflicts = []
    for (const workerId of selectedWorkerIds) {
      const worker = workers.find((w) => w.id === workerId)
      for (const s of sessions.filter((s) => s.workerId === workerId && s.date === date)) {
        if (timesOverlap(inTime, outTime, s.inTime, s.outTime)) {
          conflicts.push(
            `${worker?.name} already has a session from ${formatTime12h(s.inTime)} to ${formatTime12h(s.outTime)} on this date.`
          )
        }
      }
    }
    return conflicts
  }

  function next() {
    setError('')
    if (step === 0) {
      if (!date) return setError('Please pick a date.')
      if (date > today) return setError('You can only log work for today or past dates.')
    }
    if (step === 1 && !siteId) return setError('Please choose a site.')
    if (step === 2 && selectedWorkerIds.length === 0)
      return setError('Please select at least one worker.')
    if (step === 2) {
      // FIX 2: When moving to time step, set default IN time = last OUT time that day
      const daySessions = sessions.filter((s) => s.date === date)
      if (daySessions.length > 0) {
        const latestOut = daySessions.reduce(
          (latest, s) => (s.outTime > latest ? s.outTime : latest),
          '00:00'
        )
        setInTime(latestOut)
      }
    }
    if (step === 3) {
      if (hours <= 0) return setError('OUT time must be after IN time.')
      const conflicts = checkOverlap()
      if (conflicts.length > 0) return setError(conflicts[0])
    }
    setStep((s) => s + 1)
  }

  function back() { setError(''); setStep((s) => s - 1) }

  function handleSave() {
    selectedWorkerIds.forEach((workerId) => {
      const mode = getMode(workerId)
      addSession({
        date, workerId, siteId, inTime, outTime, hours,
        hourlyWage: mode === 'hourly' ? Number(getRate(workerId)) || 0 : 0,
        wageOverride: mode === 'fixed' ? Number(getFixedWage(workerId)) || null : null,
        paid,
      })
    })
    // FIX 4 + FIX 6: Append with session time in the timestamp
    if (newNoteText.trim()) {
      const sessionTimeStr = `${formatTime12h(inTime)} – ${formatTime12h(outTime)}`
      appendNoteForDate(date, newNoteText.trim(), sessionTimeStr)
    }
    setSaved(true)
  }

  function resetWizard() {
    setSaved(false); setStep(0); setSelectedWorkerIds([])
    setSiteId(''); setPaid(false); setNewNoteText('')
    setRateMode({}); setRateOverrides({}); setWageOverrides({})
    setInTime('08:00'); setOutTime('17:00')
  }

  if (saved) {
    return (
      <div className="page" style={{ textAlign: 'center', paddingTop: 60 }}>
        <div style={{ fontSize: 60, marginBottom: 18 }}>✅</div>
        <h2 style={{ marginBottom: 8 }}>Work Log Saved!</h2>
        <p className="muted" style={{ marginBottom: 32 }}>
          {selectedWorkerIds.length} worker{selectedWorkerIds.length > 1 ? 's' : ''} recorded
          for {date === today ? 'today' : date}.
        </p>
        <Button block onClick={resetWizard}>Log More Work</Button>
        <div style={{ marginTop: 14 }}>
          <Button block variant="outline" onClick={() => navigate('/calendar')}>View Calendar</Button>
        </div>
        <Navbar />
      </div>
    )
  }

  return (
    <div className="page">
      <Header title="Work Log" />
      <StepTrack current={step} />
      {error && <div className="banner banner-error">{error}</div>}

      {/* ── Step 0: Date ── */}
      {step === 0 && (
        <>
          <h2 className="section-title">📅 Which date?</h2>
          <div className="field">
            <label>Date of Work</label>
            <input type="date" value={date} max={today}
              onChange={(e) => { setDate(e.target.value); setSiteId('') }}
            />
            <div className="field-hint">Only today or past dates allowed.</div>
          </div>
          <Button block onClick={next}>Next →</Button>
        </>
      )}

      {/* ── Step 1: Site (filtered by date) ── */}
      {step === 1 && (
        <>
          <h2 className="section-title">🏗️ Choose Site</h2>
          <div className="field-hint" style={{ marginBottom: 10 }}>Showing sites active on {date}</div>
          {sitesForDate.length === 0 ? (
            <>
              <EmptyState emoji="🏗️" title="No sites active on this date."
                subtitle="Check start/end dates of your sites, or add a new one." />
              <Button block variant="outline" onClick={() => navigate('/sites/add')}>Add a Site</Button>
            </>
          ) : (
            <div className="worker-select-list">
              {sitesForDate.map((s) => (
                <div key={s.id}
                  className={`worker-select-item${siteId === s.id ? ' selected' : ''}`}
                  onClick={() => setSiteId(s.id)}
                >
                  <span className="checkbox">{siteId === s.id ? '✓' : ''}</span>
                  <div>
                    <div style={{ fontWeight: 700 }}>{s.name}</div>
                    {s.location && <div className="muted" style={{ fontSize: 12 }}>📍 {s.location}</div>}
                  </div>
                </div>
              ))}
            </div>
          )}
          <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
            <Button variant="outline" onClick={back}>← Back</Button>
            <Button block onClick={next}>Next →</Button>
          </div>
        </>
      )}

      {/* ── Step 2: Workers ── */}
      {step === 2 && (
        <>
          <h2 className="section-title">👷 Who worked on {date === today ? 'today' : date}?</h2>
          {workers.length === 0 ? (
            <>
              <EmptyState emoji="👷" title="No workers yet." subtitle="Add a worker first." />
              <Button block variant="outline" onClick={() => navigate('/workers/add')}>Add a Worker</Button>
            </>
          ) : (
            <WorkerSelectList workers={workers} selectedIds={selectedWorkerIds} onToggle={toggleWorker} />
          )}
          <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
            <Button variant="outline" onClick={back}>← Back</Button>
            <Button block onClick={next}>Next →</Button>
          </div>
        </>
      )}

      {/* ── Step 3: Time + per-worker pay ── */}
      {step === 3 && (
        <>
          <h2 className="section-title">🕒 Time & Pay</h2>

          <div className="time-row">
            <div className="field">
              <label>🕒 IN Time</label>
              <input type="time" value={inTime} onChange={(e) => setInTime(e.target.value)} />
            </div>
            <div className="field">
              <label>🕔 OUT Time</label>
              <input type="time" value={outTime} onChange={(e) => setOutTime(e.target.value)} />
            </div>
          </div>

          {/* FIX 2: Show hint if IN time was auto-filled from previous session */}
          {sessions.filter((s) => s.date === date).length > 0 && (
            <div className="field-hint" style={{ marginBottom: 10 }}>
              ⏰ IN time set from your last session today — adjust if needed.
            </div>
          )}

          {hours > 0 && <div className="hours-preview">⏱️ {hours} hours</div>}

          <div style={{ marginBottom: 16 }}>
            <div className="muted" style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>
              💵 Pay per worker
            </div>
            {selectedWorkerIds.map((workerId) => {
              const worker = workers.find((w) => w.id === workerId)
              const mode = getMode(workerId)
              const effectiveWage = getEffectiveWage(workerId)
              return (
                <div key={workerId} style={{
                  background: 'var(--color-card)', border: '1.5px solid var(--color-border)',
                  borderRadius: 'var(--radius-md)', padding: '12px 14px', marginBottom: 10,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div className="avatar" style={{ width: 34, height: 34, minWidth: 34, fontSize: 14 }}>
                        {worker?.name?.charAt(0).toUpperCase()}
                      </div>
                      <span style={{ fontWeight: 700, fontSize: 15 }}>{worker?.name}</span>
                    </div>
                    {effectiveWage > 0 && (
                      <span style={{ fontWeight: 800, color: 'var(--color-primary)', fontSize: 15 }}>
                        {formatCurrency(effectiveWage)}
                      </span>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                    {['hourly', 'fixed'].map((m) => (
                      <button key={m}
                        onClick={() => setRateMode((prev) => ({ ...prev, [workerId]: m }))}
                        style={{
                          flex: 1, padding: '7px', borderRadius: 8, fontSize: 13, fontWeight: 700,
                          border: '2px solid',
                          borderColor: mode === m ? (m === 'hourly' ? 'var(--color-secondary)' : 'var(--color-primary)') : 'var(--color-border)',
                          background: mode === m ? (m === 'hourly' ? 'var(--color-info-bg)' : '#FFF4ED') : 'transparent',
                          color: mode === m ? (m === 'hourly' ? 'var(--color-info)' : 'var(--color-primary)') : 'var(--color-text-light)',
                          cursor: 'pointer',
                        }}
                      >
                        {m === 'hourly' ? '⏱️ Hourly' : '📅 Fixed Day'}
                      </button>
                    ))}
                  </div>
                  {mode === 'hourly' && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span className="muted" style={{ fontSize: 13 }}>Rate: ₹</span>
                      <input type="number" inputMode="decimal" value={getRate(workerId)}
                        onChange={(e) => handleRateChange(workerId, e.target.value)}
                        style={{ width: 80, fontSize: 16, padding: '7px 10px', border: '2px solid var(--color-border)', borderRadius: 8, background: 'var(--color-bg)', color: 'var(--color-text)', fontFamily: 'var(--font-body)' }}
                      />
                      <span className="muted" style={{ fontSize: 13 }}>/hr</span>
                      {hours > 0 && (
                        <span className="muted" style={{ fontSize: 12 }}>
                          = {formatCurrency(calculateWage(hours, getRate(workerId)))}
                        </span>
                      )}
                    </div>
                  )}
                  {mode === 'fixed' && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span className="muted" style={{ fontSize: 13 }}>Total today: ₹</span>
                      <input type="number" inputMode="decimal" placeholder="e.g. 500"
                        value={getFixedWage(workerId)}
                        onChange={(e) => handleWageChange(workerId, e.target.value)}
                        style={{ width: 100, fontSize: 16, padding: '7px 10px', border: '2px solid var(--color-primary)', borderRadius: 8, background: 'var(--color-bg)', color: 'var(--color-text)', fontFamily: 'var(--font-body)' }}
                      />
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          <div style={{ marginBottom: 16 }}>
            <div className="muted" style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>💰 Payment Status</div>
            <div className="toggle-row">
              <button className={`toggle-btn pending${!paid ? ' active' : ''}`} onClick={() => setPaid(false)}>🟡 Pending</button>
              <button className={`toggle-btn paid${paid ? ' active' : ''}`} onClick={() => setPaid(true)}>🟢 Paid</button>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
            <Button variant="outline" onClick={back}>← Back</Button>
            <Button block onClick={next}>Next →</Button>
          </div>
        </>
      )}

      {/* ── Step 4: Note + Confirm ── */}
      {step === 4 && (
        <>
          <h2 className="section-title">📌 Daily Note (Optional)</h2>

          {notes[date] && (
            <div style={{ marginBottom: 14 }}>
              <div className="muted" style={{ fontSize: 11, fontWeight: 700, marginBottom: 6 }}>
                EXISTING NOTES FOR {date}:
              </div>
              {notes[date].split('\n—\n').map((entry, i, arr) => (
                <div key={i} className="diary-note-box" style={{ fontSize: 12, marginBottom: i < arr.length - 1 ? 6 : 0 }}>
                  {entry}
                </div>
              ))}
            </div>
          )}

          <div className="field">
            <label>{notes[date] ? 'Add to Note:' : 'Add a Note:'}</label>
            <textarea
              placeholder={'Heavy rain today.\nCement arrived late.\nRoof completed.'}
              value={newNoteText}
              onChange={(e) => setNewNoteText(e.target.value)}
              style={{ minHeight: 80 }}
            />
            {/* FIX 4: Preview the timestamp that will be added */}
            <div className="field-hint">
              Will be saved as: [{formatTime12h(inTime)} – {formatTime12h(outTime)} · now]
              {notes[date] ? ' — added below existing notes.' : ''}
            </div>
          </div>

          <div className="divider" />

          <div className="card" style={{ marginBottom: 16 }}>
            <div style={{ fontWeight: 700, marginBottom: 10 }}>📋 Summary</div>
            <div className="card-row muted" style={{ fontSize: 13 }}><span>Date</span><span>{date}</span></div>
            <div className="card-row muted" style={{ fontSize: 13, marginTop: 4 }}>
              <span>Site</span><span>{sitesForDate.find((s) => s.id === siteId)?.name}</span>
            </div>
            <div className="card-row muted" style={{ fontSize: 13, marginTop: 4 }}>
              <span>Time</span><span>{formatTime12h(inTime)} – {formatTime12h(outTime)} ({hours}h)</span>
            </div>
            <div className="card-row muted" style={{ fontSize: 13, marginTop: 4 }}>
              <span>Payment</span><span>{paid ? '🟢 Paid' : '🟡 Pending'}</span>
            </div>
            {selectedWorkerIds.map((wid) => {
              const w = workers.find((x) => x.id === wid)
              const mode = getMode(wid)
              const wage = getEffectiveWage(wid)
              return (
                <div className="card-row muted" key={wid} style={{ fontSize: 13, marginTop: 6 }}>
                  <span style={{ fontWeight: 600, color: 'var(--color-text)' }}>{w?.name}</span>
                  <span>
                    {formatCurrency(wage)}
                    <span style={{ fontSize: 11, marginLeft: 4 }}>
                      {mode === 'fixed' ? '(fixed)' : `@ ₹${getRate(wid)}/hr`}
                    </span>
                  </span>
                </div>
              )
            })}
          </div>

          <Button block onClick={handleSave} icon="✅">Save Work Log</Button>
          <div style={{ marginTop: 10 }}>
            <Button block variant="outline" onClick={back}>← Back</Button>
          </div>
        </>
      )}

      <Navbar />
    </div>
  )
}
