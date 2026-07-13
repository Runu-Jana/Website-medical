import axios from 'axios'

export const API = import.meta.env.VITE_API_URL || 'http://localhost:5000'

const api = axios.create({
  baseURL: `${API}/api`,
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// If a stored token is invalid/expired (e.g. it belonged to a different
// backend/database), clear it and send the customer to log in again instead of
// showing a confusing "user no longer exists" popup.
api.interceptors.response.use(
  (res) => res,
  (error) => {
    const status = error.response?.status
    const hadToken = !!localStorage.getItem('token')
    if (status === 401 && hadToken) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      const path = window.location.pathname
      if (path !== '/login' && path !== '/register') {
        window.location.href = `/login?next=${encodeURIComponent(path)}`
      }
    }
    return Promise.reject(error)
  }
)

export default api
