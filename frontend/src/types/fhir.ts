export interface ObservationCoding {
  system: string
  code: string
  display: string
}

export interface ObservationCode {
  coding: ObservationCoding[]
}

export interface ValueQuantity {
  value: number
  unit: string
}

export interface InterpretationCoding {
  code: string
  display: string
}

export interface Interpretation {
  coding: InterpretationCoding[]
}

export interface Subject {
  reference: string
}

export interface Observation {
  resourceType: string
  id: string
  status: string
  code: ObservationCode
  subject: Subject
  valueQuantity: ValueQuantity
  interpretation: Interpretation[]
  effectiveDateTime: string
  critical: boolean
  piiMasked: boolean
}

export interface PatientSummary {
  reference: string
  totalCount: number
  criticalCount: number
  lastStatus: string
}

export interface CriticalNotification {
  id: string
  observation: Observation
  read: boolean
  receivedAt: string
}

export type ChartView =
  | 'trend'
  | 'histogram'
  | 'critical-timeline'
  | 'comparison'
  | 'interpretation'
