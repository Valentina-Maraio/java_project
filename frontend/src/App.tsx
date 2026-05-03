import { useEffect, useMemo, useState } from 'react'
import { AlertProvider } from './context/AlertContext'
import { useAlert } from './context/AlertContext'
import { ResultsTable } from './components/ResultsTable'
import { PrivacyToggle } from './components/PrivacyToggle'
import { PatientMenu } from './components/PatientMenu'
import { PatientDetailPanel } from './components/PatientDetailPanel'
import { GlucoseHistogramChart } from './components/GlucoseHistogramChart'
import { CriticalEventsChart } from './components/CriticalEventsChart'
import { InterpretationBreakdownChart } from './components/InterpretationBreakdownChart'
import { NotificationsDialog } from './components/NotificationsDialog'
import { PatientTrendMovingAverageChart } from './components/PatientTrendMovingAverageChart'
import { PatientValueHourScatterChart } from './components/PatientValueHourScatterChart'
import { useObservations } from './hooks/useObservations'
import type { Observation, PatientSummary } from './types/fhir'

export default function App() {
    return (
        <AlertProvider>
            <Dashboard />
        </AlertProvider>
    )
}

function buildPatientSummaries(observations: Observation[]): PatientSummary[] {
    const grouped = observations.reduce<Record<string, Observation[]>>((acc, observation) => {
        const ref = observation.subject.reference
        if (!acc[ref]) {
            acc[ref] = []
        }
        acc[ref].push(observation)
        return acc
    }, {})

    return Object.entries(grouped)
        .map(([reference, rows]) => {
            const criticalCount = rows.filter((row) => row.critical).length
            const lastStatus = rows[0]?.interpretation?.[0]?.coding?.[0]?.code ?? 'N/A'
            return {
                reference,
                totalCount: rows.length,
                criticalCount,
                lastStatus,
            }
        })
        .sort((a, b) => a.reference.localeCompare(b.reference))
}

function Dashboard() {
    const { addCritical, markAllRead, unreadCount } = useAlert()
    const [maskPii, setMaskPii] = useState(false)
    const [selectedPatient, setSelectedPatient] = useState<string | null>(null)
    const [notificationsOpen, setNotificationsOpen] = useState(false)

    const { observations, isLoading } = useObservations({
        maskPii,
        onCritical: addCritical,
    })

    const patientSummaries = useMemo(() => buildPatientSummaries(observations), [observations])

    useEffect(() => {
        if (!selectedPatient && patientSummaries.length > 0) {
            setSelectedPatient(patientSummaries[0].reference)
        }
    }, [selectedPatient, patientSummaries])

    const selectedPatientObservations = useMemo(() => {
        if (!selectedPatient) {
            return []
        }
        return observations.filter((observation) => observation.subject.reference === selectedPatient)
    }, [observations, selectedPatient])

    const selectedSummary = useMemo(() => {
        return patientSummaries.find((summary) => summary.reference === selectedPatient)
    }, [patientSummaries, selectedPatient])

    const openNotifications = () => {
        setNotificationsOpen(true)
        markAllRead()
    }

    return (
        <div className="min-h-screen bg-company-dark text-company-text">
            <header className="sticky top-0 z-30 bg-company-dark border-b border-company-border px-4 sm:px-6 py-4 flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-semibold tracking-tight">
                        <span className="text-company-red">⬡</span> Project Sentinel
                    </h1>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={openNotifications}
                        className="relative inline-flex items-center justify-center h-10 w-10 rounded-lg border border-company-border bg-company-panel hover:border-company-red/70 transition-colors"
                        aria-label="Open critical notifications"
                    >
                        <svg viewBox="0 0 24 24" className="h-5 w-5 text-company-text" fill="none" stroke="currentColor" strokeWidth="1.8">
                            <path d="M12 3a5 5 0 0 0-5 5v2.8c0 .8-.3 1.5-.8 2.1l-1.2 1.4c-.6.7-.1 1.7.8 1.7h12.4c.9 0 1.4-1 .8-1.7l-1.2-1.4a3.3 3.3 0 0 1-.8-2.1V8a5 5 0 0 0-5-5Z" />
                            <path d="M9.5 18a2.5 2.5 0 0 0 5 0" />
                        </svg>
                        {unreadCount > 0 && (
                            <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-company-red text-white text-[10px] leading-5 font-bold text-center">
                                {unreadCount}
                            </span>
                        )}
                    </button>
                    <PrivacyToggle enabled={maskPii} onChange={setMaskPii} />
                </div>
            </header>

            <main className="px-3 sm:px-6 py-5">

                <div className="mt-4 grid grid-cols-[220px_minmax(0,1fr)] gap-4 items-start">
                    <div className="sticky top-[73px]">
                        <PatientMenu
                            patients={patientSummaries}
                            selectedPatient={selectedPatient}
                            onSelectPatient={setSelectedPatient}
                        />
                    </div>

                    <div className="space-y-4">
                        <PatientTrendMovingAverageChart observations={selectedPatientObservations} />
                        <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_420px] gap-4 items-start">
                            <section className="rounded-xl border border-company-border bg-company-surface/80 p-4">
                                <h2 className="text-xs tracking-wide uppercase text-company-muted mb-2">Patient Results</h2>
                                <ResultsTable observations={observations} selectedPatient={selectedPatient} />
                            </section>
                            <PatientDetailPanel
                                selectedPatient={selectedPatient}
                                selectedSummary={selectedSummary}
                                observations={selectedPatientObservations}
                            />
                        </div>

                        <section className="rounded-xl border border-company-border bg-company-surface/80 p-4">
                            <p className="mb-3 text-xs uppercase tracking-wide text-company-muted">Patient Analytics Panel</p>

                            {isLoading ? (
                                <p className="text-sm text-company-muted">Loading chart data...</p>
                            ) : (
                                <div>
                                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                                        <GlucoseHistogramChart observations={selectedPatientObservations} />
                                        <PatientValueHourScatterChart observations={selectedPatientObservations} />
                                        <CriticalEventsChart observations={selectedPatientObservations} />
                                        <InterpretationBreakdownChart observations={selectedPatientObservations} />
                                    </div>
                                </div>
                            )}
                        </section>
                    </div>
                </div>
            </main>

            <footer className="border-t border-company-border px-6 py-3 text-xs text-company-muted text-center">
                Project Sentinel v1.1 · Static critical highlighting · Patient grouped workflow
            </footer>

            <NotificationsDialog
                open={notificationsOpen}
                onClose={() => setNotificationsOpen(false)}
            />
        </div>
    )
}
