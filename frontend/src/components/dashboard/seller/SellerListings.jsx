import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Home, MapPin, Bed, Bath, Square, PlusCircle, Trash2, Edit, Eye, DollarSign, Calendar, Clock, CheckCircle } from 'lucide-react'
import toast from 'react-hot-toast'

const API_URL = 'http://localhost:8000'

const SellerListings = () => {
  const navigate = useNavigate()
  const [listings, setListings] = useState([])
  const [loading, setLoading] = useState(true)
  const [deleteConfirm, setDeleteConfirm] = useState(null)

  useEffect(() => {
    fetchListings()
  }, [])

  const fetchListings = async () => {
    try {
      const token = localStorage.getItem('access_token')
      const response = await fetch(`${API_URL}/api/listings/my-listings?include_drafts=true`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      if (response.ok) {
        const data = await response.json()
        const allListings = data.listings || []
        setListings(allListings.filter(l => l.listing_type === 'sale'))
      }
    } catch (error) {
      console.error('Error fetching listings:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id) => {
    try {
      const token = localStorage.getItem('access_token')
      const response = await fetch(`${API_URL}/api/listings/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      if (response.ok) {
        toast.success('Listing deleted successfully')
        fetchListings()
      } else {
        toast.error('Failed to delete listing')
      }
    } catch (error) {
      toast.error('Error deleting listing')
    }
    setDeleteConfirm(null)
  }

  const handlePublish = async (id) => {
    try {
      const token = localStorage.getItem('access_token')
      const response = await fetch(`${API_URL}/api/listings/${id}/publish`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      if (response.ok) {
        toast.success('Listing published successfully!')
        fetchListings()
      } else {
        toast.error('Failed to publish listing')
      }
    } catch (error) {
      toast.error('Error publishing listing')
    }
  }

  const getStatusBadge = (isDraft, status) => {
    if (isDraft) {
      return <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs"><Clock className="w-3 h-3" /> Draft</span>
    }
    if (status === 'active') {
      return <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs"><CheckCircle className="w-3 h-3" /> Published</span>
    }
    return <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs">{status}</span>
  }

  const DeleteConfirmModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4">
        <h3 className="text-xl font-bold text-red-600 mb-4">Delete Listing</h3>
        <p className="text-gray-600 mb-6">Are you sure you want to delete this listing? This action cannot be undone.</p>
        <div className="flex gap-3">
          <button onClick={() => setDeleteConfirm(null)} className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50">Cancel</button>
          <button onClick={() => handleDelete(deleteConfirm)} className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">Delete</button>
        </div>
      </div>
    </div>
  )

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Listings</h1>
          <p className="text-gray-500 text-sm">Manage your properties for sale</p>
        </div>
        <button onClick={() => navigate('/create-listing')} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2">
          <PlusCircle className="w-4 h-4" /> Create New Listing
        </button>
      </div>

      {listings.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border p-12 text-center">
          <Home className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No listings yet</p>
          <button onClick={() => navigate('/create-listing')} className="mt-4 text-blue-600 hover:underline">Create your first listing →</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {listings.map((listing) => (
            <div key={listing.id} className="bg-white rounded-xl shadow-sm border overflow-hidden hover:shadow-md transition">
              <div className="relative h-44 bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
                <Home className="w-12 h-12 text-white/30" />
                <div className="absolute top-3 right-3">{getStatusBadge(listing.is_draft, listing.status)}</div>
                <div className="absolute top-3 left-3 px-2 py-1 rounded-lg text-xs font-semibold text-white bg-green-600">
                  {listing.listing_type === 'sale' ? 'For Sale' : 'For Rent'}
                </div>
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-gray-900 line-clamp-1">{listing.title}</h3>
                <div className="flex items-center gap-1 text-gray-500 text-sm mt-1">
                  <MapPin className="w-3 h-3" /> {listing.city || 'Addis Ababa'}
                </div>
                <div className="flex gap-3 mt-2 text-sm text-gray-500">
                  <span><Bed className="w-3 h-3 inline mr-1" /> {listing.bedrooms || 0}</span>
                  <span><Bath className="w-3 h-3 inline mr-1" /> {listing.bathrooms || 0}</span>
                  <span><Square className="w-3 h-3 inline mr-1" /> {listing.sqft || 0}</span>
                </div>
                <p className="text-lg font-bold text-blue-600 mt-2">ETB {listing.price?.toLocaleString()}</p>
                <div className="flex gap-2 mt-3">
                  <button onClick={() => window.open(`/properties/${listing.id}`, '_blank')} className="flex-1 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-200 transition flex items-center justify-center gap-1">
                    <Eye className="w-4 h-4" /> View
                  </button>
                  <button onClick={() => navigate(`/edit-listing/${listing.id}`)} className="flex-1 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-200 transition flex items-center justify-center gap-1">
                    <Edit className="w-4 h-4" /> Edit
                  </button>
                  {listing.is_draft && (
                    <button onClick={() => handlePublish(listing.id)} className="flex-1 py-2 bg-green-600 text-white rounded-lg text-sm font-semibold hover:bg-green-700 transition flex items-center justify-center gap-1">
                      <CheckCircle className="w-4 h-4" /> Publish
                    </button>
                  )}
                  <button onClick={() => setDeleteConfirm(listing.id)} className="px-3 py-2 bg-red-100 text-red-600 rounded-lg text-sm font-semibold hover:bg-red-200 transition">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      {deleteConfirm && <DeleteConfirmModal />}
    </div>
  )
}

export default SellerListings