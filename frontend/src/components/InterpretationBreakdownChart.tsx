import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import type { Observation } from '../types/fhir'

interface Props {
  observations: Observation[]
}

const COLORS: Record<string, string> = {
  N: '#5fbf8f',
  H: '#f2b84b',
  L: '#5aa8ff',
  HH: '#E64141',
  LL: '#E64141',
}

export function InterpretationBreakdownChart({ observations }: Props) {
  const counts = observations.reduce<Record<string, number>>((acc, obs) => {
    const code = obs.interpretation?.[0]?.coding?.[0]?.code ?? 'N'
    acc[code] = (acc[code] ?? 0) + 1
    return acc
  }, {})

  const data = Object.entries(counts).map(([name, value]) => ({ name, value }))

  return (
    <div className="rounded-xl border border-company-border bg-company-surface/80 p-4">
      <p className="mb-3 text-xs uppercase tracking-wide text-company-muted">Interpretation Breakdown</p>
      <ResponsiveContainer width="100%" height={260}>
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" outerRadius={88} innerRadius={42}>
            {data.map((entry) => (
              <Cell key={entry.name} fill={COLORS[entry.name] ?? '#7f93ad'} />
            ))}
          </Pie>
          <Tooltip contentStyle={{ backgroundColor: '#141b26', border: '1px solid #263141', borderRadius: 8 }} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}
