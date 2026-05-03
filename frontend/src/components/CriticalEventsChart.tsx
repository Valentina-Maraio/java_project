import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { Observation } from '../types/fhir'

interface Props {
  observations: Observation[]
}

export function CriticalEventsChart({ observations }: Props) {
  const critical = observations.filter((obs) => obs.critical)
  const byHour = critical.reduce<Record<string, number>>((acc, obs) => {
    const dt = new Date(obs.effectiveDateTime)
    const key = `${dt.getHours().toString().padStart(2, '0')}:00`
    acc[key] = (acc[key] ?? 0) + 1
    return acc
  }, {})

  const data = Object.entries(byHour)
    .map(([time, count]) => ({ time, count }))
    .sort((a, b) => a.time.localeCompare(b.time))

  return (
    <div className="rounded-xl border border-company-border bg-company-surface/80 p-4">
      <p className="mb-3 text-xs uppercase tracking-wide text-company-muted">Critical Events Timeline</p>
      <ResponsiveContainer width="100%" height={260}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#263141" />
          <XAxis dataKey="time" stroke="#7f93ad" />
          <YAxis allowDecimals={false} stroke="#7f93ad" />
          <Tooltip contentStyle={{ backgroundColor: '#141b26', border: '1px solid #263141', borderRadius: 8 }} />
          <Line type="monotone" dataKey="count" stroke="#E64141" strokeWidth={2} dot={{ r: 3 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
