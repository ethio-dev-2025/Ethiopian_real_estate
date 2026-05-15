import React, { useState, useEffect, useCallback } from 'react'
import { 
  Home, Eye, Trash2, Edit, MapPin, Bed, Bath, Square,
  DollarSign, RefreshCw, CheckCircle, Clock, XCircle,
  AlertCircle, Send, Star
} from 'lucide-react'
import toast from 'react-hot-toast'

const API_URL = 'http://localhost:8000'

const MyListings = () => {
  const [listings, setListings] = useState([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('all')

  const getToken = () => localStorage.getItem('access_token')

  const fetchListings = useCallback(async () => {
    setLoading(true)
    try {
      const token = getToken()
      let url = `${API_URL}/api/listings/my-listings`
      if (statusFilter !== 'all') url += `?status=${statusFilter}`
      
      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await response.json()
      if (data.success) {
        setListings(data.listings)
      }
    } catch (error) {
      console.error('Error fetching listings:', error)
      toast.error('Failed to load listings')
    } finally {
      setLoading(false)
    }
  }, [statusFilter])

  useEffect(() => {
    fetchListings()
  }, [fetchListings])

  const handleDelete = async (listingId) => {
    if (!window.confirm('Are you sure you want to delete this listing? This action cannot be undone.')) return
    try {
      const token = getToken()
      const response = await fetch(`${API_URL}/api/listings/${listingId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await response.json()
      if (data.success) {
        toast.success(data.message)
        fetchListings()
      }
    } catch (error) {
      toast.error('Failed to delete listing')
    }
  }

  const handlePublish = async (listingId) => {
    try {
      const token = getToken()
      const response = await fetch(`${API_URL}/api/listings/${listingId}/publish`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await response.json()
      if (data.success) {
        toast.success(data.message)
        fetchListings()
      } else {
        toast.error(data.message || 'Failed to publish')
      }
    } catch (error) {
      toast.error('Failed to publish listing')
    }
  }

  const getStatusBadge = (status) => {
    switch(status) {
      case 'active':
        return { color: 'bg-green-100 text-green-700', icon: CheckCircle, label: 'Active' }
      case 'pending':
        return { color: 'bg-yellow-100 text-yellow-700', icon: Clock, label: 'Pending Approval' }
      case 'draft':
        return { color: 'bg-gray-100 text-gray-700', icon: Edit, label: 'Draft' }
      case 'inactive':
        return { color: 'bg-red-100 text-red-700', icon: XCircle, label: 'Inactive' }
      default:
        return { color: 'bg-gray-100 text-gray-700', icon: AlertCircle, label: status }
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
          <div>
            <h2 className="text-2xl font-bold">My Listings</h2>
            <p className="text-sm text-gray-500">Manage your property listings</p>
          </div>
          <div className="flex gap-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border rounded-lg"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="pending">Pending</option>
              <option value="draft">Draft</option>
            </select>
            <button onClick={fetchListings} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {listings.length === 0 ? (
          <div className="text-center py-12">
            <Home className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">You haven't created any listings yet</p>
            <p className="text-sm text-gray-400 mt-1">Click "Create Listing" to get started</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {listings.map((listing) => {
              const StatusBadge = getStatusBadge(listing.status)
              const StatusIcon = StatusBadge.icon
              const coverImage = listing.cover_image || (listing.images && listing.images[0]) || null
              
              return (
                <div key={listing.id} className="border rounded-lg overflow-hidden hover:shadow-lg transition">
                  <div className="relative h-48 bg-gray-200">
                    {coverImage ? (
                      <img
                        src={`${API_URL}${coverImage}`}
                        className="w-full h-48 object-cover"
                        alt={listing.title}
                      />
                    ) : (
                      <div className="w-full h-48 flex items-center justify-center">
                        <Home className="w-12 h-12 text-gray-400" />
                      </div>
                    )}
                    <div className="absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-semibold bg-blue-600 text-white">
                      {listing.listing_type === 'sale' ? 'For Sale' : 'For Rent'}
                    </div>
                    <div className="absolute bottom-2 left-2 px-2 py-1 rounded-full text-xs flex items-center gap-1 bg-white/90">
                      <StatusIcon className="w-3 h-3" />
                      <span>{StatusBadge.label}</span>
                    </div>
                    {listing.cover_image && (
                      <div className="absolute top-2 left-2 px-1 py-0.5 rounded bg-yellow-500 text-white text-xs flex items-center gap-1">
                        <Star className="w-3 h-3 fill-white" /> Cover
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-lg truncate">{listing.title}</h3>
                    <div className="flex items-center gap-1 text-sm text-gray-500 mt-1">
                      <MapPin className="w-4 h-4" />
                      <span>{listing.city}</span>
                    </div>
                    <div className="flex gap-3 mt-2 text-sm text-gray-500">
                      <div className="flex items-center gap-1"><Bed className="w-4 h-4" /> {listing.bedrooms}</div>
                      <div className="flex items-center gap-1"><Bath className="w-4 h-4" /> {listing.bathrooms}</div>
                      <div className="flex items-center gap-1"><Square className="w-4 h-4" /> {listing.sqft || 'N/A'}</div>
                    </div>
                    <p className="text-xl font-bold text-blue-600 mt-3">
                      ETB {listing.price?.toLocaleString()}
                      {listing.listing_type === 'rent' && <span className="text-sm">/month</span>}
                    </p>
                    <div className="flex gap-2 mt-4">
                      {listing.status === 'draft' && (
                        <button
                          onClick={() => handlePublish(listing.id)}
                          className="flex-1 px-3 py-1.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center justify-center gap-1"
                        >
                          <Send className="w-4 h-4" /> Publish
                        </button>
                      )}
                      <button
                        onClick={() => window.open(`/listing/${listing.id}`, '_blank')}
                        className="flex-1 px-3 py-1.5 text-sm bg-gray-100 rounded-lg hover:bg-gray-200 flex items-center justify-center gap-1"
                      >
                        <Eye className="w-4 h-4" /> Preview
                      </button>
                      <button
                        onClick={() => handleDelete(listing.id)}
                        className="flex-1 px-3 py-1.5 text-sm bg-red-50 text-red-600 rounded-lg hover:bg-red-100 flex items-center justify-center gap-1"
                      >
                        <Trash2 className="w-4 h-4" /> Delete
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
        
        <div className="mt-4 text-sm text-gray-500">
          Total: {listings.length} listing{listings.length !== 1 ? 's' : ''}
        </div>
      </div>
    </div>
  )
}

export default MyListings