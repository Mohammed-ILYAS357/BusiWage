// FIX 1: Search bar filters sites by name.

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useData } from '../../context/DataContext'
import Header from '../../components/common/Header'
import Navbar from '../../components/common/Navbar'
import SiteCard from '../../components/site/SiteCard'
import EmptyState from '../../components/common/EmptyState'

export default function Sites() {
  const { sites } = useData()
  const navigate = useNavigate()
  const [searchTerm, setSearchTerm] = useState('')

  const filtered = sites.filter((s) =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (s.location || '').toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="page">
      <Header title="Sites" actionIcon="➕" onAction={() => navigate('/sites/add')} />

      {/* FIX 1: Search */}
      {sites.length > 0 && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          background: 'var(--color-card)', borderRadius: 'var(--radius-sm)',
          border: '2px solid var(--color-border)', padding: '10px 14px', marginBottom: 14,
        }}>
          <span>🔍</span>
          <input
            type="text" placeholder="Search sites or locations..."
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

      {sites.length === 0 ? (
        <EmptyState emoji="🏗️" title="No sites added yet." subtitle="Tap + to add your first site." />
      ) : filtered.length === 0 ? (
        <EmptyState emoji="🔍" title={`No site matching "${searchTerm}"`} subtitle="Try a different name." />
      ) : (
        filtered.map((s) => (
          <SiteCard key={s.id} site={s} onClick={() => navigate(`/sites/${s.id}`)} />
        ))
      )}

      <button className="fab" onClick={() => navigate('/sites/add')} aria-label="Add site">+</button>
      <Navbar />
    </div>
  )
}
