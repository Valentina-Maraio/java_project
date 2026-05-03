import { useEffect, useRef } from 'react'
import { Client } from '@stomp/stompjs'
import SockJS from 'sockjs-client'
import type { Observation } from '../types/fhir'

export function useWebSocket(onMessage: (obs: Observation) => void) {
  const clientRef = useRef<Client | null>(null)

  useEffect(() => {
    const client = new Client({
      webSocketFactory: () => new SockJS('/ws'),
      reconnectDelay: 5000,
      onConnect: () => {
        client.subscribe('/topic/results', (frame) => {
          try {
            const obs: Observation = JSON.parse(frame.body)
            onMessage(obs)
          } catch {
            // malformed message – ignore
          }
        })
      },
    })

    client.activate()
    clientRef.current = client

    return () => {
      client.deactivate()
    }
  }, [onMessage])
}
