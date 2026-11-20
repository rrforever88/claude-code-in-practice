export interface User {
  id: string
  email: string
  displayName: string
  timezone: string
  createdAt: string
}

export interface Symptom {
  id: string
  userId: string | null
  name: string
  category: string
  isActive: boolean
}

export interface SymptomLog {
  id: string
  userId: string
  symptomId: string
  severity: number
  notes: string | null
  loggedAt: string
  createdAt: string
  symptom?: Symptom
}

export interface MoodLog {
  id: string
  userId: string
  moodScore: number
  energyLevel: number | null
  stressLevel: number | null
  notes: string | null
  loggedAt: string
  createdAt: string
}

export type TrackingType = 'BOOLEAN' | 'NUMERIC' | 'DURATION'

export interface Habit {
  id: string
  userId: string | null
  name: string
  trackingType: TrackingType
  unit: string | null
  isActive: boolean
}

export interface HabitLog {
  id: string
  userId: string
  habitId: string
  valueBoolean: boolean | null
  valueNumeric: number | null
  valueDuration: number | null
  notes: string | null
  loggedAt: string
  createdAt: string
  habit?: Habit
}

export interface Medication {
  id: string
  userId: string
  name: string
  dosage: string | null
  frequency: string | null
  isActive: boolean
  createdAt: string
}

export interface MedicationLog {
  id: string
  userId: string
  medicationId: string
  taken: boolean
  takenAt: string | null
  notes: string | null
  loggedAt: string
  createdAt: string
  medication?: Medication
}

export interface AuthTokens {
  accessToken: string
  refreshToken?: string
}

export interface ApiError {
  error: string
  details?: Record<string, string[]>
}

export interface FrequentSymptom {
  symptomId: string
  name: string
  count: number
}

export interface TotalLogsByType {
  symptomLogs: number
  moodLogs: number
  medicationLogs: number
  habitLogs: number
}

export interface StatsResponse {
  avgMoodScoreLast30Days: number | null
  topSymptoms: FrequentSymptom[]
  currentStreak: number
  totalLogsByType: TotalLogsByType
}
