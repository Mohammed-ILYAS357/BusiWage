// One row in the Sites list — name, status, and dates at a glance.

import Card from '../common/Card'
import Chip from '../common/Chip'
import { daysFromToday } from '../../utils/date'

export default function SiteCard({ site, onClick }) {
  let statusVariant = 'info'
  let statusLabel = '🚧 Ongoing'

  if (site.endDate) {
    const daysLeft = daysFromToday(site.endDate)
    if (daysLeft < 0) { statusVariant = 'muted'; statusLabel = '✅ Completed' }
  }

  return (
    <Card onClick={onClick} style={{ cursor: 'pointer' }}>
      <div className="card-row">
        <div>
          <div style={{ fontWeight: 700, fontSize: 16 }}>{site.name}</div>
          <div className="muted" style={{ fontSize: 13, marginTop: 2 }}>
            {site.location ? `📍 ${site.location}` : site.client ? `👤 ${site.client}` : 'No location set'}
          </div>
        </div>
        <Chip variant={statusVariant}>{statusLabel}</Chip>
      </div>
    </Card>
  )
}
