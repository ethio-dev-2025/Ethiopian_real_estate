import axios from 'axios'

const API_URL = 'http://localhost:8000/api'

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export const messagesAPI = {
  sendMessage: async (receiverId, content, hasAttachment = false, attachmentUrl = null) => {
    try {
      const response = await api.post('/messages/send', {
        receiver_id: receiverId,
        content: content,
        has_attachment: hasAttachment,
        attachment_url: attachmentUrl
      })
      return response.data
    } catch (error) {
      console.error('Send message error:', error.response?.data || error.message)
      throw error
    }
  },
  
  getConversations: async () => {
    try {
      const response = await api.get('/messages/conversations')
      return response.data
    } catch (error) {
      console.error('Get conversations error:', error)
      return []
    }
  },
  
  getConversation: async (userId, limit = 50, before = null) => {
    try {
      let url = `/messages/conversation/${userId}?limit=${limit}`
      if (before) url += `&before=${before}`
      const response = await api.get(url)
      return response.data
    } catch (error) {
      console.error('Get conversation error:', error)
      return []
    }
  },
  
  markConversationRead: async (userId) => {
    try {
      const response = await api.post(`/messages/mark-read/${userId}`)
      return response.data
    } catch (error) {
      console.error('Mark read error:', error)
      throw error
    }
  },
  
  getUnreadCount: async () => {
    try {
      const response = await api.get('/messages/unread-count')
      return response.data
    } catch (error) {
      console.error('Get unread count error:', error)
      return { unread_count: 0 }
    }
  },
  
  getAllUsers: async (search = '') => {
    try {
      const url = search ? `/messages/all-users?search=${encodeURIComponent(search)}` : '/messages/all-users'
      const response = await api.get(url)
      return response.data
    } catch (error) {
      console.error('Get all users error:', error)
      return []
    }
  }
}