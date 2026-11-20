import type { User } from '../types'
import api from './client'

export interface RegisterData {
  email: string
  password: string
  displayName: string
}

export interface LoginData {
  email: string
  password: string
}

export async function register(data: RegisterData) {
  const res = await api.post<{ user: User; accessToken: string; refreshToken: string }>(
    '/auth/register',
    data,
  )
  return res.data
}

export async function login(data: LoginData) {
  const res = await api.post<{ user: User; accessToken: string; refreshToken: string }>(
    '/auth/login',
    data,
  )
  return res.data
}

export async function forgotPassword(email: string) {
  const res = await api.post('/auth/forgot-password', { email })
  return res.data
}

export async function resetPassword(token: string, password: string) {
  const res = await api.post('/auth/reset-password', { token, password })
  return res.data
}

export async function logout() {
  await api.post('/auth/logout')
}

export async function getMe() {
  const res = await api.get<User>('/users/me')
  return res.data
}
