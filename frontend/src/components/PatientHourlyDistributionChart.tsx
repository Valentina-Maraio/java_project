import {
  CartesianGrid,
  ComposedChart,
  Bar,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { Observation } from '../types/fhir'

interface Props {
  observations: Observation[]
}

interface HourBucket {
  hour: string
  count: number
  avgValue: number
}

export function PatientHourlyDistributionChart({ observations }: Props) {
  const buckets = observations.reduce<Record<string, number[]>>((acc, obs) => {
    const hour = new Date(obs.effectiveDateTime).getHours().toString().padStart(2, '0')
    if (!acc[hour]) {
      acc[hour] = []
    }
    acc[hour].push(obs.valueQuantity.value)
    return acc
  }, {})

  const data: HourBucket[] = Object.entries(buckets)
    .map(([hour, values]) => {
      const avgValue = values.reduce((sum, value) => sum + value, 0) / values.length
      return {
        hour: `${hour}:00`,
        count: values.length,
        avgValue: Number(avgValue.toFixed(2)),
      }
    })
    .sort((a, b) => a.hour.localeCompare(b.hour))

  return (
    <div className="rounded-xl border border-company-border bg-company-surface/80 p-4">
      <p className="mb-3 text-xs uppercase tracking-wide text-company-muted">Hourly Distribution</p>
      {data.length === 0 ? (
        <p className="text-sm text-company-muted">No observations for selected patient.</p>
      ) : (
        <ResponsiveContainer width="100%" height={260}>
          <ComposedChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#263141" />
            <XAxis dataKey="hour" stroke="#7f93ad" tick={{ fontSize: 10 }} />
            <YAxis yAxisId="left" stroke="#7f93ad" allowDecimals={false} />
            <YAxis yAxisId="right" orientation="right" stroke="#7f93ad" domain={[0, 520]} />
            <Tooltip contentStyle={{ backgroundColor: '#141b26', border: '1px solid #263141', borderRadius: 8 }} />
            <Bar yAxisId="left" dataKey="count" fill="#4f8edc" radius={[4, 4, 0, 0]} name="Count" />
            <Line yAxisId="right" type="monotone" dataKey="avgValue" stroke="#f2b84b" strokeWidth={2} dot={false} name="Avg Value" />
          </ComposedChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}
