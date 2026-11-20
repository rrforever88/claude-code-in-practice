import type { Medication, MedicationLog } from '../types'
import api from './client'

export async function getMedications() {
  const res = await api.get<Medication[]>('/medications')
  return res.data
}

export async function getMedicationLogs(params?: { startDate?: string; endDate?: string }) {
  const res = await api.get<MedicationLog[]>('/medication-logs', { params })
  return res.data
}

export async function createMedicationLog(data: {
  medicationId: string
  taken: boolean
  takenAt?: string
  notes?: string
  loggedAt?: string
}) {
  const res = await api.post<MedicationLog>('/medication-logs', data)
  return res.data
}

export async function updateMedicationLog(
  id: string,
  data: { taken?: boolean; takenAt?: string; notes?: string },
) {
  const res = await api.patch<MedicationLog>(`/medication-logs/${id}`, data)
  return res.data
}

export async function deleteMedicationLog(id: string) {
  await api.delete(`/medication-logs/${id}`)
}
