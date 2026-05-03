import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { Observation } from '../types/fhir'

interface Props {
  observations: Observation[]
}

interface VolatilityPoint {
  window: string
  range: number
}

function getWindowLabel(dateTime: string): string {
  const date = new Date(dateTime)
  const hour = date.getHours()
  const bucketStart = Math.floor(hour / 4) * 4
  const bucketEnd = bucketStart + 3
  return `${bucketStart.toString().padStart(2, '0')}:00-${bucketEnd.toString().padStart(2, '0')}:59`
}

export function PatientVolatilityChart({ observations }: Props) {
  const buckets = observations.reduce<Record<string, number[]>>((acc, obs) => {
    const key = getWindowLabel(obs.effectiveDateTime)
    if (!acc[key]) {
      acc[key] = []
    }
    acc[key].push(obs.valueQuantity.value)
    return acc
  }, {})

  const data: VolatilityPoint[] = Object.entries(buckets)
    .map(([window, values]) => {
      const min = Math.min(...values)
      const max = Math.max(...values)
      return {
        window,
        range: Number((max - min).toFixed(2)),
      }
    })
    .sort((a, b) => a.window.localeCompare(b.window))

  return (
    <div className="rounded-xl border border-company-border bg-company-surface/80 p-4">
      <p className="mb-3 text-xs uppercase tracking-wide text-company-muted">Volatility by 4h Window</p>
      {data.length === 0 ? (
        <p className="text-sm text-company-muted">No observations for selected patient.</p>
      ) : (
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#263141" />
            <XAxis dataKey="window" stroke="#7f93ad" tick={{ fontSize: 10 }} />
            <YAxis stroke="#7f93ad" />
            <Tooltip contentStyle={{ backgroundColor: '#141b26', border: '1px solid #263141', borderRadius: 8 }} />
            <Bar dataKey="range" fill="#f2b84b" radius={[4, 4, 0, 0]} name="Range (max-min)" />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}
