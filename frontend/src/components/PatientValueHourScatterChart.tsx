import { CartesianGrid, ResponsiveContainer, Scatter, ScatterChart, Tooltip, XAxis, YAxis } from 'recharts'
import type { Observation } from '../types/fhir'

interface Props {
  observations: Observation[]
}

interface ScatterPoint {
  hour: number
  value: number
}

export function PatientValueHourScatterChart({ observations }: Props) {
  const normal: ScatterPoint[] = []
  const critical: ScatterPoint[] = []

  observations.forEach((obs) => {
    const point = {
      hour: new Date(obs.effectiveDateTime).getHours(),
      value: obs.valueQuantity.value,
    }
    if (obs.critical) {
      critical.push(point)
    } else {
      normal.push(point)
    }
  })

  const hasData = normal.length > 0 || critical.length > 0

  return (
    <div className="rounded-xl border border-company-border bg-company-surface/80 p-4">
      <p className="mb-3 text-xs uppercase tracking-wide text-company-muted">Value vs Hour Scatter</p>
      {!hasData ? (
        <p className="text-sm text-company-muted">No observations for selected patient.</p>
      ) : (
        <ResponsiveContainer width="100%" height={260}>
          <ScatterChart>
            <CartesianGrid strokeDasharray="3 3" stroke="#263141" />
            <XAxis type="number" dataKey="hour" domain={[0, 23]} stroke="#7f93ad" name="Hour" />
            <YAxis type="number" dataKey="value" domain={[0, 520]} stroke="#7f93ad" name="Value" />
            <Tooltip
              cursor={{ strokeDasharray: '3 3' }}
              contentStyle={{ backgroundColor: '#141b26', border: '1px solid #263141', borderRadius: 8 }}
            />
            <Scatter name="Normal" data={normal} fill="#4f8edc" />
            <Scatter name="Critical" data={critical} fill="#E64141" />
          </ScatterChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}
