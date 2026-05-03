import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import type { Observation } from '../types/fhir'
import { useWebSocket } from './useWebSocket'

interface UseObservationsOptions {
  maskPii: boolean
  onCritical?: (observation: Observation) => void
}

async function fetchObservations(maskPii: boolean): Promise<Observation[]> {
  const headers: HeadersInit = maskPii ? { 'X-Mask-PII': 'true' } : {}
  const res = await fetch('/fhir/Observation', { headers })
  if (!res.ok) {
    throw new Error('Failed to fetch observations')
  }
  return res.json()
}

export function useObservations({ maskPii, onCritical }: UseObservationsOptions) {
  const [liveRows, setLiveRows] = useState<Observation[]>([])
  const seenCriticalIdsRef = useRef<Set<string>>(new Set())

  const { data: polledRows = [], isLoading } = useQuery({
    queryKey: ['observations', maskPii],
    queryFn: () => fetchObservations(maskPii),
    refetchInterval: 10_000,
    staleTime: 10_000,
  })

  const handleWsMessage = useCallback(
    (obs: Observation) => {
      setLiveRows((prev) => {
        if (prev.some((row) => row.id === obs.id)) {
          return prev
        }
        return [obs, ...prev]
      })

      if (obs.critical && onCritical) {
        seenCriticalIdsRef.current.add(obs.id)
        onCritical(obs)
      }
    },
    [onCritical]
  )

  useEffect(() => {
    if (!onCritical) return

    polledRows.forEach((obs) => {
      if (!obs.critical) return
      if (seenCriticalIdsRef.current.has(obs.id)) return

      seenCriticalIdsRef.current.add(obs.id)
      onCritical(obs)
    })
  }, [onCritical, polledRows])

  useWebSocket(handleWsMessage)

  const observations = useMemo(() => {
    const merged = [
      ...liveRows,
      ...polledRows.filter((polled) => !liveRows.some((live) => live.id === polled.id)),
    ]

    return merged.sort((a, b) => {
      return new Date(b.effectiveDateTime).getTime() - new Date(a.effectiveDateTime).getTime()
    })
  }, [liveRows, polledRows])

  return {
    observations,
    isLoading,
  }
}
