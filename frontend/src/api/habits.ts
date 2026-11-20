import type { Habit, HabitLog } from '../types'
import api from './client'

export async function getHabits() {
  const res = await api.get<Habit[]>('/habits')
  return res.data
}

export async function getHabitLogs(params?: { startDate?: string; endDate?: string }) {
  const res = await api.get<HabitLog[]>('/habit-logs', { params })
  return res.data
}

export async function createHabitLog(data: {
  habitId: string
  valueBoolean?: boolean
  valueNumeric?: number
  valueDuration?: number
  notes?: string
  loggedAt?: string
}) {
  const res = await api.post<HabitLog>('/habit-logs', data)
  return res.data
}

export async function updateHabitLog(
  id: string,
  data: {
    valueBoolean?: boolean
    valueNumeric?: number
    valueDuration?: number
    notes?: string
  },
) {
  const res = await api.patch<HabitLog>(`/habit-logs/${id}`, data)
  return res.data
}

export async function deleteHabitLog(id: string) {
  await api.delete(`/habit-logs/${id}`)
}
