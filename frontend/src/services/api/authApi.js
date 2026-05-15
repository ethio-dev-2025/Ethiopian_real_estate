import axios from 'axios'

const API_URL = 'http://localhost:8000/api'

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Add token to requests
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

// Response interceptor for handling auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Only clear token if it's not a buyer endpoint that might have different auth
      const isBuyerEndpoint = error.config?.url?.includes('/buyer/')
      if (!isBuyerEndpoint) {
        console.log('Auth error detected, clearing tokens')
        localStorage.removeItem('access_token')
        localStorage.removeItem('user')
        localStorage.removeItem('user_role')
      }
    }
    return Promise.reject(error)
  }
)

export const authApi = {
  // ============ SELLER/LANDLORD AUTH ============
  login: async (username, password) => {
    const formData = new URLSearchParams()
    formData.append('username', username)
    formData.append('password', password)
    
    const response = await axios.post(`${API_URL}/auth/login`, formData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    })
    return response
  },
  
  register: async (userData) => {
    console.log('Sending registration request to:', `${API_URL}/auth/register`)
    console.log('Request data:', userData)
    
    const response = await api.post('/auth/register', userData)
    console.log('Registration response:', response.data)
    return response
  },
  
  getCurrentUser: async () => {
    const token = localStorage.getItem('access_token')
    if (!token) {
      throw new Error('No token found')
    }
    const response = await api.get('/auth/me')
    return response.data
  },
  
  // ============ BUYER/RENTER AUTH ============
  buyerLogin: async (username, password) => {
    try {
      const response = await fetch('http://localhost:8000/api/buyer/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.detail || 'Login failed')
      }
      
      const data = await response.json()
      return { data }
    } catch (error) {
      console.error('Buyer login error:', error)
      throw error
    }
  },
  
  buyerRegister: async (userData) => {
    try {
      const response = await fetch('http://localhost:8000/api/buyer/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: userData.username,
          phone_number: userData.phone,
          password: userData.password,
          full_name: userData.full_name
        })
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.detail || 'Registration failed')
      }
      
      const data = await response.json()
      return { data }
    } catch (error) {
      console.error('Buyer registration error:', error)
      throw error
    }
  },
  
  getBuyerProfile: async () => {
    const token = localStorage.getItem('access_token')
    if (!token) {
      throw new Error('No token found')
    }
    
    const response = await fetch('http://localhost:8000/api/buyer/profile', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    
    if (!response.ok) {
      throw new Error('Failed to get buyer profile')
    }
    
    return response.json()
  },
  
  updateBuyerProfile: async (profileData) => {
    const token = localStorage.getItem('access_token')
    if (!token) {
      throw new Error('No token found')
    }
    
    const response = await fetch('http://localhost:8000/api/buyer/profile', {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(profileData)
    })
    
    if (!response.ok) {
      throw new Error('Failed to update profile')
    }
    
    return response.json()
  },
  
  // ============ UNIVERSAL LOGOUT ============
  logout: () => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('user')
    localStorage.removeItem('user_role')
  },
  
  // ============ CHECK AUTH STATUS ============
  isAuthenticated: () => {
    const token = localStorage.getItem('access_token')
    return !!token
  },
  
  getUserRole: () => {
    return localStorage.getItem('user_role') || 'buyer'
  },
  
  getStoredUser: () => {
    const userStr = localStorage.getItem('user')
    if (userStr) {
      try {
        return JSON.parse(userStr)
      } catch {
        return null
      }
    }
    return null
  }
}

// ============ ADMIN API ============
export const adminAPI = {
  getAllUsers: async () => {
    const response = await api.get('/admin/all-users')
    return response.data
  },
  
  approveUser: async (userId) => {
    const response = await api.post(`/admin/approve/${userId}`)
    return response.data
  },
  
  rejectUser: async (userId) => {
    const response = await api.post(`/admin/reject/${userId}`)
    return response.data
  },
  
  suspendUser: async (userId) => {
    const response = await api.post(`/admin/suspend/${userId}`)
    return response.data
  },
  
  activateUser: async (userId) => {
    const response = await api.post(`/admin/activate/${userId}`)
    return response.data
  },
  
  getDashboardStats: async () => {
    const response = await api.get('/admin/stats')
    return response.data
  },
  
  getPendingVerifications: async () => {
    const response = await api.get('/admin/pending-verifications')
    return response.data
  },
  
  verifyUser: async (userId, status) => {
    const response = await api.post(`/admin/verify/${userId}`, { status })
    return response.data
  }
}

// ============ BUYER API (for dashboard) ============
export const buyerAPI = {
  getProperties: async (params = {}) => {
    const token = localStorage.getItem('access_token')
    const queryParams = new URLSearchParams(params)
    const response = await fetch(`http://localhost:8000/api/buyer/properties?${queryParams}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    return response.json()
  },
  
  getProperty: async (id) => {
    const response = await fetch(`http://localhost:8000/api/buyer/properties/${id}`)
    return response.json()
  },
  
  getSavedProperties: async () => {
    const token = localStorage.getItem('access_token')
    const response = await fetch('http://localhost:8000/api/buyer/saved-properties', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    return response.json()
  },
  
  saveProperty: async (listingId) => {
    const token = localStorage.getItem('access_token')
    const response = await fetch('http://localhost:8000/api/buyer/saved-properties', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ listing_id: listingId })
    })
    return response.json()
  },
  
  removeSavedProperty: async (listingId) => {
    const token = localStorage.getItem('access_token')
    const response = await fetch(`http://localhost:8000/api/buyer/saved-properties/${listingId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    })
    return response.json()
  },
  
  contactOwner: async (propertyId, message) => {
    const token = localStorage.getItem('access_token')
    const response = await fetch('http://localhost:8000/api/buyer/contact-owner', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ property_id: propertyId, message })
    })
    return response.json()
  },
  
  getConversations: async () => {
    const token = localStorage.getItem('access_token')
    const response = await fetch('http://localhost:8000/api/buyer/conversations', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    return response.json()
  },
  
  getMessages: async (conversationId) => {
    const token = localStorage.getItem('access_token')
    const response = await fetch(`http://localhost:8000/api/buyer/conversations/${conversationId}/messages`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    return response.json()
  },
  
  sendMessage: async (conversationId, message) => {
    const token = localStorage.getItem('access_token')
    const response = await fetch('http://localhost:8000/api/buyer/messages', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ conversation_id: conversationId, message })
    })
    return response.json()
  },
  
  getUnreadCount: async () => {
    const token = localStorage.getItem('access_token')
    const response = await fetch('http://localhost:8000/api/buyer/unread-count', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    return response.json()
  }
}

export default api