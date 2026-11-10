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

export const propertiesApi = {
  getAllProperties: async (params = {}) => {
    try {
      const response = await api.get('/listings/', { params })
      return response.data
    } catch (error) {
      console.error('Error fetching properties:', error)
      return []
    }
  },
  
  getPropertyById: async (id) => {
    const response = await api.get(`/listings/${id}`)
    return response.data
  },
  
  getFeaturedProperties: async () => {
    const response = await api.get('/listings/featured')
    return response.data
  },
  
  searchProperties: async (searchParams) => {
    const response = await api.post('/listings/search', searchParams)
    return response.data
  }
}