import api from './axiosConfig'

export const analyticsApi = {
  // User analytics
  getDashboardStats: () => api.get('/analytics/dashboard').then(res => res.data),
  
  getPropertyViews: (period = 'month') => api.get('/analytics/views', { params: { period } }).then(res => res.data),
  
  getEarnings: (period = 'month') => api.get('/analytics/earnings', { params: { period } }).then(res => res.data),
  
  getMessagesAnalytics: () => api.get('/analytics/messages').then(res => res.data),
  
  // Market analytics
  getMarketTrends: () => api.get('/analytics/market/trends').then(res => res.data),
  
  getPriceIndex: (region) => api.get('/analytics/market/price-index', { params: { region } }).then(res => res.data),
  
  getDemandHeatmap: () => api.get('/analytics/market/demand-heatmap').then(res => res.data),
  
  // Performance
  getSellerPerformance: (sellerId) => api.get(`/analytics/seller/${sellerId}`).then(res => res.data),
  
  getListingPerformance: (listingId) => api.get(`/analytics/listing/${listingId}`).then(res => res.data),
}

export default analyticsApi
