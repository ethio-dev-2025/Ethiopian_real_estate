import React, { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  Search, MapPin, Bed, Bath, Square, Grid3X3, List, Loader, 
  Heart, Building2, FilterX, Eye, Star, Filter, RefreshCw,
  ImageOff, Home, ArrowRight, ChevronRight
} from 'lucide-react'
import { listingsAPI } from '../../../services/api/listingsApi'
import toast from 'react-hot-toast'

const API_URL = 'http://localhost:8000'

// Mock/Demo properties for offline/fallback
const MOCK_PROPERTIES = [
  { id: 1, title: 'Luxury Apartment in Bole', city: 'Bole, Addis Ababa', price: 15000000, listing_type: 'sale', bedrooms: 3, bathrooms: 2, sqft: 2200, featured: true, created_at: '2024-03-15' },
  { id: 2, title: 'Modern Villa with Garden', city: 'Summit, Addis Ababa', price: 45000, listing_type: 'rent', bedrooms: 4, bathrooms: 3, sqft: 3500, featured: true, created_at: '2024-02-10' },
  { id: 3, title: 'Commercial Space Kazanchis', city: 'Kazanchis, Addis Ababa', price: 25000000, listing_type: 'sale', bedrooms: 0, bathrooms: 2, sqft: 5000, featured: false, created_at: '2024-01-20' },
  { id: 4, title: 'Cozy Studio Apartment', city: 'Mexico, Addis Ababa', price: 12000, listing_type: 'rent', bedrooms: 1, bathrooms: 1, sqft: 450, featured: false, created_at: '2024-03-01' },
  { id: 5, title: 'Spacious Family House', city: 'CMC, Addis Ababa', price: 18000000, listing_type: 'sale', bedrooms: 5, bathrooms: 4, sqft: 4200, featured: true, created_at: '2023-12-05' },
  { id: 6, title: 'Executive Apartment', city: 'Bole, Addis Ababa', price: 35000, listing_type: 'rent', bedrooms: 3, bathrooms: 2, sqft: 2800, featured: false, created_at: '2024-03-10' },
]

// Property images
const PROPERTY_IMAGES = [
  'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=500&h=300&fit=crop',
  'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=500&h=300&fit=crop',
  'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=500&h=300&fit=crop',
  'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=500&h=300&fit=crop',
  'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=500&h=300&fit=crop',
  'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=500&h=300&fit=crop',
]

const getPropertyImage = (id) => {
  return PROPERTY_IMAGES[id % PROPERTY_IMAGES.length]
}

const getMockImage = (type) => {
  if (type === 'sale') {
    return 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=500&h=300&fit=crop'
  }
  return 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=500&h=300&fit=crop'
}

const BuyerProperties = () => {
  const navigate = useNavigate()
  const [allProperties, setAllProperties] = useState(MOCK_PROPERTIES)
  const [filteredProperties, setFilteredProperties] = useState(MOCK_PROPERTIES)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [listingType, setListingType] = useState('all')
  const [viewMode, setViewMode] = useState('grid')
  const [savedProperties, setSavedProperties] = useState([])
  const [priceRange, setPriceRange] = useState('all')
  const [bedrooms, setBedrooms] = useState('any')
  const [bathrooms, setBathrooms] = useState('any')
  const [sortBy, setSortBy] = useState('latest')
  const [locations, setLocations] = useState([])
  const [selectedLocation, setSelectedLocation] = useState('all')
  const [showFilters, setShowFilters] = useState(false)
  const [usingRealData, setUsingRealData] = useState(false)
  const [fetchStatus, setFetchStatus] = useState('idle')
  const [realPropertyCount, setRealPropertyCount] = useState(0)
  const dataFetched = useRef(false)
  const [imageErrors, setImageErrors] = useState({})

  // Format API property to match UI format
  const formatApiProperty = (apiProp) => {
    let imageUrl = null
    if (apiProp.images && apiProp.images.length > 0) {
      const img = apiProp.images[0]
      if (img.startsWith('http')) {
        imageUrl = img
      } else if (img.startsWith('/uploads')) {
        imageUrl = `${API_URL}${img}`
      } else {
        imageUrl = `${API_URL}/uploads/${img}`
      }
    }
    
    if (!imageUrl && apiProp.cover_image) {
      if (apiProp.cover_image.startsWith('http')) {
        imageUrl = apiProp.cover_image
      } else if (apiProp.cover_image.startsWith('/uploads')) {
        imageUrl = `${API_URL}${apiProp.cover_image}`
      } else {
        imageUrl = `${API_URL}/uploads/${apiProp.cover_image}`
      }
    }
    
    if (!imageUrl) {
      imageUrl = getMockImage(apiProp.listing_type)
    }
    
    return {
      id: apiProp.id,
      title: apiProp.title || 'Property',
      city: apiProp.city || apiProp.sub_city || apiProp.address || 'Addis Ababa',
      price: apiProp.price || 0,
      listing_type: apiProp.listing_type || 'sale',
      bedrooms: apiProp.bedrooms || 0,
      bathrooms: apiProp.bathrooms || 0,
      sqft: apiProp.sqft || 0,
      featured: apiProp.featured || false,
      created_at: apiProp.created_at || new Date().toISOString(),
      image: imageUrl
    }
  }

  // Fetch real properties from database
  const fetchRealProperties = async () => {
    setFetchStatus('loading')
    setLoading(true)
    
    try {
      const response = await listingsAPI.getPublicListingsFast({ limit: 50 })
      
      if (response && response.success && response.listings && response.listings.length > 0) {
        const formattedProperties = response.listings.map(formatApiProperty)
        setAllProperties(formattedProperties)
        setUsingRealData(true)
        setFetchStatus('success')
        setRealPropertyCount(response.total || formattedProperties.length)
        setError(null)
        
        toast.success(`Loaded ${formattedProperties.length} properties from database`, {
          duration: 2000,
          icon: '🏠'
        })
        return
      }
      
      setFetchStatus('error')
      setUsingRealData(false)
      
    } catch (error) {
      console.error('Error fetching properties:', error)
      setFetchStatus('error')
      setUsingRealData(false)
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  // Extract locations from properties
  useEffect(() => {
    const uniqueLocations = [...new Set(allProperties.map(p => p.city))].filter(Boolean)
    setLocations(uniqueLocations)
  }, [allProperties])

  // Load saved properties from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('buyer_saved_properties')
    if (saved) {
      try {
        setSavedProperties(JSON.parse(saved))
      } catch (e) {}
    }
  }, [])

  // Apply filters
  useEffect(() => {
    let filtered = [...allProperties]

    // Filter by listing type
    if (listingType !== 'all') {
      filtered = filtered.filter(prop => prop.listing_type === listingType)
    }

    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(prop =>
        prop.title.toLowerCase().includes(term) ||
        prop.city.toLowerCase().includes(term)
      )
    }

    // Filter by price range
    if (priceRange !== 'all') {
      if (listingType === 'rent') {
        if (priceRange === 'under-20k') {
          filtered = filtered.filter(prop => prop.price < 20000)
        } else if (priceRange === '20k-50k') {
          filtered = filtered.filter(prop => prop.price >= 20000 && prop.price <= 50000)
        } else if (priceRange === 'above-50k') {
          filtered = filtered.filter(prop => prop.price > 50000)
        }
      } else {
        if (priceRange === 'under-5m') {
          filtered = filtered.filter(prop => prop.price < 5000000)
        } else if (priceRange === '5m-15m') {
          filtered = filtered.filter(prop => prop.price >= 5000000 && prop.price <= 15000000)
        } else if (priceRange === 'above-15m') {
          filtered = filtered.filter(prop => prop.price > 15000000)
        }
      }
    }

    // Filter by bedrooms
    if (bedrooms !== 'any') {
      filtered = filtered.filter(prop => prop.bedrooms >= parseInt(bedrooms))
    }

    // Filter by bathrooms
    if (bathrooms !== 'any') {
      filtered = filtered.filter(prop => prop.bathrooms >= parseInt(bathrooms))
    }

    // Filter by location
    if (selectedLocation !== 'all') {
      filtered = filtered.filter(prop => prop.city === selectedLocation)
    }

    // Sort
    if (sortBy === 'price_low') {
      filtered.sort((a, b) => a.price - b.price)
    } else if (sortBy === 'price_high') {
      filtered.sort((a, b) => b.price - a.price)
    } else if (sortBy === 'latest') {
      filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    }

    setFilteredProperties(filtered)
  }, [allProperties, listingType, searchTerm, priceRange, bedrooms, bathrooms, sortBy, selectedLocation])

  // Fetch real data on mount
  useEffect(() => {
    if (!dataFetched.current) {
      dataFetched.current = true
      setTimeout(() => {
        fetchRealProperties()
      }, 300)
    }
  }, [])

  const handleSaveProperty = (property) => {
    const exists = savedProperties.some(p => p.id === property.id)
    let newSaved
    if (exists) {
      newSaved = savedProperties.filter(p => p.id !== property.id)
      toast.success('Removed from saved')
    } else {
      newSaved = [...savedProperties, property]
      toast.success('Saved to favorites')
    }
    setSavedProperties(newSaved)
    localStorage.setItem('buyer_saved_properties', JSON.stringify(newSaved))
  }

  const formatPrice = (price, type) => {
    if (!price) return 'ETB 0'
    if (type === 'rent') {
      if (price >= 1000000) return `ETB ${(price / 1000000).toFixed(1)}M/month`
      return `ETB ${price.toLocaleString()}/month`
    }
    if (price >= 10000000) return `ETB ${(price / 10000000).toFixed(1)} Cr`
    if (price >= 1000000) return `ETB ${(price / 1000000).toFixed(1)} M`
    return `ETB ${price.toLocaleString()}`
  }

  const resetFilters = () => {
    setSearchTerm('')
    setListingType('all')
    setPriceRange('all')
    setBedrooms('any')
    setBathrooms('any')
    setSortBy('latest')
    setSelectedLocation('all')
    setShowFilters(false)
    toast.success('All filters reset')
  }

  const handleImageError = (propertyId) => {
    setImageErrors(prev => ({ ...prev, [propertyId]: true }))
  }

  const getPriceOptions = () => {
    if (listingType === 'rent') {
      return [
        { value: 'all', label: 'Any Price' },
        { value: 'under-20k', label: 'Under ETB 20,000' },
        { value: '20k-50k', label: 'ETB 20,000 - 50,000' },
        { value: 'above-50k', label: 'Above ETB 50,000' }
      ]
    }
    return [
      { value: 'all', label: 'Any Price' },
      { value: 'under-5m', label: 'Under ETB 5M' },
      { value: '5m-15m', label: 'ETB 5M - 15M' },
      { value: 'above-15m', label: 'Above ETB 15M' }
    ]
  }

  const hasActiveFilters = searchTerm !== '' || listingType !== 'all' || priceRange !== 'all' || 
                           bedrooms !== 'any' || bathrooms !== 'any' || selectedLocation !== 'all'

  const handleRefresh = () => {
    fetchRealProperties()
  }

  if (loading && fetchStatus === 'loading') {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <Loader className="w-8 h-8 animate-spin text-blue-600 mb-3" />
        <p className="text-gray-500 text-sm">Loading properties...</p>
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          {/* <div>
            <h1 className="text-2xl font-bold text-gray-900">Browse Properties</h1>
            <p className="text-gray-500 text-sm">Find your dream home from thousands of listings</p>
          </div> */}
          
          {/* Data Source Indicator */}
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${
              usingRealData 
                ? 'bg-green-100 text-green-700' 
                : fetchStatus === 'error'
                ? 'bg-red-100 text-red-700'
                : 'bg-gray-100 text-gray-600'
            }`}>
              {usingRealData ? (
                <>✅ Live ({realPropertyCount})</>
              ) : fetchStatus === 'error' ? (
                <>⚠️ Demo Mode</>
              ) : (
                <>📱 Demo</>
              )}
            </span>
            <button
              onClick={handleRefresh}
              disabled={fetchStatus === 'loading'}
              className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 transition disabled:opacity-50"
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 ${fetchStatus === 'loading' ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Search Bar with Filter Toggle */}
      <div className="mb-6">
        <div className="flex gap-2">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search by location, property name, or keyword..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-sm border rounded-xl focus:ring-2 focus:ring-blue-500 bg-white shadow-sm"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`px-4 py-2.5 rounded-xl transition flex items-center gap-2 text-sm ${
              showFilters 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Filter className="w-4 h-4" />
            Filters
          </button>
          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              className="px-4 py-2.5 rounded-xl transition flex items-center gap-2 text-sm bg-red-50 text-red-600 hover:bg-red-100"
            >
              <FilterX className="w-4 h-4" />
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className="bg-white rounded-xl shadow-sm border p-5 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Property Type</label>
              <select
                value={listingType}
                onChange={(e) => setListingType(e.target.value)}
                className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
              >
                <option value="all">All Properties</option>
                <option value="sale">For Sale</option>
                <option value="rent">For Rent</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Price Range</label>
              <select
                value={priceRange}
                onChange={(e) => setPriceRange(e.target.value)}
                className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
              >
                {getPriceOptions().map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Bedrooms</label>
              <select
                value={bedrooms}
                onChange={(e) => setBedrooms(e.target.value)}
                className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
              >
                <option value="any">Any</option>
                <option value="1">1+</option>
                <option value="2">2+</option>
                <option value="3">3+</option>
                <option value="4">4+</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Bathrooms</label>
              <select
                value={bathrooms}
                onChange={(e) => setBathrooms(e.target.value)}
                className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
              >
                <option value="any">Any</option>
                <option value="1">1+</option>
                <option value="2">2+</option>
                <option value="3">3+</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
              <select
                value={selectedLocation}
                onChange={(e) => setSelectedLocation(e.target.value)}
                className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
              >
                <option value="all">All Locations</option>
                {locations.map(loc => (
                  <option key={loc} value={loc}>{loc}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t flex justify-between items-center">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
              >
                <option value="latest">Latest</option>
                <option value="price_low">Price: Low to High</option>
                <option value="price_high">Price: High to Low</option>
              </select>
            </div>
            <p className="text-sm text-gray-500">{filteredProperties.length} properties found</p>
          </div>
        </div>
      )}

      {/* View Controls */}
      <div className="flex justify-between items-center mb-4">
        <p className="text-sm text-gray-500">{filteredProperties.length} properties found</p>
        <div className="flex gap-2">
          <button onClick={() => setViewMode('grid')} className={`p-2 rounded-lg transition ${viewMode === 'grid' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'}`}>
            <Grid3X3 className="w-4 h-4" />
          </button>
          <button onClick={() => setViewMode('list')} className={`p-2 rounded-lg transition ${viewMode === 'list' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'}`}>
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Properties Grid/List */}
      {filteredProperties.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border p-12 text-center">
          <Home className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No properties found</p>
          {hasActiveFilters && (
            <button onClick={resetFilters} className="mt-3 text-blue-600 text-sm hover:underline">Clear all filters</button>
          )}
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredProperties.map((property) => {
            const hasError = imageErrors[property.id]
            const imageUrl = property.image || getPropertyImage(property.id)
            
            return (
              <div
                key={property.id}
                onClick={() => navigate(`/properties/${property.id}`)}
                className="bg-white rounded-xl shadow-sm border overflow-hidden hover:shadow-lg transition-all cursor-pointer group"
              >
                <div className="relative h-44 w-full bg-gray-200">
                  {!hasError && imageUrl ? (
                    <img 
                      src={imageUrl} 
                      alt={property.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                      onError={() => handleImageError(property.id)}
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                      <ImageOff className="w-8 h-8 mb-1" />
                      <p className="text-xs">No Image</p>
                    </div>
                  )}
                  <div className={`absolute top-3 right-3 px-2 py-1 rounded-lg text-xs font-semibold text-white ${
                    property.listing_type === 'sale' ? 'bg-green-600' : 'bg-blue-600'
                  }`}>
                    {property.listing_type === 'sale' ? 'For Sale' : 'For Rent'}
                  </div>
                  {property.featured && (
                    <div className="absolute top-3 left-3 px-2 py-1 rounded-lg text-xs font-semibold bg-yellow-500 text-white flex items-center gap-1">
                      <Star className="w-3 h-3" /> Featured
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition line-clamp-1">
                    {property.title}
                  </h3>
                  <div className="flex items-center gap-1 text-gray-500 text-sm mt-1">
                    <MapPin className="w-3 h-3" /> {property.city || 'Addis Ababa'}
                  </div>
                  <div className="flex gap-3 mt-2 text-sm text-gray-500">
                    <span className="flex items-center gap-1"><Bed className="w-3 h-3" /> {property.bedrooms || 0}</span>
                    <span className="flex items-center gap-1"><Bath className="w-3 h-3" /> {property.bathrooms || 0}</span>
                    <span className="flex items-center gap-1"><Square className="w-3 h-3" /> {property.sqft || 0} sqft</span>
                  </div>
                  <p className="text-lg font-bold text-blue-600 mt-2">{formatPrice(property.price, property.listing_type)}</p>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleSaveProperty(property) }}
                    className={`mt-3 w-full py-2 rounded-lg text-sm font-medium transition ${
                      savedProperties.some(p => p.id === property.id)
                        ? 'bg-gray-100 text-gray-600'
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                  >
                    {savedProperties.some(p => p.id === property.id) ? '✓ Saved' : '❤️ Save Property'}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredProperties.map((property) => {
            const hasError = imageErrors[property.id]
            const imageUrl = property.image || getPropertyImage(property.id)
            
            return (
              <div
                key={property.id}
                onClick={() => navigate(`/properties/${property.id}`)}
                className="bg-white rounded-xl shadow-sm border overflow-hidden hover:shadow-md transition cursor-pointer flex group"
              >
                <div className="w-28 h-28 flex-shrink-0 bg-gray-200">
                  {!hasError && imageUrl ? (
                    <img 
                      src={imageUrl} 
                      alt={property.title}
                      className="w-full h-full object-cover"
                      onError={() => handleImageError(property.id)}
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                      <ImageOff className="w-5 h-5" />
                    </div>
                  )}
                </div>
                <div className="flex-1 p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition">{property.title}</h3>
                      <div className="flex items-center gap-1 text-gray-500 text-sm mt-1">
                        <MapPin className="w-3 h-3" /> {property.city || 'Addis Ababa'}
                      </div>
                      <div className="flex gap-3 mt-2 text-sm text-gray-500">
                        <span><Bed className="w-3 h-3 inline mr-1" /> {property.bedrooms || 0} beds</span>
                        <span><Bath className="w-3 h-3 inline mr-1" /> {property.bathrooms || 0} baths</span>
                        <span><Square className="w-3 h-3 inline mr-1" /> {property.sqft || 0} sqft</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-blue-600">{formatPrice(property.price, property.listing_type)}</p>
                      <span className={`inline-block mt-1 px-2 py-1 rounded-lg text-xs font-semibold ${
                        property.listing_type === 'sale' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                      }`}>
                        {property.listing_type === 'sale' ? 'Sale' : 'Rent'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default BuyerProperties