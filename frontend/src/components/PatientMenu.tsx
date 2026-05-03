import type { PatientSummary } from '../types/fhir'

interface Props {
  patients: PatientSummary[]
  selectedPatient: string | null
  onSelectPatient: (patientReference: string) => void
}

export function PatientMenu({ patients, selectedPatient, onSelectPatient }: Props) {
  return (
    <aside className="rounded-xl border border-company-border bg-company-surface/80 p-3 h-[calc(100vh-11rem)] overflow-y-auto">
      <div className="mb-3 px-2">
        <p className="text-xs tracking-wide uppercase text-company-muted">Patients</p>
      </div>
      <div className="space-y-2">
        {patients.map((patient) => {
          const selected = patient.reference === selectedPatient
          return (
            <button
              key={patient.reference}
              onClick={() => onSelectPatient(patient.reference)}
              className={[
                'w-full rounded-lg border px-3 py-2 text-left transition-colors',
                selected
                  ? 'border-company-red bg-red-950/40'
                  : 'border-company-border hover:bg-company-panel',
              ].join(' ')}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-medium text-sm truncate">{patient.reference}</span>
                {patient.criticalCount > 0 && (
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-company-red text-white">
                    {patient.criticalCount}
                  </span>
                )}
              </div>
              <div className="mt-1 text-xs text-company-muted flex items-center justify-between">
                <span>{patient.totalCount} results</span>
                <span>{patient.lastStatus}</span>
              </div>
            </button>
          )
        })}
      </div>
    </aside>
  )
}
