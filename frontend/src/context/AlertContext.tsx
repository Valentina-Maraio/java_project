import { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import type { CriticalNotification, Observation } from '../types/fhir'

interface AlertState {
  criticalCount: number
  unreadCount: number
  lastCritical: Observation | null
  notifications: CriticalNotification[]
  addCritical: (obs: Observation) => void
  dismissNotification: (notificationId: string) => void
  markAllRead: () => void
}

const AlertContext = createContext<AlertState | undefined>(undefined)

export function AlertProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<CriticalNotification[]>([])

  const addCritical = useCallback((obs: Observation) => {
    if (!obs.critical) return

    setNotifications((current) => {
      if (current.some((notification) => notification.observation.id === obs.id)) {
        return current
      }

      const next: CriticalNotification[] = [
        {
          id: obs.id,
          observation: obs,
          read: false,
          receivedAt: new Date().toISOString(),
        },
        ...current,
      ]

      return next.slice(0, 50)
    })
  }, [])

  const dismissNotification = useCallback((notificationId: string) => {
    setNotifications((current) => {
      return current.filter((notification) => notification.id !== notificationId)
    })
  }, [])

  const markAllRead = useCallback(() => {
    setNotifications((current) => {
      return current.map((notification) => ({ ...notification, read: true }))
    })
  }, [])

  const criticalCount = notifications.length
  const unreadCount = notifications.filter((notification) => !notification.read).length
  const lastCritical = notifications[0]?.observation ?? null

  return (
    <AlertContext.Provider
      value={{
        criticalCount,
        unreadCount,
        lastCritical,
        notifications,
        addCritical,
        dismissNotification,
        markAllRead,
      }}
    >
      {children}
    </AlertContext.Provider>
  )
}

export function useAlert(): AlertState {
  const ctx = useContext(AlertContext)
  if (!ctx) throw new Error('useAlert must be used inside AlertProvider')
  return ctx
}
