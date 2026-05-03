import type { Observation, PatientSummary } from '../types/fhir'

interface Props {
    selectedPatient: string | null
    selectedSummary?: PatientSummary
    observations: Observation[]
}

function getLatestObservation(observations: Observation[]): Observation | null {
    if (observations.length === 0) return null
    return observations[0]
}

export function PatientDetailPanel({ selectedPatient, selectedSummary, observations }: Props) {
    if (!selectedPatient) {
        return (
            <div className="rounded-xl border border-company-border bg-company-surface/80 p-4 text-sm text-company-muted">
                Select a patient from the left menu.
            </div>
        )
    }

    const latest = getLatestObservation(observations)
    const lastCritical = observations.filter((obs) => obs.critical).slice(0, 5)

    return (
        <div className="rounded-xl border border-company-border bg-company-surface/80 p-4 space-y-4">
            <div className="text-xs tracking-wide text-company-muted flex items-baseline gap-3">
                <p className="uppercase">Selected Patient</p>
                <p className="text-xl font-semibold text-company-foreground">
                    {selectedPatient}
                </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="rounded-lg border border-company-border p-3 bg-company-panel">
                    <p className="text-xs text-company-muted uppercase">Total Results</p>
                    <p className="text-xl font-semibold">{selectedSummary?.totalCount ?? observations.length}</p>
                </div>
                <div className="rounded-lg border border-company-border p-3 bg-company-panel">
                    <p className="text-xs text-company-muted uppercase">Critical Results</p>
                    <p className="text-xl font-semibold text-company-red">{selectedSummary?.criticalCount ?? 0}</p>
                </div>
                <div className="rounded-lg border border-company-border p-3 bg-company-panel">
                    <p className="text-xs text-company-muted uppercase">Latest Value</p>
                    <p className="text-xl font-semibold">
                        {latest ? `${latest.valueQuantity.value} ${latest.valueQuantity.unit}` : 'N/A'}
                    </p>
                </div>
            </div>

            <div>
                <p className="text-xs uppercase tracking-wide text-company-muted mb-2">Recent Critical Events</p>
                <div className="rounded-lg border border-company-border overflow-hidden">
                    <table className="w-full text-sm">
                        <thead className="bg-company-panel text-company-muted">
                            <tr>
                                <th className="px-3 py-2 text-left">Time</th>
                                <th className="px-3 py-2 text-right">Value</th>
                                <th className="px-3 py-2 text-right">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {lastCritical.length === 0 && (
                                <tr>
                                    <td colSpan={3} className="px-3 py-3 text-center text-company-muted">
                                        No critical results for this patient.
                                    </td>
                                </tr>
                            )}
                            {lastCritical.map((obs) => (
                                <tr key={obs.id} className="border-t border-company-border bg-red-950/30">
                                    <td className="px-3 py-2">{new Date(obs.effectiveDateTime).toLocaleString()}</td>
                                    <td className="px-3 py-2 text-right">{obs.valueQuantity.value} {obs.valueQuantity.unit}</td>
                                    <td className="px-3 py-2 text-right text-company-red font-semibold">
                                        {obs.interpretation?.[0]?.coding?.[0]?.code ?? 'N/A'}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
