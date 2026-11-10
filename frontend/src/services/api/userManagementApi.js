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

export const userManagementAPI = {
  getAllUsers: async (search = '', role = '', status = '', skip = 0, limit = 20) => {
    let url = `/user-management/users?skip=${skip}&limit=${limit}`
    if (search) url += `&search=${encodeURIComponent(search)}`
    if (role && role !== 'all') url += `&role=${role}`
    if (status && status !== 'all') url += `&status=${status}`
    const response = await api.get(url)
    return response.data
  },
  
  getUserStats: async () => {
    const response = await api.get('/user-management/users/stats')
    return response.data
  },
  
  getUserDetails: async (userId) => {
    const response = await api.get(`/user-management/users/${userId}`)
    return response.data
  },
  
  updateUser: async (userId, userData) => {
    const response = await api.put(`/user-management/users/${userId}`, userData)
    return response.data
  },
  
  deleteUser: async (userId) => {
    const response = await api.delete(`/user-management/users/${userId}`)
    return response.data
  },
  
  updatePermissions: async (userId, permissions) => {
    const response = await api.post(`/user-management/users/${userId}/permissions`, permissions)
    return response.data
  },
  
  getUserActivities: async (userId = null, limit = 50) => {
    let url = `/user-management/activities?limit=${limit}`
    if (userId) url += `&user_id=${userId}`
    const response = await api.get(url)
    return response.data
  },
  
  approveSeller: async (userId) => {
    const response = await api.post(`/user-management/users/${userId}/approve-seller`)
    return response.data
  },
  
  approveLandlord: async (userId) => {
    const response = await api.post(`/user-management/users/${userId}/approve-landlord`)
    return response.data
  }
}