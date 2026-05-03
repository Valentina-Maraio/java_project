import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { Observation } from '../types/fhir'

interface Props {
  observations: Observation[]
  selectedPatient: string | null
}

export function PatientComparisonChart({ observations, selectedPatient }: Props) {
  const grouped = observations.reduce<Record<string, number[]>>((acc, obs) => {
    const patient = obs.subject.reference
    if (!acc[patient]) acc[patient] = []
    acc[patient].push(obs.valueQuantity.value)
    return acc
  }, {})

  const data = Object.entries(grouped)
    .map(([patient, values]) => {
      const avg = values.reduce((sum, value) => sum + value, 0) / values.length
      return {
        patient,
        avg: Number(avg.toFixed(1)),
        selected: patient === selectedPatient,
      }
    })
    .sort((a, b) => b.avg - a.avg)
    .slice(0, 8)

  return (
    <div className="rounded-xl border border-company-border bg-company-surface/80 p-4">
      <p className="mb-3 text-xs uppercase tracking-wide text-company-muted">Patient Average Glucose Comparison</p>
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#263141" />
          <XAxis dataKey="patient" stroke="#7f93ad" tick={{ fontSize: 10 }} interval={0} angle={-15} dy={6} />
          <YAxis stroke="#7f93ad" />
          <Tooltip contentStyle={{ backgroundColor: '#141b26', border: '1px solid #263141', borderRadius: 8 }} />
          <Bar
            dataKey="avg"
            radius={[6, 6, 0, 0]}
            fill="#4f8edc"
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
