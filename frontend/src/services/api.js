import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'
export const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
export const GOOGLE_CLIENT_SECRET = import.meta.env.VITE_GOOGLE_CLIENT_SECRET;

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('access_token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// ==================== AUTH API ====================
export const authAPI = {
  register: (userData) => api.post('/auth/register', userData),
  
  login: async (username, password) => {
    const formData = new URLSearchParams()
    formData.append('username', username)
    formData.append('password', password)
    const response = await api.post('/auth/login', formData, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    })
    if (response.data.access_token) {
      localStorage.setItem('access_token', response.data.access_token)
      try {
        const userData = await api.get('/auth/me')
        localStorage.setItem('user', JSON.stringify(userData.data))
      } catch (err) {}
    }
    return response
  },
  
  logout: () => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('user')
  },
  
  getCurrentUser: async () => {
    const stored = localStorage.getItem('user')
    if (stored) return JSON.parse(stored)
    const response = await api.get('/auth/me')
    localStorage.setItem('user', JSON.stringify(response.data))
    return response.data
  },
  
  verifyEmail: (token) => api.post('/auth/verify-email', { token }),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (token, newPassword) => api.post('/auth/reset-password', { token, new_password: newPassword }),
  activateRole: (role) => api.post('/auth/activate-role', { role }),
}

// ==================== USERS API ====================
export const usersAPI = {
  getProfile: () => api.get('/users/me').then(res => res.data),
  updateProfile: (data) => api.put('/users/me', data).then(res => res.data),
  getAllUsers: () => api.get('/admin/all-users').then(res => res.data),
  uploadAvatar: (file) => {
    const formData = new FormData()
    formData.append('avatar', file)
    return api.post('/users/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then(res => res.data)
  },
  changePassword: (currentPassword, newPassword) =>
    api.post('/users/change-password', { current_password: currentPassword, new_password: newPassword }),
}

// ==================== ADMIN API ====================
export const adminAPI = {
  getAllUsers: () => api.get('/admin/all-users').then(res => res.data),
  getUserDetails: (userId) => api.get(`/admin/users/${userId}`).then(res => res.data),
  approveUser: (userId) => api.post(`/admin/users/${userId}/approve`, { action: 'approve' }).then(res => res.data),
  rejectUser: (userId) => api.post(`/admin/users/${userId}/reject`, { action: 'reject' }).then(res => res.data),
  suspendUser: (userId, reason) => api.post(`/admin/users/${userId}/suspend`, { reason }).then(res => res.data),
  activateUser: (userId) => api.post(`/admin/users/${userId}/activate`).then(res => res.data),
  deleteUser: (userId) => api.delete(`/admin/users/${userId}`).then(res => res.data),
  getAllListings: () => api.get('/admin/all-listings').then(res => res.data),
  getPendingUsers: () => api.get('/admin/pending-users').then(res => res.data),
  getPendingListings: () => api.get('/admin/pending-listings').then(res => res.data),
  approveListing: (listingId, action, notes) => api.post('/admin/approve-listing', { listing_id: listingId, action, notes }).then(res => res.data),
}

// ==================== LISTINGS API ====================
export const listingsAPI = {
  getAll: (params) => api.get('/listings', { params }).then(res => res.data),
  getMyListings: () => api.get('/listings/my-listings').then(res => res.data),
  getById: (id) => api.get(`/listings/${id}`).then(res => res.data),
  create: (data) => api.post('/listings', data).then(res => res.data),
  createListing: (data) => api.post('/listings', data).then(res => res.data),
  uploadImages: async (files) => {
    const formData = new FormData()
    files.forEach((file) => {
      formData.append('files', file)
    })
    const response = await api.post('/listings/upload-images', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return response.data
  },
  update: (id, data) => api.put(`/listings/${id}`, data).then(res => res.data),
  delete: (id) => api.delete(`/listings/${id}`).then(res => res.data),
  getFavorites: () => api.get('/listings/favorites/my').then(res => res.data),
  toggleFavorite: (id) => api.post(`/listings/${id}/favorite`).then(res => res.data),
}

// ==================== MESSAGES API ====================
export const messagesAPI = {
  getConversations: () => api.get('/messages/conversations').then(res => res.data),
  getConversation: (userId) => api.get(`/messages/conversation/${userId}`).then(res => res.data),
  sendMessage: (receiverId, content, listingId = null) => 
    api.post('/messages/send', { receiver_id: receiverId, content, listing_id: listingId }).then(res => res.data),
  markConversationRead: (userId) => api.put(`/messages/conversation/${userId}/read`).then(res => res.data),
  getUnreadCount: () => api.get('/messages/unread-count').then(res => res.data),
  getAllUsers: () => api.get('/messages/users').then(res => res.data),
  sendAsGuest: (receiverId, content, guestInfo, listingId = null) =>
    api.post('/messages/send', {
      receiver_id: receiverId,
      content,
      listing_id: listingId,
      is_guest: true,
      guest_name: guestInfo.name,
      guest_email: guestInfo.email,
      guest_phone: guestInfo.phone,
    }).then(res => res.data),
}

// ==================== PAYMENTS API ====================
export const paymentsAPI = {
  initializePayment: (paymentType, amount) => api.post('/payments/initialize', { payment_type: paymentType, amount }),
  verifyPayment: (transactionId) => api.get(`/payments/verify/${transactionId}`),
  getPaymentHistory: () => api.get('/payments/history').then(res => res.data),
  subscribePlan: (planId) => api.post('/payments/subscribe', { plan_id: planId }).then(res => res.data),
  cancelSubscription: (subscriptionId) => api.post(`/payments/cancel/${subscriptionId}`),
  getSubscriptionPlans: () => api.get('/payments/plans').then(res => res.data),
}

// ==================== VERIFICATION API ====================
export const verificationAPI = {
  submitSellerDocuments: (documents) => {
    const formData = new FormData()
    documents.forEach(doc => {
      formData.append('documents', doc.file)
      formData.append('document_types', doc.type)
    })
    return api.post('/verification/seller', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then(res => res.data)
  },
  submitLandlordDocuments: (documents) => {
    const formData = new FormData()
    documents.forEach(doc => {
      formData.append('documents', doc.file)
      formData.append('document_types', doc.type)
    })
    return api.post('/verification/landlord', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then(res => res.data)
  },
  getVerificationStatus: () => api.get('/verification/status').then(res => res.data),
  getDocuments: () => api.get('/verification/documents').then(res => res.data),
  deleteDocument: (documentId) => api.delete(`/verification/documents/${documentId}`),
}

export default api
