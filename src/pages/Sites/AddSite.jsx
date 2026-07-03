// FIX 2: Checks for duplicate site names before saving.

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useData } from '../../context/DataContext'
import Header from '../../components/common/Header'
import Button from '../../components/common/Button'

export default function AddSite() {
  const { addSite, sites } = useData()
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [client, setClient] = useState('')
  const [location, setLocation] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [notes, setNotes] = useState('')
  const [error, setError] = useState('')

  function handleSave() {
    setError('')
    const trimmedName = name.trim()
    if (!trimmedName) return setError('Please enter the site name.')

    // FIX 2: Prevent duplicate site names
    const duplicate = sites.find(
      (s) => s.name.toLowerCase() === trimmedName.toLowerCase()
    )
    if (duplicate) return setError(`A site named "${trimmedName}" already exists.`)

    addSite({
      name: trimmedName,
      client: client.trim(), location: location.trim(),
      startDate, endDate, notes: notes.trim(),
    })
    navigate('/sites')
  }

  return (
    <div className="page page-narrow">
      <Header title="Add Site" actionIcon="✕" onAction={() => navigate('/sites')} />

      {error && <div className="banner banner-error">{error}</div>}

      <div className="field">
        <label>🏗️ Site Name</label>
        <input
          type="text" placeholder="e.g. Apartment A"
          value={name} onChange={(e) => setName(e.target.value)}
        />
      </div>

      <div className="field">
        <label>👤 Client Name (Optional)</label>
        <input
          type="text" placeholder="e.g. Mr. Sharma"
          value={client} onChange={(e) => setClient(e.target.value)}
        />
      </div>

      <div className="field">
        <label>📍 Location (Optional)</label>
        <input
          type="text" placeholder="e.g. MG Road"
          value={location} onChange={(e) => setLocation(e.target.value)}
        />
      </div>

      <div className="time-row">
        <div className="field">
          <label>Start Date (Optional)</label>
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        </div>
        <div className="field">
          <label>Expected End (Optional)</label>
          <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
        </div>
      </div>

      <div className="field">
        <label>📌 Notes (Optional)</label>
        <textarea
          placeholder="Anything worth remembering about this site..."
          value={notes} onChange={(e) => setNotes(e.target.value)}
        />
      </div>

      <Button block onClick={handleSave}>Save Site</Button>
    </div>
  )
}
