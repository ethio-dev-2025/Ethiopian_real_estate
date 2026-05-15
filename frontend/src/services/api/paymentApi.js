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

export const paymentAPI = {
  // Initialize payment
  initializePayment: async (paymentData) => {
    const response = await api.post('/payments/initialize', paymentData)
    return response.data
  },
  
  // Verify payment
  verifyPayment: async (tx_ref) => {
    const response = await api.post('/payments/verify', { tx_ref })
    return response.data
  }
}