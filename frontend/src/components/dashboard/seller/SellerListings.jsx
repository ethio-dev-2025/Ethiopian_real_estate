// src/components/dashboard/seller/SellerListings.jsx - LARGER IMAGES, SMALLER CONTENT
import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  Home, MapPin, Bed, Bath, Square, PlusCircle, Trash2, Edit, Eye, 
  Calendar, Clock, CheckCircle, Image, X, Award, Search as SearchIcon,
  Filter, Grid3x3, List
} from 'lucide-react'
import toast from 'react-hot-toast'

const API_URL = 'http://localhost:8000'

// Mark as Sold Modal Component
const MarkAsSoldModalComponent = ({ listing, isOpen, onClose, onSuccess }) => {
  const [buyerUsername, setBuyerUsername] = useState('')
  const [searching, setSearching] = useState(false)
  const [foundBuyer, setFoundBuyer] = useState(null)
  const [amount, setAmount] = useState('')
  const [paymentRef, setPaymentRef] = useState('')

  const searchBuyer = async () => {
    if (!buyerUsername || buyerUsername.trim() === '') {
      toast.error('Please enter a username')
      return
    }
    
    setSearching(true)
    try {
      const token = localStorage.getItem('access_token')
      const response = await fetch(`${API_URL}/api/users/by-username?username=${encodeURIComponent(buyerUsername)}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      if (response.ok) {
        const user = await response.json()
        setFoundBuyer(user)
        toast.success(`Buyer found: ${user.full_name || user.username}`)
      } else {
        toast.error('User not found. Please check the username.')
        setFoundBuyer(null)
      }
    } catch (error) {
      toast.error('Error searching for user')
      setFoundBuyer(null)
    } finally {
      setSearching(false)
    }
  }

  const handleConfirm = async () => {
    if (!foundBuyer) {
      toast.error('Please find a buyer first')
      return
    }
    
    if (!amount || parseFloat(amount) <= 0) {
      toast.error('Please enter a valid sale amount')
      return
    }
    
    try {
      const token = localStorage.getItem('access_token')
      const response = await fetch(`${API_URL}/api/transactions/mark-sold/${listing.id}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          buyer_id: foundBuyer.id,
          amount: parseFloat(amount),
          payment_reference: paymentRef || null
        })
      })
      
      if (response.ok) {
        toast.success(`Property marked as SOLD to ${foundBuyer.full_name || foundBuyer.username}!`)
        onSuccess()
        onClose()
      } else {
        const error = await response.json()
        toast.error(error.detail || 'Failed to mark as sold')
      }
    } catch (error) {
      console.error('Error marking as sold:', error)
      toast.error('Error marking as sold')
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-green-600">Mark as Sold</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <p className="text-gray-600 mb-4">
          Marking <span className="font-semibold">{listing?.title}</span> as SOLD
        </p>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Buyer Username *</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={buyerUsername}
                onChange={(e) => setBuyerUsername(e.target.value)}
                placeholder="Enter buyer's username"
                className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                autoComplete="off"
              />
              <button
                onClick={searchBuyer}
                disabled={searching}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 flex items-center gap-1"
              >
                <SearchIcon className="w-4 h-4" />
                {searching ? '...' : 'Find'}
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">Enter the buyer's username (not email)</p>
          </div>
          
          {foundBuyer && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <p className="text-sm text-green-800">
                <strong>Buyer Found:</strong> {foundBuyer.full_name || foundBuyer.username}
                <br />
                <span className="text-xs">Username: {foundBuyer.username}</span>
              </p>
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Sale Amount (ETB) *</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="e.g., 15000000"
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Payment Reference (Optional)</label>
            <input
              type="text"
              value={paymentRef}
              onChange={(e) => setPaymentRef(e.target.value)}
              placeholder="Chapa transaction ID or receipt number"
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
            />
          </div>
        </div>
        
        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50">
            Cancel
          </button>
          <button 
            onClick={handleConfirm} 
            disabled={!foundBuyer || !amount}
            className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
          >
            Confirm Sale
          </button>
        </div>
      </div>
    </div>
  )
}

// Mark as Rented Modal Component
const MarkAsRentedModalComponent = ({ listing, isOpen, onClose, onSuccess }) => {
  const [buyerUsername, setBuyerUsername] = useState('')
  const [searching, setSearching] = useState(false)
  const [foundBuyer, setFoundBuyer] = useState(null)
  const [amount, setAmount] = useState('')
  const [paymentRef, setPaymentRef] = useState('')
  const [rentalMonths, setRentalMonths] = useState(12)

  const searchBuyer = async () => {
    if (!buyerUsername || buyerUsername.trim() === '') {
      toast.error('Please enter a username')
      return
    }
    
    setSearching(true)
    try {
      const token = localStorage.getItem('access_token')
      const response = await fetch(`${API_URL}/api/users/by-username?username=${encodeURIComponent(buyerUsername)}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      if (response.ok) {
        const user = await response.json()
        setFoundBuyer(user)
        toast.success(`Renter found: ${user.full_name || user.username}`)
      } else {
        toast.error('User not found. Please check the username.')
        setFoundBuyer(null)
      }
    } catch (error) {
      toast.error('Error searching for user')
      setFoundBuyer(null)
    } finally {
      setSearching(false)
    }
  }

  const handleConfirm = async () => {
    if (!foundBuyer) {
      toast.error('Please find a renter first')
      return
    }
    
    if (!amount || parseFloat(amount) <= 0) {
      toast.error('Please enter a valid monthly rent amount')
      return
    }
    
    try {
      const token = localStorage.getItem('access_token')
      const response = await fetch(`${API_URL}/api/transactions/mark-rented/${listing.id}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          buyer_id: foundBuyer.id,
          monthly_rent: parseFloat(amount),
          rental_duration_months: rentalMonths,
          payment_reference: paymentRef || null
        })
      })
      
      if (response.ok) {
        toast.success(`Property marked as RENTED to ${foundBuyer.full_name || foundBuyer.username}!`)
        onSuccess()
        onClose()
      } else {
        const error = await response.json()
        toast.error(error.detail || 'Failed to mark as rented')
      }
    } catch (error) {
      console.error('Error marking as rented:', error)
      toast.error('Error marking as rented')
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-blue-600">Mark as Rented</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <p className="text-gray-600 mb-4">
          Marking <span className="font-semibold">{listing?.title}</span> as RENTED
        </p>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Renter Username *</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={buyerUsername}
                onChange={(e) => setBuyerUsername(e.target.value)}
                placeholder="Enter renter's username"
                className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                autoComplete="off"
              />
              <button
                onClick={searchBuyer}
                disabled={searching}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 flex items-center gap-1"
              >
                <SearchIcon className="w-4 h-4" />
                {searching ? '...' : 'Find'}
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">Enter the renter's username (not email)</p>
          </div>
          
          {foundBuyer && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-blue-800">
                <strong>Renter Found:</strong> {foundBuyer.full_name || foundBuyer.username}
                <br />
                <span className="text-xs">Username: {foundBuyer.username}</span>
              </p>
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Monthly Rent (ETB) *</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="e.g., 25000"
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Lease Duration</label>
            <select
              value={rentalMonths}
              onChange={(e) => setRentalMonths(parseInt(e.target.value))}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="6">6 months</option>
              <option value="12">1 year</option>
              <option value="24">2 years</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Payment Reference (Optional)</label>
            <input
              type="text"
              value={paymentRef}
              onChange={(e) => setPaymentRef(e.target.value)}
              placeholder="Chapa transaction ID or receipt number"
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        
        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50">
            Cancel
          </button>
          <button 
            onClick={handleConfirm} 
            disabled={!foundBuyer || !amount}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            Confirm Rental
          </button>
        </div>
      </div>
    </div>
  )
}

const SellerListings = () => {
  const navigate = useNavigate()
  const [listings, setListings] = useState([])
  const [filteredListings, setFilteredListings] = useState([])
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [imageErrors, setImageErrors] = useState({})
  const [isLoading, setIsLoading] = useState(false)
  const [activeFilter, setActiveFilter] = useState('all')
  const [viewMode, setViewMode] = useState('grid')
  
  // Modal states
  const [showSoldModal, setShowSoldModal] = useState(false)
  const [selectedSoldListing, setSelectedSoldListing] = useState(null)
  const [showRentedModal, setShowRentedModal] = useState(false)
  const [selectedRentedListing, setSelectedRentedListing] = useState(null)

  useEffect(() => {
    fetchListings()
  }, [])

  useEffect(() => {
    applyFilter()
  }, [listings, activeFilter])

  const fetchListings = async () => {
    setIsLoading(true)
    try {
      const token = localStorage.getItem('access_token')
      const response = await fetch(`${API_URL}/api/listings/my-listings?include_drafts=true`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      if (response.ok) {
        const data = await response.json()
        const allListings = data.listings || []
        setListings(allListings)
      }
    } catch (error) {
      console.error('Error fetching listings:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const applyFilter = () => {
    let filtered = [...listings]
    
    switch (activeFilter) {
      case 'for_sale':
        filtered = filtered.filter(l => l.listing_type === 'sale')
        break
      case 'for_rent':
        filtered = filtered.filter(l => l.listing_type === 'rent')
        break
      case 'drafts':
        filtered = filtered.filter(l => l.is_draft === true)
        break
      case 'published':
        filtered = filtered.filter(l => l.is_draft === false && l.status === 'active')
        break
      default:
        break
    }
    
    setFilteredListings(filtered)
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

  const handleMarkAsSoldSuccess = () => {
    fetchListings()
    setTimeout(() => {
      if (window.location.pathname === '/') {
        window.location.reload()
      }
    }, 1000)
  }

  const handleMarkAsRentedSuccess = () => {
    fetchListings()
    setTimeout(() => {
      if (window.location.pathname === '/') {
        window.location.reload()
      }
    }, 1000)
  }

  const getImageUrl = (imagePath) => {
    if (!imagePath) return null
    if (imagePath.startsWith('http')) return imagePath
    if (imagePath.startsWith('/uploads')) return `${API_URL}${imagePath}`
    return `${API_URL}/uploads/${imagePath}`
  }

  const getFirstImage = (listing) => {
    if (listing.cover_image) {
      return getImageUrl(listing.cover_image)
    }
    
    if (listing.images) {
      try {
        const images = typeof listing.images === 'string' ? JSON.parse(listing.images) : listing.images
        if (images && images.length > 0) {
          return getImageUrl(images[0])
        }
      } catch (e) {
        console.error('Error parsing images:', e)
      }
    }
    
    return null
  }

  const handleImageError = (listingId) => {
    setImageErrors(prev => ({ ...prev, [listingId]: true }))
  }

  // Get diagonal overlay for sold/rented properties
  const getStatusOverlay = (listing) => {
    if (listing.listing_status === 'sold') {
      return (
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-10">
          <div className="bg-red-600 text-white px-6 py-2 rounded-lg font-bold text-lg transform -rotate-12 shadow-lg">
            SOLD
          </div>
        </div>
      )
    }
    if (listing.listing_status === 'rented') {
      return (
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-10">
          <div className="bg-purple-600 text-white px-6 py-2 rounded-lg font-bold text-lg transform -rotate-12 shadow-lg">
            RENTED
          </div>
        </div>
      )
    }
    return null
  }

  const filterTabs = [
    { id: 'all', label: 'All Properties', icon: Home, count: listings.length },
    { id: 'for_sale', label: 'For Sale', icon: Award, count: listings.filter(l => l.listing_type === 'sale').length },
    { id: 'for_rent', label: 'For Rent', icon: Calendar, count: listings.filter(l => l.listing_type === 'rent').length },
    { id: 'published', label: 'Published', icon: CheckCircle, count: listings.filter(l => l.is_draft === false && l.status === 'active').length },
    { id: 'drafts', label: 'Drafts', icon: Clock, count: listings.filter(l => l.is_draft === true).length },
  ]

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

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Listings</h1>
          <p className="text-gray-500 text-sm">Manage your properties</p>
        </div>
        <button onClick={() => navigate('/create-listing')} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2">
          <PlusCircle className="w-4 h-4" /> Create New Listing
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2 mb-6 border-b pb-4">
        {filterTabs.map((tab) => {
          const Icon = tab.icon
          const isActive = activeFilter === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveFilter(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition ${
                isActive
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
              <span className={`text-xs ${isActive ? 'text-white/80' : 'text-gray-500'}`}>
                ({tab.count})
              </span>
            </button>
          )
        })}
      </div>

      {/* View Mode Toggle */}
      <div className="flex justify-end items-center mb-4 gap-2">
        <button
          onClick={() => setViewMode('grid')}
          className={`p-2 rounded-lg transition ${viewMode === 'grid' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'}`}
        >
          <Grid3x3 className="w-4 h-4" />
        </button>
        <button
          onClick={() => setViewMode('list')}
          className={`p-2 rounded-lg transition ${viewMode === 'list' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'}`}
        >
          <List className="w-4 h-4" />
        </button>
      </div>

      {filteredListings.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border p-12 text-center">
          <Home className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No listings found in this category</p>
          <button onClick={() => navigate('/create-listing')} className="mt-4 text-blue-600 hover:underline">Create your first listing →</button>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredListings.map((listing) => {
            const imageUrl = getFirstImage(listing)
            const hasError = imageErrors[listing.id]
            const isSold = listing.listing_status === 'sold'
            const isRented = listing.listing_status === 'rented'
            const isDraft = listing.is_draft
            const showMarkSoldButton = !isSold && !isRented && !isDraft && listing.listing_type === 'sale'
            const showMarkRentedButton = !isSold && !isRented && !isDraft && listing.listing_type === 'rent'
            
            return (
              <div key={listing.id} className="bg-white rounded-xl shadow-sm border overflow-hidden hover:shadow-md transition flex flex-col relative">
                {/* LARGER IMAGE SECTION - Increased from h-48 to h-64 */}
                <div className="relative h-64 bg-gray-200 overflow-hidden">
                  {imageUrl && !hasError ? (
                    <img 
                      src={imageUrl} 
                      alt={listing.title} 
                      className="w-full h-full object-cover hover:scale-105 transition duration-300"
                      onError={() => handleImageError(listing.id)}
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                      <Image className="w-12 h-12 text-gray-400 mb-2" />
                      <p className="text-xs text-gray-500">No Image</p>
                    </div>
                  )}
                  
                  {/* DRAFT badge */}
                  {isDraft && (
                    <div className="absolute top-3 right-3 z-10">
                      <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-yellow-500 text-white rounded-full text-xs font-bold shadow-lg">
                        <Clock className="w-3 h-3" /> DRAFT
                      </span>
                    </div>
                  )}
                  
                  {/* Listing Type Badge */}
                  <div className="absolute top-3 left-3 z-10">
                    <span className={`px-2 py-1 rounded-lg text-xs font-semibold text-white ${
                      listing.listing_type === 'sale' ? 'bg-green-600' : 'bg-blue-600'
                    }`}>
                      {listing.listing_type === 'sale' ? 'For Sale' : 'For Rent'}
                    </span>
                  </div>
                  
                  {/* Diagonal overlay for sold/rented properties */}
                  {getStatusOverlay(listing)}
                </div>
                
                {/* SMALLER CONTENT SECTION - Reduced padding and text sizes */}
                <div className="p-3 flex-1 flex flex-col">
                  <h3 className="font-semibold text-gray-900 line-clamp-1 text-base">{listing.title}</h3>
                  
                  <div className="flex items-center gap-1 text-gray-500 text-xs mt-1">
                    <MapPin className="w-3 h-3 flex-shrink-0" />
                    <span className="truncate">{listing.city || 'Addis Ababa'}</span>
                  </div>
                  
                  <div className="flex gap-2 mt-1 text-xs text-gray-500">
                    <span className="flex items-center gap-1"><Bed className="w-3 h-3" /> {listing.bedrooms || 0}</span>
                    <span className="flex items-center gap-1"><Bath className="w-3 h-3" /> {listing.bathrooms || 0}</span>
                    <span className="flex items-center gap-1"><Square className="w-3 h-3" /> {listing.sqft || 0}</span>
                  </div>
                  
                  <p className="text-lg font-bold text-blue-600 mt-1">ETB {listing.price?.toLocaleString()}</p>
                  
                  <div className="flex gap-1 mt-2 flex-wrap">
                    <button 
                      onClick={() => window.open(`/properties/${listing.id}`, '_blank')} 
                      className="flex-1 py-1.5 bg-gray-100 text-gray-700 rounded-md text-xs font-semibold hover:bg-gray-200 transition flex items-center justify-center gap-1"
                    >
                      <Eye className="w-3 h-3" /> View
                    </button>
                    <button 
                      onClick={() => navigate(`/edit-listing/${listing.id}`)} 
                      className="flex-1 py-1.5 bg-gray-100 text-gray-700 rounded-md text-xs font-semibold hover:bg-gray-200 transition flex items-center justify-center gap-1"
                    >
                      <Edit className="w-3 h-3" /> Edit
                    </button>
                    
                    {isDraft && (
                      <button 
                        onClick={() => handlePublish(listing.id)} 
                        className="flex-1 py-1.5 bg-green-600 text-white rounded-md text-xs font-semibold hover:bg-green-700 transition flex items-center justify-center gap-1"
                      >
                        <CheckCircle className="w-3 h-3" /> Publish
                      </button>
                    )}
                    
                    {showMarkSoldButton && (
                      <button 
                        onClick={() => {
                          setSelectedSoldListing(listing)
                          setShowSoldModal(true)
                        }} 
                        className="flex-1 py-1.5 bg-green-600 text-white rounded-md text-xs font-semibold hover:bg-green-700 transition flex items-center justify-center gap-1"
                      >
                        <Award className="w-3 h-3" /> Sold
                      </button>
                    )}
                    
                    {showMarkRentedButton && (
                      <button 
                        onClick={() => {
                          setSelectedRentedListing(listing)
                          setShowRentedModal(true)
                        }} 
                        className="flex-1 py-1.5 bg-blue-600 text-white rounded-md text-xs font-semibold hover:bg-blue-700 transition flex items-center justify-center gap-1"
                      >
                        <Calendar className="w-3 h-3" /> Rent
                      </button>
                    )}
                    
                    <button 
                      onClick={() => setDeleteConfirm(listing.id)} 
                      className="px-2 py-1.5 bg-red-100 text-red-600 rounded-md text-xs font-semibold hover:bg-red-200 transition"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredListings.map((listing) => {
            const imageUrl = getFirstImage(listing)
            const hasError = imageErrors[listing.id]
            const isSold = listing.listing_status === 'sold'
            const isRented = listing.listing_status === 'rented'
            const isDraft = listing.is_draft
            const showMarkSoldButton = !isSold && !isRented && !isDraft && listing.listing_type === 'sale'
            const showMarkRentedButton = !isSold && !isRented && !isDraft && listing.listing_type === 'rent'
            
            return (
              <div key={listing.id} className="bg-white rounded-xl shadow-sm border overflow-hidden hover:shadow-md transition flex flex-col sm:flex-row relative">
                {/* LARGER IMAGE in list view */}
                <div className="w-full sm:w-40 h-40 bg-gray-200 flex-shrink-0 relative">
                  {imageUrl && !hasError ? (
                    <img 
                      src={imageUrl} 
                      alt={listing.title} 
                      className="w-full h-full object-cover"
                      onError={() => handleImageError(listing.id)}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-100">
                      <Image className="w-6 h-6 text-gray-400" />
                    </div>
                  )}
                  {/* Diagonal overlay for list view */}
                  {isSold && (
                    <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                      <span className="bg-red-600 text-white px-2 py-1 rounded text-xs font-bold transform -rotate-12">SOLD</span>
                    </div>
                  )}
                  {isRented && (
                    <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                      <span className="bg-purple-600 text-white px-2 py-1 rounded text-xs font-bold transform -rotate-12">RENTED</span>
                    </div>
                  )}
                </div>
                <div className="flex-1 p-3">
                  <div className="flex flex-wrap justify-between items-start gap-2">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-gray-900 text-sm">{listing.title}</h3>
                        <span className={`text-xs px-2 py-0.5 rounded-full text-white ${
                          listing.listing_type === 'sale' ? 'bg-green-600' : 'bg-blue-600'
                        }`}>
                          {listing.listing_type === 'sale' ? 'Sale' : 'Rent'}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-gray-500 text-xs">
                        <MapPin className="w-3 h-3" />
                        <span>{listing.city || 'Addis Ababa'}</span>
                      </div>
                      <div className="flex gap-2 mt-1 text-xs text-gray-500">
                        <span><Bed className="w-3 h-3 inline mr-1" /> {listing.bedrooms || 0}</span>
                        <span><Bath className="w-3 h-3 inline mr-1" /> {listing.bathrooms || 0}</span>
                        <span><Square className="w-3 h-3 inline mr-1" /> {listing.sqft || 0}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-base font-bold text-blue-600">ETB {listing.price?.toLocaleString()}</p>
                      <div className="flex gap-1 mt-1">
                        <button onClick={() => window.open(`/properties/${listing.id}`, '_blank')} className="px-2 py-1 bg-gray-100 rounded text-xs">View</button>
                        <button onClick={() => navigate(`/edit-listing/${listing.id}`)} className="px-2 py-1 bg-gray-100 rounded text-xs">Edit</button>
                        {isDraft && (
                          <button onClick={() => handlePublish(listing.id)} className="px-2 py-1 bg-green-600 text-white rounded text-xs">Pub</button>
                        )}
                        {showMarkSoldButton && (
                          <button onClick={() => { setSelectedSoldListing(listing); setShowSoldModal(true) }} className="px-2 py-1 bg-green-600 text-white rounded text-xs">Sold</button>
                        )}
                        {showMarkRentedButton && (
                          <button onClick={() => { setSelectedRentedListing(listing); setShowRentedModal(true) }} className="px-2 py-1 bg-blue-600 text-white rounded text-xs">Rent</button>
                        )}
                        <button onClick={() => setDeleteConfirm(listing.id)} className="px-2 py-1 bg-red-100 text-red-600 rounded text-xs">Del</button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
      
      {deleteConfirm && <DeleteConfirmModal />}
      
      <MarkAsSoldModalComponent 
        listing={selectedSoldListing}
        isOpen={showSoldModal}
        onClose={() => {
          setShowSoldModal(false)
          setSelectedSoldListing(null)
        }}
        onSuccess={handleMarkAsSoldSuccess}
      />
      
      <MarkAsRentedModalComponent 
        listing={selectedRentedListing}
        isOpen={showRentedModal}
        onClose={() => {
          setShowRentedModal(false)
          setSelectedRentedListing(null)
        }}
        onSuccess={handleMarkAsRentedSuccess}
      />
    </div>
  )
}

export default SellerListings