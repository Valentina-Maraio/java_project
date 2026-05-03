import { useMemo, useState, useEffect } from 'react'
import type { Observation } from '../types/fhir'

interface Props {
  observations: Observation[]
  selectedPatient: string | null
}

export function ResultsTable({ observations, selectedPatient }: Props) {
  const [page, setPage] = useState(1)
  const pageSize = 6

  const filteredRows = useMemo(() => {
    if (!selectedPatient) {
      return observations
    }
    return observations.filter((obs) => obs.subject.reference === selectedPatient)
  }, [observations, selectedPatient])

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / pageSize))

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages)
    }
  }, [page, totalPages])

  useEffect(() => {
    setPage(1)
  }, [selectedPatient])

  const paginatedRows = useMemo(() => {
    const start = (page - 1) * pageSize
    return filteredRows.slice(start, start + pageSize)
  }, [filteredRows, page, pageSize])

  return (
    <div className="rounded-xl border border-company-border bg-company-surface/80">
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="text-company-muted uppercase text-xs tracking-wide">
            <tr className="border-b border-company-border bg-company-panel">
              <th className="px-4 py-3 text-left">Time</th>
              <th className="px-4 py-3 text-left">Patient</th>
              <th className="px-4 py-3 text-left">Test</th>
              <th className="px-4 py-3 text-right">Value</th>
              <th className="px-4 py-3 text-center">Status</th>
            </tr>
          </thead>
          <tbody>
            {paginatedRows.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-company-muted">
                  No results for this patient yet.
                </td>
              </tr>
            )}
            {paginatedRows.map((obs) => {
              const isCritical = obs.critical
              const interpCode = obs.interpretation?.[0]?.coding?.[0]?.code ?? 'N'
              const interpDisplay = obs.interpretation?.[0]?.coding?.[0]?.display ?? 'Normal'

              return (
                <tr
                  key={obs.id}
                  className={[
                    'border-b border-company-border',
                    isCritical ? 'bg-red-950/35 border-l-4 border-l-company-red' : 'bg-transparent',
                  ].join(' ')}
                >
                  <td className="px-4 py-3 whitespace-nowrap text-company-muted">
                    {new Date(obs.effectiveDateTime).toLocaleTimeString()}
                  </td>
                  <td className="px-4 py-3">
                    {obs.piiMasked ? (
                      <span className="text-company-muted italic">REDACTED</span>
                    ) : (
                      obs.subject?.reference
                    )}
                  </td>
                  <td className="px-4 py-3">{obs.code?.coding?.[0]?.display ?? '—'}</td>
                  <td className="px-4 py-3 text-right font-mono font-semibold">
                    {obs.valueQuantity?.value} {obs.valueQuantity?.unit}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={[
                        'inline-block px-2 py-0.5 rounded text-xs font-bold uppercase border',
                        isCritical ? 'text-company-red border-company-red' : 'text-emerald-400 border-emerald-500',
                      ].join(' ')}
                    >
                      {interpCode} - {interpDisplay}
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between gap-3 px-4 py-3 border-t border-company-border text-xs text-company-muted">
        <div>
          Showing {paginatedRows.length === 0 ? 0 : (page - 1) * pageSize + 1}
          {' '}-{' '}
          {Math.min(page * pageSize, filteredRows.length)} of {filteredRows.length}
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setPage((current) => Math.max(1, current - 1))}
            disabled={page === 1}
            className="px-2 py-1 border border-company-border rounded disabled:opacity-40"
          >
            Prev
          </button>

          <span>
            {page} / {totalPages}
          </span>

          <button
            onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
            disabled={page === totalPages}
            className="px-2 py-1 border border-company-border rounded disabled:opacity-40"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  )
}
