import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts'
import type { Observation } from '../types/fhir'

interface TrendPoint {
  time: string
  value: number
}

interface Props {
  observations: Observation[]
}

export function TrendChart({ observations }: Props) {
  const byTime: Record<string, TrendPoint> = {}
  observations.forEach((obs) => {
    const dt = new Date(obs.effectiveDateTime)
    const key = `${dt.getHours()}:${String(dt.getMinutes()).padStart(2, '0')}`
    if (!byTime[key]) byTime[key] = { time: key, value: obs.valueQuantity.value }
    const existing = byTime[key].value
    if (typeof existing === 'number') {
      byTime[key].value = (existing + obs.valueQuantity.value) / 2
    } else {
      byTime[key].value = obs.valueQuantity.value
    }
  })

  const chartData = Object.values(byTime).sort((a, b) =>
    (a.time as string).localeCompare(b.time as string)
  )

  return (
    <div className="rounded-xl border border-company-border bg-company-surface/80 p-4">
      <h2 className="text-sm font-semibold text-company-muted uppercase tracking-wide mb-4">
        Glucose Trend (mg/dL)
      </h2>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#263141" />
          <XAxis dataKey="time" stroke="#7f93ad" tick={{ fontSize: 11 }} />
          <YAxis stroke="#7f93ad" tick={{ fontSize: 11 }} domain={[0, 520]} />
          <Tooltip
            contentStyle={{ backgroundColor: '#141b26', border: '1px solid #263141', borderRadius: 8 }}
            labelStyle={{ color: '#F9FAFB' }}
          />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          {/* Clinical threshold reference lines */}
          <ReferenceLine y={50} stroke="#E64141" strokeDasharray="4 4" label={{ value: 'Critical Low', fill: '#E64141', fontSize: 10 }} />
          <ReferenceLine y={400} stroke="#E64141" strokeDasharray="4 4" label={{ value: 'Critical High', fill: '#E64141', fontSize: 10 }} />
          <Line type="monotone" dataKey="value" stroke="#4f8edc" dot={false} strokeWidth={2} name="Glucose" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
