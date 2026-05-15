import React, { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import AppSidebar from '../components/layout/AppSidebar'
import { 
  Home, Eye, Edit, Trash2, Plus, MapPin, 
  Bed, Bath, Square, Clock, CheckCircle, AlertCircle, 
  Loader, X, DollarSign, Calendar, Filter, RefreshCw
} from 'lucide-react'
import toast from 'react-hot-toast'

const API_URL = 'http://localhost:8000'

// Cache keys
const CACHE_KEY = 'my_listings_cache'
const CACHE_TIMESTAMP_KEY = 'my_listings_timestamp'
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes cache

const MyListingsPage = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [listings, setListings] = useState([])
  const [loading, setLoading] = useState(false)
  const [initialLoad, setInitialLoad] = useState(true)
  const [filterStatus, setFilterStatus] = useState('all')
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const abortControllerRef = useRef(null)

  // Load from cache immediately
  const loadFromCache = useCallback(() => {
    const cachedData = localStorage.getItem(CACHE_KEY)
    const cachedTimestamp = localStorage.getItem(CACHE_TIMESTAMP_KEY)
    
    if (cachedData && cachedTimestamp) {
      const age = Date.now() - parseInt(cachedTimestamp)
      if (age < CACHE_DURATION) {
        try {
          const data = JSON.parse(cachedData)
          setListings(data)
          console.log(`📦 Loaded ${data.length} listings from cache (${Math.round(age/1000)}s old)`)
          return true
        } catch (e) {}
      }
    }
    return false
  }, [])

  // Save to cache
  const saveToCache = useCallback((data) => {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify(data))
      localStorage.setItem(CACHE_TIMESTAMP_KEY, Date.now().toString())
    } catch (e) {}
  }, [])

  // Fetch listings with cache-first strategy
  const fetchMyListings = useCallback(async (forceRefresh = false) => {
    // If not forcing refresh, try cache first
    if (!forceRefresh && loadFromCache()) {
      setInitialLoad(false)
      return
    }
    
    if (forceRefresh) {
      setIsRefreshing(true)
    } else {
      setLoading(true)
    }
    
    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    
    const abortController = new AbortController()
    abortControllerRef.current = abortController
    
    try {
      const token = localStorage.getItem('access_token')
      if (!token) {
        navigate('/login')
        return
      }
      
      const response = await fetch(`${API_URL}/api/listings/my-listings?include_drafts=true`, {
        headers: { 'Authorization': `Bearer ${token}` },
        signal: abortController.signal
      })
      
      if (!response.ok) {
        if (response.status === 401) {
          navigate('/login')
          return
        }
        throw new Error('Failed to fetch listings')
      }
      
      const data = await response.json()
      let allListings = Array.isArray(data) ? data : (data.listings || [])
      
      // Save to cache
      saveToCache(allListings)
      
      // Apply filter
      let filteredListings = allListings
      if (filterStatus === 'published') {
        filteredListings = allListings.filter(l => !l.is_draft && l.status === 'active')
      } else if (filterStatus === 'drafts') {
        filteredListings = allListings.filter(l => l.is_draft === true)
      }
      
      setListings(filteredListings)
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('Error fetching listings:', error)
        setListings([])
      }
    } finally {
      setLoading(false)
      setIsRefreshing(false)
      setInitialLoad(false)
    }
  }, [filterStatus, navigate, loadFromCache, saveToCache])

  // Initial load - show cache immediately, then fetch in background
  useEffect(() => {
    fetchMyListings(false)
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [fetchMyListings])

  // Refresh when filter changes
  useEffect(() => {
    fetchMyListings(false)
  }, [filterStatus, fetchMyListings])

  const handleDelete = async (id) => {
    try {
      const token = localStorage.getItem('access_token')
      const response = await fetch(`${API_URL}/api/listings/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await response.json()
      
      if (response.ok && data.success) {
        toast.success('Listing deleted successfully')
        const updatedListings = listings.filter(l => l.id !== id)
        setListings(updatedListings)
        saveToCache(updatedListings)
      } else {
        toast.error(data.detail || 'Failed to delete listing')
      }
    } catch (error) {
      console.error('Delete error:', error)
      toast.error('Error deleting listing')
    }
    setDeleteConfirm(null)
  }

  const handlePublish = async (id) => {
    try {
      const token = localStorage.getItem('access_token')
      const response = await fetch(`${API_URL}/api/listings/publish/${id}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await response.json()
      
      if (response.ok && data.success) {
        toast.success('Listing published successfully!')
        const updatedListings = listings.map(l => 
          l.id === id ? { ...l, is_draft: false, status: 'active' } : l
        )
        setListings(updatedListings)
        saveToCache(updatedListings)
      } else {
        toast.error(data.detail || 'Failed to publish listing')
      }
    } catch (error) {
      console.error('Publish error:', error)
      toast.error('Error publishing listing')
    }
  }

  const handleEdit = (listing) => {
    navigate(`/edit-listing/${listing.id}`)
  }

  const handleView = (listingId) => {
    navigate(`/properties/${listingId}`)
  }

  const getStatusBadge = (isDraft, status) => {
    if (isDraft) {
      return <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs"><Clock className="w-3 h-3" />Draft</span>
    }
    if (status === 'active') {
      return <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs"><CheckCircle className="w-3 h-3" />Published</span>
    }
    return <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs"><AlertCircle className="w-3 h-3" />{status}</span>
  }

  const DeleteConfirmModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-red-600">Delete Listing</h3>
          <button onClick={() => setDeleteConfirm(null)} className="p-1 hover:bg-gray-100 rounded"><X className="w-5 h-5" /></button>
        </div>
        <p className="text-gray-600 mb-6">Are you sure you want to delete this listing? This action cannot be undone.</p>
        <div className="flex gap-3">
          <button onClick={() => setDeleteConfirm(null)} className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50">Cancel</button>
          <button onClick={() => handleDelete(deleteConfirm)} className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center justify-center gap-2">
            <Trash2 className="w-4 h-4" /> Delete
          </button>
        </div>
      </div>
    </div>
  )

  // Show content immediately from cache, no spinner
  if (initialLoad && listings.length === 0) {
    return (
      <div className="min-h-screen bg-gray-100">
        <AppSidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        <main className={`transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-20'}`}>
          <div className="p-6">
            <div className="bg-white rounded-2xl shadow-sm border p-12 text-center">
              <Home className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-32 mx-auto mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-48 mx-auto"></div>
              </div>
            </div>
          </div>
        </main>
      </div>
    )
  }

  // Calculate counts for display
  const totalCount = listings.length
  const publishedCount = listings.filter(l => !l.is_draft && l.status === 'active').length
  const draftsCount = listings.filter(l => l.is_draft).length

  return (
    <div className="min-h-screen bg-gray-100">
      <AppSidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      
      <main className={`transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-20'}`}>
        <div className="bg-white border-b px-6 py-4 sticky top-0 z-10">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">My Listings</h1>
              <p className="text-sm text-gray-500">Manage your property listings</p>
            </div>
            <div className="flex gap-3">
              <button 
                onClick={() => fetchMyListings(true)} 
                disabled={isRefreshing}
                className="px-4 py-2 border rounded-lg hover:bg-gray-50 flex items-center gap-2 transition disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                {isRefreshing ? 'Refreshing...' : 'Refresh'}
              </button>
              <button onClick={() => navigate('/create-listing')} className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold hover:shadow-lg flex items-center gap-2">
                <Plus className="w-4 h-4" />Create New Listing
              </button>
            </div>
          </div>
        </div>

        <div className="p-6">
          {/* Filter Dropdown */}
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-600">Filter:</span>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-1.5 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="all">All ({totalCount})</option>
                <option value="published">Published ({publishedCount})</option>
                <option value="drafts">Drafts ({draftsCount})</option>
              </select>
            </div>
            <div className="text-sm text-gray-500">
              Showing {listings.length} listings
            </div>
          </div>

          {listings.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-sm border p-12 text-center">
              <Home className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-700 mb-2">
                {filterStatus === 'drafts' ? 'No draft listings' : filterStatus === 'published' ? 'No published listings' : 'No listings yet'}
              </h3>
              <p className="text-gray-500 mb-6">
                {filterStatus === 'drafts' ? 'You have no saved drafts.' : 
                 filterStatus === 'published' ? 'Your published listings will appear here.' : 
                 'Start by creating your first property listing'}
              </p>
              <button onClick={() => navigate('/create-listing')} className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg flex items-center gap-2 mx-auto">
                <Plus className="w-5 h-5" />Create Your First Listing
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {listings.map((listing) => (
                <div key={listing.id} className="bg-white rounded-2xl shadow-sm border overflow-hidden hover:shadow-lg transition">
                  <div className="relative h-48 bg-gray-200">
                    {listing.cover_image || (listing.images && listing.images[0]) ? (
                      <img 
                        src={`${API_URL}${listing.cover_image || listing.images[0]}`}
                        alt={listing.title}
                        className="w-full h-full object-cover"
                        loading="lazy"
                        onError={(e) => { e.target.onerror = null; e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 24 24" fill="none" stroke="%23999"%3E%3Crect x="2" y="2" width="20" height="20" rx="2.18"%3E%3C/rect%3E%3C/svg%3E' }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center"><Home className="w-12 h-12 text-gray-400" /></div>
                    )}
                    <div className="absolute top-2 right-2">{getStatusBadge(listing.is_draft, listing.status)}</div>
                    <div className="absolute top-2 left-2">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${listing.listing_type === 'sale' ? 'bg-green-600 text-white' : 'bg-blue-600 text-white'}`}>
                        {listing.listing_type === 'sale' ? <DollarSign className="w-3 h-3" /> : <Calendar className="w-3 h-3" />}
                        {listing.listing_type === 'sale' ? 'For Sale' : 'For Rent'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="p-4">
                    <h3 className="font-semibold text-lg text-gray-900 mb-1 line-clamp-1">{listing.title}</h3>
                    <div className="flex items-center gap-1 text-gray-500 text-sm mb-2"><MapPin className="w-3 h-3" /><span>{listing.city || 'Location not set'}</span></div>
                    <p className="text-xl font-bold text-blue-600 mb-3">ETB {listing.price?.toLocaleString() || 0}{listing.listing_type === 'rent' && <span className="text-sm text-gray-500"> /month</span>}</p>
                    
                    <div className="flex gap-4 text-sm text-gray-500 mb-3">
                      <div className="flex items-center gap-1"><Bed className="w-4 h-4" /><span>{listing.bedrooms || 0} beds</span></div>
                      <div className="flex items-center gap-1"><Bath className="w-4 h-4" /><span>{listing.bathrooms || 0} baths</span></div>
                      <div className="flex items-center gap-1"><Square className="w-4 h-4" /><span>{listing.sqft || 0} sqft</span></div>
                    </div>
                    
                    <div className="flex gap-2">
                      <button onClick={() => handleView(listing.id)} className="flex-1 px-3 py-2 border rounded-lg text-sm font-medium hover:bg-gray-50 flex items-center justify-center gap-1"><Eye className="w-4 h-4" />View</button>
                      <button onClick={() => handleEdit(listing)} className="flex-1 px-3 py-2 border border-blue-200 text-blue-600 rounded-lg text-sm font-medium hover:bg-blue-50 flex items-center justify-center gap-1"><Edit className="w-4 h-4" />Edit</button>
                      {listing.is_draft && (
                        <button onClick={() => handlePublish(listing.id)} className="flex-1 px-3 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 flex items-center justify-center gap-1">
                          <CheckCircle className="w-4 h-4" />Publish
                        </button>
                      )}
                      <button onClick={() => setDeleteConfirm(listing.id)} className="px-3 py-2 border border-red-200 text-red-600 rounded-lg text-sm font-medium hover:bg-red-50 flex items-center justify-center gap-1">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
      {deleteConfirm && <DeleteConfirmModal />}
    </div>
  )
}

export default MyListingsPage