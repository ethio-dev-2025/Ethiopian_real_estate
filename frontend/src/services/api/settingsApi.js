import axios from 'axios'

const API_URL = 'http://localhost:8000/api'

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

export const settingsAPI = {
  getSettings: async () => {
    try {
      const response = await api.get('/settings')
      return response.data
    } catch (error) {
      console.error('Get settings error:', error.response?.data || error.message)
      return null
    }
  },
  
  updateProfile: async (profileData) => {
    try {
      const response = await api.put('/settings/profile', profileData)
      return response.data
    } catch (error) {
      console.error('Update profile error:', error.response?.data || error.message)
      throw error
    }
  },
  
  changePassword: async (passwordData) => {
    try {
      console.log('Calling change-password API...')
      const response = await api.post('/settings/change-password', passwordData)
      console.log('Change password response:', response.data)
      return response.data
    } catch (error) {
      console.error('Change password error:', error.response?.data || error.message)
      throw error
    }
  },
  
  updateNotificationPrefs: async (prefs) => {
    try {
      const response = await api.put('/settings/notifications', prefs)
      return response.data
    } catch (error) {
      console.error('Update notification prefs error:', error)
      throw error
    }
  },
  
  updatePreferences: async (preferences) => {
    try {
      const response = await api.put('/settings/preferences', preferences)
      return response.data
    } catch (error) {
      console.error('Update preferences error:', error)
      throw error
    }
  }
}