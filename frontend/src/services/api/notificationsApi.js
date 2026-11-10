import axios from 'axios'

const API_URL = 'http://localhost:8000/api'

export const notificationsAPI = {
  getNotifications: async (unreadOnly = false, skip = 0, limit = 50) => {
    const token = localStorage.getItem('access_token')
    const url = `${API_URL}/notifications/?skip=${skip}&limit=${limit}&unread_only=${unreadOnly}`
    const response = await axios.get(url, {
      headers: { Authorization: `Bearer ${token}` }
    })
    return response.data
  },
  
  getUnreadCount: async () => {
    const token = localStorage.getItem('access_token')
    const response = await axios.get(`${API_URL}/notifications/unread-count`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    return response.data
  },
  
  markAsRead: async (notificationId) => {
    const token = localStorage.getItem('access_token')
    const response = await axios.post(`${API_URL}/notifications/${notificationId}/read`, {}, {
      headers: { Authorization: `Bearer ${token}` }
    })
    return response.data
  },
  
  markAllAsRead: async () => {
    const token = localStorage.getItem('access_token')
    const response = await axios.post(`${API_URL}/notifications/read-all`, {}, {
      headers: { Authorization: `Bearer ${token}` }
    })
    return response.data
  },
  
  clearRead: async () => {
    const token = localStorage.getItem('access_token')
    const response = await axios.delete(`${API_URL}/notifications/clear-read`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    return response.data
  },
  
  createNotification: async (notificationData) => {
    const token = localStorage.getItem('access_token')
    const response = await axios.post(`${API_URL}/notifications/create`, notificationData, {
      headers: { Authorization: `Bearer ${token}` }
    })
    return response.data
  }
}
