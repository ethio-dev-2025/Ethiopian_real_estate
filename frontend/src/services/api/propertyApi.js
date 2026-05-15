import api from './axiosConfig'

export const propertyApi = {
  // Public endpoints
  getAll: (params) => api.get('/listings', { params }).then(res => res.data),
  
  getById: (id) => api.get(`/listings/${id}`).then(res => res.data),
  
  search: (query) => api.get('/listings/search', { params: query }).then(res => res.data),
  
  // Authenticated endpoints
  getMyListings: () => api.get('/listings/my-listings').then(res => res.data),
  
  create: (data) => api.post('/listings', data).then(res => res.data),
  
  update: (id, data) => api.put(`/listings/${id}`, data).then(res => res.data),
  
  delete: (id) => api.delete(`/listings/${id}`).then(res => res.data),
  
  // Favorites
  getFavorites: () => api.get('/listings/favorites').then(res => res.data),
  
  toggleFavorite: (id) => api.post(`/listings/${id}/favorite`).then(res => res.data),
  
  // Analytics
  getListingAnalytics: (id) => api.get(`/listings/${id}/analytics`).then(res => res.data),
  
  // Boost
  boostListing: (id, duration) => api.post(`/listings/${id}/boost`, { duration }).then(res => res.data),
}

export default propertyApi
