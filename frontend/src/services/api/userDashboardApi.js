import axios from 'axios'

const API_URL = 'http://localhost:8000/api'

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export const userDashboardAPI = {
  getStats: async () => {
    try {
      const response = await api.get('/users/dashboard-stats')
      return response.data
    } catch (error) {
      console.error('Error fetching stats:', error)
      return {}
    }
  },
  
  getMyListings: async () => {
    try {
      const response = await api.get('/listings/my-listings')
      return Array.isArray(response.data) ? response.data : []
    } catch (error) {
      console.error('Error fetching my listings:', error)
      return []
    }
  },
  
  getMyProperties: async () => {
    try {
      const response = await api.get('/listings/my-properties')
      return Array.isArray(response.data) ? response.data : []
    } catch (error) {
      console.error('Error fetching my properties:', error)
      return []
    }
  },
  
  getRecentListings: async (limit = 5) => {
    try {
      const response = await api.get('/listings/my-listings')
      return Array.isArray(response.data) ? response.data.slice(0, limit) : []
    } catch (error) {
      console.error('Error fetching recent listings:', error)
      return []
    }
  },
  
  getActivities: async (limit = 10) => {
    try {
      const response = await api.get('/users/activities')
      return Array.isArray(response.data) ? response.data : []
    } catch (error) {
      console.error('Error fetching activities:', error)
      return []
    }
  },
  
  getNotifications: async () => {
    try {
      const response = await api.get('/users/notifications')
      return Array.isArray(response.data) ? response.data : []
    } catch (error) {
      console.error('Error fetching notifications:', error)
      return []
    }
  },
  
  updateProfile: async (profileData) => {
    const response = await api.put('/users/profile', profileData)
    return response.data
  },
  
  changePassword: async (passwordData) => {
    const response = await api.post('/users/change-password', passwordData)
    return response.data
  }
}