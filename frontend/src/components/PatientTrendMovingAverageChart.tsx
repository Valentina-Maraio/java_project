import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { Observation } from '../types/fhir'

interface Props {
  observations: Observation[]
}

const MOVING_AVG_WINDOW = 5

interface Point {
  time: string
  value: number
  movingAverage: number
}

export function PatientTrendMovingAverageChart({ observations }: Props) {
  const ordered = [...observations].sort((a, b) => {
    return new Date(a.effectiveDateTime).getTime() - new Date(b.effectiveDateTime).getTime()
  })

  const data: Point[] = ordered.map((obs, index) => {
    const start = Math.max(0, index - (MOVING_AVG_WINDOW - 1))
    const windowValues = ordered.slice(start, index + 1).map((row) => row.valueQuantity.value)
    const movingAverage = windowValues.reduce((sum, value) => sum + value, 0) / windowValues.length

    return {
      time: new Date(obs.effectiveDateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      value: obs.valueQuantity.value,
      movingAverage: Number(movingAverage.toFixed(2)),
    }
  })

  return (
    <div className="rounded-xl border border-company-border bg-company-surface/80 p-4">
      <p className="mb-3 text-xs uppercase tracking-wide text-company-muted">Trend vs Moving Average</p>
      {data.length === 0 ? (
        <p className="text-sm text-company-muted">No observations for selected patient.</p>
      ) : (
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#263141" />
            <XAxis dataKey="time" stroke="#7f93ad" tick={{ fontSize: 10 }} />
            <YAxis stroke="#7f93ad" domain={[0, 520]} />
            <Tooltip contentStyle={{ backgroundColor: '#141b26', border: '1px solid #263141', borderRadius: 8 }} />
            <Line type="monotone" dataKey="value" stroke="#4f8edc" strokeWidth={2} dot={false} name="Value" />
            <Line type="monotone" dataKey="movingAverage" stroke="#f2b84b" strokeWidth={2} dot={false} name="Moving Avg" />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}
