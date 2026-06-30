import { createContext, useContext, useEffect, useState } from 'react'
import api from '../lib/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const raw = localStorage.getItem('user')
      return raw ? JSON.parse(raw) : null
    } catch {
      return null
    }
  })
  const [token, setToken] = useState(() => localStorage.getItem('token') || null)

  useEffect(() => {
    if (token) localStorage.setItem('token', token)
    else localStorage.removeItem('token')
  }, [token])

  useEffect(() => {
    if (user) localStorage.setItem('user', JSON.stringify(user))
    else localStorage.removeItem('user')
  }, [user])

  const login = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password })
    setUser(data.user)
    setToken(data.token)
    return data
  }

  const register = async (payload) => {
    const { data } = await api.post('/auth/register', payload)
    setUser(data.user)
    setToken(data.token)
    return data
  }

  const logout = () => {
    setUser(null)
    setToken(null)
  }

  const updateUser = (next) => setUser(next)

  // Phone OTP — step 1: try a trusted-device login (no code needed).
  const phoneCheck = async (phone) => {
    const deviceToken = localStorage.getItem('device_token') || undefined
    const { data } = await api.post('/auth/phone/check', { phone, deviceToken })
    if (data.trusted && data.token) {
      setUser(data.user)
      setToken(data.token)
    }
    return data
  }

  // Phone OTP — step 2: verify the code (Firebase idToken or dev {phone, code}).
  const phoneVerify = async (payload) => {
    const { data } = await api.post('/auth/phone/verify', payload)
    if (data.deviceToken) localStorage.setItem('device_token', data.deviceToken)
    setUser(data.user)
    setToken(data.token)
    return data
  }

  return (
    <AuthContext.Provider
      value={{ user, token, login, register, logout, updateUser, phoneCheck, phoneVerify }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
