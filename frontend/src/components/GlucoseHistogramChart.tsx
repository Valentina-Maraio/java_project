import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { Observation } from '../types/fhir'

interface Props {
  observations: Observation[]
}

const BINS = [
  { key: '<70', min: Number.NEGATIVE_INFINITY, max: 70 },
  { key: '70-139', min: 70, max: 140 },
  { key: '140-199', min: 140, max: 200 },
  { key: '200-399', min: 200, max: 400 },
  { key: '400+', min: 400, max: Number.POSITIVE_INFINITY },
]

export function GlucoseHistogramChart({ observations }: Props) {
  const data = BINS.map((bin) => {
    const count = observations.filter((obs) => {
      const value = obs.valueQuantity.value
      return value >= bin.min && value < bin.max
    }).length

    return {
      range: bin.key,
      count,
    }
  })

  return (
    <div className="rounded-xl border border-company-border bg-company-surface/80 p-4">
      <p className="mb-3 text-xs uppercase tracking-wide text-company-muted">Glucose Distribution</p>
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#263141" />
          <XAxis dataKey="range" stroke="#7f93ad" />
          <YAxis allowDecimals={false} stroke="#7f93ad" />
          <Tooltip
            contentStyle={{ backgroundColor: '#141b26', border: '1px solid #263141', borderRadius: 8 }}
          />
          <Bar dataKey="count" fill="#4f8edc" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
