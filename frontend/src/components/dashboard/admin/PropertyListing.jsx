import React, { useState, useEffect } from 'react'
import { CheckCircle, XCircle, Clock, Eye, Home, MapPin, DollarSign } from 'lucide-react'
import toast from 'react-hot-toast'

const API_URL = 'http://localhost:8000'

const Propertylisting = () => {
  const [properties, setProperties] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('pending')

  useEffect(() => {
    fetchProperties()
  }, [activeTab])

  const fetchProperties = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('access_token')
      const response = await fetch(`${API_URL}/api/admin/property-approvals?status=${activeTab}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      if (!response.ok) throw new Error('Failed to fetch properties')
      
      const data = await response.json()
      setProperties(data)
    } catch (error) {
      console.error('Error fetching properties:', error)
      toast.error('Failed to load property approvals')
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (propertyId) => {
    try {
      const token = localStorage.getItem('access_token')
      const response = await fetch(`${API_URL}/api/admin/properties/${propertyId}/approve`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      if (!response.ok) throw new Error('Failed to approve')
      
      toast.success('Property approved successfully')
      fetchProperties()
    } catch (error) {
      toast.error('Failed to approve property')
    }
  }

  const getStatusCounts = () => {
    return {
      pending: properties.filter(p => p.status === 'pending').length,
      approved: properties.filter(p => p.status === 'approved').length,
      rejected: properties.filter(p => p.status === 'rejected').length,
      all: properties.length
    }
  }

  const counts = getStatusCounts()
  const tabs = [
    { id: 'pending', label: 'Pending', count: counts.pending },
    { id: 'approved', label: 'Approved', count: counts.approved },
    { id: 'rejected', label: 'Rejected', count: counts.rejected },
    { id: 'all', label: 'All', count: counts.all },
  ]

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Property Approval Queue</h1>
        <p className="text-gray-500">Review and approve property listings</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1 mb-6 w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-6 py-2 rounded-lg font-medium transition ${
              activeTab === tab.id
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {tab.label} ({tab.count})
          </button>
        ))}
      </div>

      {/* Properties List */}
      {properties.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border p-12 text-center">
          <Home className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No pending properties</h3>
          <p className="text-gray-500">All property requests have been processed</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {properties.map((property) => (
            <div key={property.id} className="bg-white rounded-2xl shadow-sm border p-6 hover:shadow-md transition">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold text-lg">{property.title}</h3>
                    {property.status === 'pending' && (
                      <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs flex items-center gap-1">
                        <Clock className="w-3 h-3" /> Pending
                      </span>
                    )}
                    {property.status === 'approved' && (
                      <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" /> Approved
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm mb-3">
                    <div>
                      <p className="text-gray-500">Owner</p>
                      <p className="font-medium">{property.user_name}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Price</p>
                      <p className="font-medium text-green-600">ETB {property.price?.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Type</p>
                      <p className="font-medium capitalize">{property.listing_type}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <MapPin className="w-4 h-4" />
                    <span>{property.address}, {property.city}</span>
                  </div>
                  {property.status === 'pending' && (
                    <div className="flex gap-2 mt-4">
                      <button
                        onClick={() => handleApprove(property.id)}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 flex items-center gap-1"
                      >
                        <CheckCircle className="w-4 h-4" /> Approve Property
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default Propertylisting