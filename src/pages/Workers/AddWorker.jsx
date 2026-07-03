// FIX 2: Checks for duplicate worker names before saving.

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useData } from '../../context/DataContext'
import Header from '../../components/common/Header'
import Button from '../../components/common/Button'

export default function AddWorker() {
  const { addWorker, workers } = useData()
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [hourlyWage, setHourlyWage] = useState('')
  const [phone, setPhone] = useState('')
  const [error, setError] = useState('')

  function handleSave() {
    setError('')
    const trimmedName = name.trim()
    if (!trimmedName) return setError("Please enter the worker's name.")
    if (!hourlyWage || Number(hourlyWage) <= 0) return setError('Please enter the hourly wage.')

    // FIX 2: Prevent duplicate worker names
    const duplicate = workers.find(
      (w) => w.name.toLowerCase() === trimmedName.toLowerCase()
    )
    if (duplicate) return setError(`A worker named "${trimmedName}" already exists.`)

    addWorker({ name: trimmedName, hourlyWage: Number(hourlyWage), phone: phone.trim() })
    navigate('/workers')
  }

  return (
    <div className="page page-narrow">
      <Header title="Add Worker" actionIcon="✕" onAction={() => navigate('/workers')} />

      {error && <div className="banner banner-error">{error}</div>}

      <div className="field">
        <label>👷 Worker's Name</label>
        <input
          type="text" placeholder="e.g. Ravi Kumar"
          value={name} onChange={(e) => setName(e.target.value)}
        />
      </div>

      <div className="field">
        <label>💵 Hourly Wage (₹)</label>
        <input
          type="number" inputMode="decimal" placeholder="e.g. 60"
          value={hourlyWage} onChange={(e) => setHourlyWage(e.target.value)}
        />
      </div>

      <div className="field">
        <label>📞 Phone Number (Optional)</label>
        <input
          type="tel" inputMode="numeric" maxLength={10} placeholder="98765 43210"
          value={phone} onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
        />
      </div>

      <Button block onClick={handleSave}>Save Worker</Button>
    </div>
  )
}
