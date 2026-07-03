// FIX 1: Search bar added — filters workers by name in real time.

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useData } from '../../context/DataContext'
import { summarizeWorkerSessions } from '../../utils/wage'
import Header from '../../components/common/Header'
import Navbar from '../../components/common/Navbar'
import WorkerCard from '../../components/worker/WorkerCard'
import EmptyState from '../../components/common/EmptyState'

export default function Workers() {
  const { workers, getSessionsForWorker, getTotalPaidForWorker } = useData()
  const navigate = useNavigate()
  const [searchTerm, setSearchTerm] = useState('')

  const filtered = workers.filter((w) =>
    w.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="page">
      <Header title="Workers" actionIcon="➕" onAction={() => navigate('/workers/add')} />

      {/* FIX 1: Search */}
      {workers.length > 0 && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          background: 'var(--color-card)', borderRadius: 'var(--radius-sm)',
          border: '2px solid var(--color-border)', padding: '10px 14px', marginBottom: 14,
        }}>
          <span>🔍</span>
          <input
            type="text" placeholder="Search workers..."
            value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
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

      {workers.length === 0 ? (
        <EmptyState emoji="👷" title="No workers added yet." subtitle="Tap + to add your first worker." />
      ) : filtered.length === 0 ? (
        <EmptyState emoji="🔍" title={`No worker named "${searchTerm}"`} subtitle="Try a different name." />
      ) : (
        filtered.map((w) => {
          const summary = summarizeWorkerSessions(
            getSessionsForWorker(w.id), w.hourlyWage, getTotalPaidForWorker(w.id)
          )
          return (
            <WorkerCard
              key={w.id} worker={w}
              pendingAmount={summary.totalPending}
              onClick={() => navigate(`/workers/${w.id}`)}
            />
          )
        })
      )}

      <button className="fab" onClick={() => navigate('/workers/add')} aria-label="Add worker">+</button>
      <Navbar />
    </div>
  )
}
