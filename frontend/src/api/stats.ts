import type { StatsResponse } from '../types'
import api from './client'

export async function getUserStats() {
  const res = await api.get<StatsResponse>('/users/stats')
  return res.data
}
