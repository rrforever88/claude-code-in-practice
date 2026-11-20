import type { Symptom, SymptomLog } from '../types'
import api from './client'

export async function getSymptoms() {
  const res = await api.get<Symptom[]>('/symptoms')
  return res.data
}

export interface SymptomLogParams {
  startDate?: string
  endDate?: string
  limit?: number
  offset?: number
}

export async function getSymptomLogs(params?: SymptomLogParams) {
  const res = await api.get<SymptomLog[]>('/symptom-logs', { params })
  return res.data
}

export async function createSymptomLog(data: {
  symptomId: string
  severity: number
  notes?: string
  loggedAt?: string
}) {
  const res = await api.post<SymptomLog>('/symptom-logs', data)
  return res.data
}

export async function updateSymptomLog(
  id: string,
  data: { severity?: number; notes?: string; loggedAt?: string },
) {
  const res = await api.patch<SymptomLog>(`/symptom-logs/${id}`, data)
  return res.data
}

export async function deleteSymptomLog(id: string) {
  await api.delete(`/symptom-logs/${id}`)
}
