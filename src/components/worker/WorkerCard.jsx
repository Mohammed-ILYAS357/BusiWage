// One row in the Workers list — name, wage, and a quick payment status dot.

import Card from '../common/Card'
import Chip from '../common/Chip'
import { formatCurrency } from '../../utils/wage'

export default function WorkerCard({ worker, pendingAmount, onClick }) {
  const initial = worker.name?.charAt(0).toUpperCase() || '?'
  return (
    <Card onClick={onClick} style={{ cursor: 'pointer' }}>
      <div className="card-row">
        <div className="card-row" style={{ gap: 12 }}>
          <div className="avatar">{initial}</div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 16 }}>{worker.name}</div>
            <div className="muted" style={{ fontSize: 13 }}>₹{worker.hourlyWage}/hour</div>
          </div>
        </div>
        {pendingAmount > 0 ? (
          <Chip variant="pending">{formatCurrency(pendingAmount)} due</Chip>
        ) : (
          <Chip variant="paid">All Paid</Chip>
        )}
      </div>
    </Card>
  )
}
