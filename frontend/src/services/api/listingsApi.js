import axios from 'axios'

const API_URL = 'http://localhost:8000/api'

// Create axios instance with timeout and abort controller support
const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000, // 15 second timeout to prevent hanging
})

// Request interceptor - Add token and log requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  // Only log in development
  if (process.env.NODE_ENV === 'development') {
    console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`)
  }
  return config
})

// Response interceptor - Handle errors globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.code === 'ECONNABORTED') {
      console.error('Request timeout:', error.config?.url)
      return Promise.reject(new Error('Request timeout - please try again'))
    }
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('access_token')
      localStorage.removeItem('user')
      if (window.location.pathname !== '/login') {
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

// Abort controller store for cancelling pending requests
let pendingRequests = new Map()

const getAbortController = (url) => {
  // Cancel existing request for same URL
  if (pendingRequests.has(url)) {
    pendingRequests.get(url).abort()
    pendingRequests.delete(url)
  }
  const controller = new AbortController()
  pendingRequests.set(url, controller)
  return controller
}

export const listingsAPI = {
  // Get public listings (FAST endpoint - uses raw SQL)
  getPublicListingsFast: async (params = {}) => {
    try {
      const response = await api.get('/listings/public-fast', { params })
      return response.data
    } catch (error) {
      console.error('Error fetching fast public listings:', error)
      return { success: false, listings: [] }
    }
  },

  // Get public listings (standard endpoint)
  getPublicListings: async (params = {}) => {
    try {
      const response = await api.get('/listings/public', { params })
      return response.data
    } catch (error) {
      console.error('Error fetching public listings:', error)
      return { success: false, listings: [] }
    }
  },

  // Get all listings (public) - alias
  getAllListings: async (params = {}) => {
    try {
      const response = await api.get('/listings/', { params })
      return response.data
    } catch (error) {
      console.error('Error fetching listings:', error)
      return []
    }
  },

  // Get single public listing
  getPublicListing: async (id) => {
    try {
      const response = await api.get(`/listings/public/${id}`)
      return response.data
    } catch (error) {
      console.error('Error fetching public listing:', error)
      return null
    }
  },

  // Get single listing (auth required)
  getListing: async (id) => {
    try {
      const response = await api.get(`/listings/${id}`)
      return response.data
    } catch (error) {
      console.error('Error fetching listing:', error)
      return null
    }
  },

  // Get ONLY SALE listings for the current user (My Listings) - OPTIMIZED
  getMyListings: async (includeDrafts = true, signal = null) => {
    try {
      const url = `/listings/my-listings?include_drafts=${includeDrafts}`
      const controller = getAbortController(url)
      
      const response = await api.get(url, {
        signal: signal || controller.signal,
        // Cache for 30 seconds
        headers: {
          'Cache-Control': 'max-age=30'
        }
      })
      
      // Remove from pending after completion
      pendingRequests.delete(url)
      
      // Handle both array and object responses
      let listings = []
      if (Array.isArray(response.data)) {
        listings = response.data
      } else if (response.data.listings && Array.isArray(response.data.listings)) {
        listings = response.data.listings
      }
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`✅ My Listings: ${listings.length} properties`)
      }
      return listings
      
    } catch (error) {
      if (error.name === 'AbortError' || error.code === 'ERR_CANCELED') {
        // Request was cancelled, ignore
        return []
      }
      console.error('Error fetching my listings:', error.message)
      return []
    }
  },

  // Get ONLY RENTAL properties for the current user (My Properties)
  getMyProperties: async () => {
    try {
      const response = await api.get('/listings/my-properties')
      if (process.env.NODE_ENV === 'development') {
        console.log('✅ My Properties (Rent only):', response.data.length, 'properties')
      }
      return response.data
    } catch (error) {
      console.error('Error fetching my properties:', error.message)
      return []
    }
  },

  // Create new listing
  createListing: async (listingData) => {
    try {
      if (process.env.NODE_ENV === 'development') {
        console.log('📝 Creating listing with type:', listingData.listing_type)
      }
      const response = await api.post('/listings/create', listingData)
      if (process.env.NODE_ENV === 'development') {
        console.log('✅ Create response:', response.data)
      }
      return response.data
    } catch (error) {
      console.error('Error creating listing:', error)
      throw error
    }
  },

  // Update listing
  updateListing: async (id, listingData) => {
    try {
      const response = await api.put(`/listings/${id}`, listingData)
      return response.data
    } catch (error) {
      console.error('Error updating listing:', error)
      throw error
    }
  },

  // Delete listing
  deleteListing: async (id) => {
    try {
      const response = await api.delete(`/listings/${id}`)
      return response.data
    } catch (error) {
      console.error('Error deleting listing:', error)
      throw error
    }
  },

  // Publish draft listing
  publishListing: async (id) => {
    try {
      const response = await api.post(`/listings/publish/${id}`)
      return response.data
    } catch (error) {
      console.error('Error publishing listing:', error)
      throw error
    }
  },

  // Upload image
  uploadImage: async (file) => {
    try {
      const formData = new FormData()
      formData.append('file', file)
      const response = await api.post('/listings/upload-image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 30000 // Longer timeout for image uploads
      })
      return response.data
    } catch (error) {
      console.error('Error uploading image:', error)
      throw error
    }
  },

  // Cancel all pending requests (call on component unmount)
  cancelAllRequests: () => {
    pendingRequests.forEach((controller, url) => {
      controller.abort()
      pendingRequests.delete(url)
    })
  }
}

// Helper to cancel specific request
export const cancelRequest = (url) => {
  if (pendingRequests.has(url)) {
    pendingRequests.get(url).abort()
    pendingRequests.delete(url)
  }
}

export default listingsAPI