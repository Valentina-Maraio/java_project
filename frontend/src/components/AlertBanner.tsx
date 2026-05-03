import { useAlert } from '../context/AlertContext'

const CRITICAL_COLOR = '#E64141'

export function AlertBanner() {
  const { criticalCount, lastCritical } = useAlert()

  if (!lastCritical) return null

  const patient = lastCritical.piiMasked
    ? 'Patient/REDACTED'
    : (lastCritical.subject?.reference ?? 'Unknown')

  const value = lastCritical.valueQuantity
  const interpCode = lastCritical.interpretation?.[0]?.coding?.[0]?.code ?? ''

  return (
    <div
      className="flex items-center justify-between gap-4 px-5 py-3 rounded-xl border text-sm font-semibold bg-red-950/30"
      style={{ borderColor: CRITICAL_COLOR, color: CRITICAL_COLOR }}
      role="alert"
    >
      <div className="flex items-center gap-3">
        <span className="text-lg">⚠</span>
        <span>
          CRITICAL RESULT [{interpCode}] — {patient}:{' '}
          {value?.value} {value?.unit}
        </span>
        {criticalCount > 1 && (
          <span className="ml-2 px-2 py-0.5 rounded-full text-xs bg-company-red text-white">
            +{criticalCount - 1} more
          </span>
        )}
      </div>
      <span className="ml-auto text-xs uppercase tracking-wide opacity-70">
        Open bell for details
      </span>
    </div>
  )
}
