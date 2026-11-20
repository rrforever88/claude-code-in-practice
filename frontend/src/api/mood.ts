import type { MoodLog } from '../types'
import api from './client'

export async function getMoodLogs(params?: { startDate?: string; endDate?: string }) {
  const res = await api.get<MoodLog[]>('/mood-logs', { params })
  return res.data
}

export async function createMoodLog(data: {
  moodScore: number
  energyLevel?: number
  stressLevel?: number
  notes?: string
  loggedAt?: string
}) {
  const res = await api.post<MoodLog>('/mood-logs', data)
  return res.data
}

export async function updateMoodLog(
  id: string,
  data: {
    moodScore?: number
    energyLevel?: number
    stressLevel?: number
    notes?: string
    loggedAt?: string
  },
) {
  const res = await api.patch<MoodLog>(`/mood-logs/${id}`, data)
  return res.data
}

export async function deleteMoodLog(id: string) {
  await api.delete(`/mood-logs/${id}`)
}
