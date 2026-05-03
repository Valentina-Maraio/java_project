import { useMemo } from 'react'
import { useAlert } from '../context/AlertContext'

interface Props {
  open: boolean
  onClose: () => void
}

export function NotificationsDialog({ open, onClose }: Props) {
  const { notifications, dismissNotification } = useAlert()

  const orderedNotifications = useMemo(() => {
    return [...notifications].sort((a, b) => {
      return new Date(b.receivedAt).getTime() - new Date(a.receivedAt).getTime()
    })
  }, [notifications])

  if (!open) {
    return null
  }

  return (
    <div className="fixed inset-0 z-40 flex items-start justify-center p-4 sm:p-8">
      <button
        className="absolute inset-0 bg-black/60"
        onClick={onClose}
        aria-label="Close notifications"
      />

      <section className="relative z-10 w-full max-w-2xl rounded-xl border border-company-border bg-company-surface shadow-2xl">
        <header className="flex items-center justify-between border-b border-company-border px-4 py-3">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-company-muted">Critical Notifications</h2>
            <p className="text-xs text-company-muted mt-0.5">{orderedNotifications.length} messages in this session</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-md border border-company-border px-2 py-1 text-xs text-company-muted hover:text-company-text"
          >
            Close
          </button>
        </header>

        <div className="max-h-[70vh] overflow-y-auto">
          {orderedNotifications.length === 0 ? (
            <div className="px-4 py-10 text-center text-sm text-company-muted">
              No critical notifications.
            </div>
          ) : (
            <ul className="divide-y divide-company-border">
              {orderedNotifications.map((notification) => {
                const obs = notification.observation
                const patient = obs.piiMasked ? 'Patient/REDACTED' : obs.subject.reference
                const interpretation = obs.interpretation?.[0]?.coding?.[0]?.code ?? 'N/A'

                return (
                  <li key={notification.id} className="px-4 py-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div className="space-y-0.5">
                      <p className="text-sm font-semibold text-company-red">
                        {patient} - {obs.valueQuantity.value} {obs.valueQuantity.unit} [{interpretation}]
                      </p>
                      <p className="text-xs text-company-muted">
                        Effective: {new Date(obs.effectiveDateTime).toLocaleString()} - Received: {new Date(notification.receivedAt).toLocaleString()}
                      </p>
                    </div>
                    <button
                      onClick={() => dismissNotification(notification.id)}
                      className="self-start sm:self-auto rounded-md border border-company-border px-2 py-1 text-xs uppercase tracking-wide text-company-muted hover:text-company-text"
                    >
                      Dismiss
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </section>
    </div>
  )
}
