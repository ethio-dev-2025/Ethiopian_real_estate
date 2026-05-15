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

export const adminAPI = {
  getDashboardStats: async () => {
    const response = await api.get('/admin/dashboard-stats')
    return response.data
  },
  
  getAllListings: async (skip = 0, limit = 100, search = '', status = '', type = '') => {
    let url = `/admin/all-listings?skip=${skip}&limit=${limit}`
    if (search) url += `&search=${encodeURIComponent(search)}`
    if (status && status !== 'all') url += `&status_filter=${status}`
    if (type && type !== 'all') url += `&type_filter=${type}`
    const response = await api.get(url)
    return response.data
  },
  
  getUserListings: async () => {
    const response = await api.get('/admin/user-listings')
    return response.data
  },
  
  getAdminListings: async () => {
    const response = await api.get('/admin/admin-listings')
    return response.data
  },
  
  getAllUsers: async (skip = 0, limit = 100, search = '', role = '', status = '') => {
    let url = `/admin/all-users?skip=${skip}&limit=${limit}`
    if (search) url += `&search=${encodeURIComponent(search)}`
    if (role && role !== 'all') url += `&role=${role}`
    if (status && status !== 'all') url += `&status=${status}`
    const response = await api.get(url)
    return response.data
  },
  
  getUserStats: async () => {
    const response = await api.get('/admin/users/stats')
    return response.data
  },
  
  approveUser: async (userId) => {
    const response = await api.post(`/admin/approve-user/${userId}`)
    return response.data
  },
  
  suspendUser: async (userId) => {
    const response = await api.post(`/admin/suspend-user/${userId}`)
    return response.data
  },
  
  activateUser: async (userId) => {
    const response = await api.post(`/admin/activate-user/${userId}`)
    return response.data
  },
  
  getCompanies: async () => {
    const response = await api.get('/admin/companies')
    return response.data
  },
  
  createCompany: async (companyData) => {
    const response = await api.post('/admin/companies', companyData)
    return response.data
  },
  
  getSystemStats: async () => {
    const response = await api.get('/admin/system-stats')
    return response.data
  }
}