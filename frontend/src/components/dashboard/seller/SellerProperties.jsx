import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Home, MapPin, Bed, Bath, Square, PlusCircle, Trash2, Edit, Eye, Calendar, Clock, CheckCircle } from 'lucide-react'
import toast from 'react-hot-toast'

const API_URL = 'http://localhost:8000'

const SellerProperties = () => {
  const navigate = useNavigate()
  const [properties, setProperties] = useState([])
  const [loading, setLoading] = useState(true)
  const [deleteConfirm, setDeleteConfirm] = useState(null)

  useEffect(() => {
    fetchProperties()
  }, [])

  const fetchProperties = async () => {
    try {
      const token = localStorage.getItem('access_token')
      const response = await fetch(`${API_URL}/api/listings/my-listings?include_drafts=true`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      if (response.ok) {
        const data = await response.json()
        const allListings = data.listings || []
        setProperties(allListings.filter(l => l.listing_type === 'rent'))
      }
    } catch (error) {
      console.error('Error fetching properties:', error)
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
        toast.success('Property deleted successfully')
        fetchProperties()
      } else {
        toast.error('Failed to delete property')
      }
    } catch (error) {
      toast.error('Error deleting property')
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
        toast.success('Property published successfully!')
        fetchProperties()
      } else {
        toast.error('Failed to publish property')
      }
    } catch (error) {
      toast.error('Error publishing property')
    }
  }

  const getStatusBadge = (isDraft, status) => {
    if (isDraft) {
      return <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs"><Clock className="w-3 h-3" /> Draft</span>
    }
    if (status === 'active') {
      return <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs"><CheckCircle className="w-3 h-3" /> Active</span>
    }
    return <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs">{status}</span>
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Properties</h1>
          <p className="text-gray-500 text-sm">Manage your rental properties</p>
        </div>
        <button onClick={() => navigate('/add-property')} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center gap-2">
          <PlusCircle className="w-4 h-4" /> Add Property
        </button>
      </div>

      {properties.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border p-12 text-center">
          <Home className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No rental properties yet</p>
          <button onClick={() => navigate('/add-property')} className="mt-4 text-green-600 hover:underline">Add your first property →</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {properties.map((property) => (
            <div key={property.id} className="bg-white rounded-xl shadow-sm border overflow-hidden hover:shadow-md transition">
              <div className="relative h-44 bg-gradient-to-r from-green-500 to-teal-500 flex items-center justify-center">
                <Home className="w-12 h-12 text-white/30" />
                <div className="absolute top-3 right-3">{getStatusBadge(property.is_draft, property.status)}</div>
                <div className="absolute top-3 left-3 px-2 py-1 rounded-lg text-xs font-semibold text-white bg-blue-600">
                  For Rent
                </div>
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-gray-900 line-clamp-1">{property.title}</h3>
                <div className="flex items-center gap-1 text-gray-500 text-sm mt-1">
                  <MapPin className="w-3 h-3" /> {property.city || 'Addis Ababa'}
                </div>
                <div className="flex gap-3 mt-2 text-sm text-gray-500">
                  <span><Bed className="w-3 h-3 inline mr-1" /> {property.bedrooms || 0}</span>
                  <span><Bath className="w-3 h-3 inline mr-1" /> {property.bathrooms || 0}</span>
                  <span><Square className="w-3 h-3 inline mr-1" /> {property.sqft || 0}</span>
                </div>
                <p className="text-lg font-bold text-green-600 mt-2">ETB {property.price?.toLocaleString()}<span className="text-sm">/month</span></p>
                <div className="flex gap-2 mt-3">
                  <button onClick={() => window.open(`/properties/${property.id}`, '_blank')} className="flex-1 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-200 transition flex items-center justify-center gap-1">
                    <Eye className="w-4 h-4" /> View
                  </button>
                  <button onClick={() => navigate(`/edit-listing/${property.id}`)} className="flex-1 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-200 transition flex items-center justify-center gap-1">
                    <Edit className="w-4 h-4" /> Edit
                  </button>
                  {property.is_draft && (
                    <button onClick={() => handlePublish(property.id)} className="flex-1 py-2 bg-green-600 text-white rounded-lg text-sm font-semibold hover:bg-green-700 transition flex items-center justify-center gap-1">
                      <CheckCircle className="w-4 h-4" /> Publish
                    </button>
                  )}
                  <button onClick={() => setDeleteConfirm(property.id)} className="px-3 py-2 bg-red-100 text-red-600 rounded-lg text-sm font-semibold hover:bg-red-200 transition">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default SellerProperties