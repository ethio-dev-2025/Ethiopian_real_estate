import React, { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import Header from '../../components/layout/Header'
import { 
  Building2, Home, Search, MapPin, Heart, 
  Phone, Mail, ChevronDown, Star, CheckCircle, ArrowRight, 
  Clock, DollarSign, Briefcase, Filter,
  Bed, Bath, Square, X, Eye, Zap,
  Grid3x3, List, FilterX, ChevronRight, Loader
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'

const API_URL = 'http://localhost:8000'

const PropertiesPage = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const [properties, setProperties] = useState([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [hasMore, setHasMore] = useState(false)
  const [viewMode, setViewMode] = useState('grid')
  const [showFilters, setShowFilters] = useState(false)
  const [showGridTooltip, setShowGridTooltip] = useState(false)
  const [showListTooltip, setShowListTooltip] = useState(false)
  const [offset, setOffset] = useState(0)
  const limit = 12
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState(location.state?.searchTerm || '')
  const [listingType, setListingType] = useState(location.state?.listingType || 'all')
  const [propertyType, setPropertyType] = useState('all')
  const [minPrice, setMinPrice] = useState('')
  const [maxPrice, setMaxPrice] = useState('')
  const [bedrooms, setBedrooms] = useState('any')
  const [bathrooms, setBathrooms] = useState('any')
  const [city, setCity] = useState('')
  const [sortBy, setSortBy] = useState('latest')
  const [locations, setLocations] = useState([])

  useEffect(() => {
    fetchProperties(true)
  }, [listingType, sortBy])

  const fetchProperties = async (reset = true) => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (searchTerm) params.append('search', searchTerm)
      if (listingType !== 'all') params.append('listing_type', listingType)
      if (propertyType !== 'all') params.append('property_type', propertyType)
      if (minPrice) params.append('min_price', minPrice)
      if (maxPrice) params.append('max_price', maxPrice)
      if (bedrooms !== 'any') params.append('bedrooms', bedrooms)
      if (bathrooms !== 'any') params.append('bathrooms', bathrooms)
      if (city) params.append('city', city)
      params.append('sort_by', sortBy)
      params.append('limit', limit)
      params.append('offset', reset ? 0 : offset)
      
      const response = await fetch(`${API_URL}/api/buyer/properties?${params}`)
      const data = await response.json()
      
      if (reset) {
        setProperties(data.properties || [])
        setOffset(limit)
      } else {
        setProperties(prev => [...prev, ...(data.properties || [])])
        setOffset(prev => prev + limit)
      }
      
      setTotal(data.total || 0)
      setHasMore(data.has_more || false)
      
      // Extract unique locations for filter
      const uniqueLocations = [...new Set((data.properties || []).map(p => p.city))].filter(Boolean)
      setLocations(uniqueLocations)
      
    } catch (error) {
      console.error('Error fetching properties:', error)
      toast.error('Failed to load properties')
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = () => {
    setOffset(0)
    fetchProperties(true)
  }

  const handleLoadMore = () => {
    if (!loading && hasMore) {
      fetchProperties(false)
    }
  }

  const resetFilters = () => {
    setSearchTerm('')
    setListingType('all')
    setPropertyType('all')
    setMinPrice('')
    setMaxPrice('')
    setBedrooms('any')
    setBathrooms('any')
    setCity('')
    setSortBy('latest')
    setOffset(0)
    fetchProperties(true)
    setShowFilters(false)
    toast.success('All filters reset')
  }

  const formatPrice = (price, type) => {
    if (type === 'rent') {
      return `ETB ${price.toLocaleString()}/month`
    }
    if (price >= 10000000) return `ETB ${(price / 10000000).toFixed(1)}Cr`
    if (price >= 1000000) return `ETB ${(price / 1000000).toFixed(1)}M`
    return `ETB ${price.toLocaleString()}`
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
      { value: '15m-30m', label: 'ETB 15M - 30M' },
      { value: 'above-30m', label: 'Above ETB 30M' }
    ]
  }

  if (loading && properties.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex justify-center items-center h-96">
          <Loader className="w-12 h-12 animate-spin text-blue-600" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100">
      <Header />

      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 pt-24 pb-12">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl md:text-4xl font-bold text-white text-center mb-4">
            Find Your Dream Property
          </h1>
          <p className="text-blue-100 text-center mb-8">
            Discover thousands of properties for sale and rent in Ethiopia
          </p>
          
          {/* Search Bar */}
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-2xl shadow-lg p-2 flex flex-col md:flex-row gap-2">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search by city, property type, or keyword..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  className="w-full pl-12 pr-4 py-3 rounded-xl text-gray-900 focus:outline-none"
                />
              </div>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="px-6 py-3 bg-gray-100 rounded-xl hover:bg-gray-200 transition flex items-center gap-2"
              >
                <Filter className="w-5 h-5" />
                Filters
                {showFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
              <button
                onClick={handleSearch}
                className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg transition"
              >
                Search
              </button>
            </div>
            
            {/* Filters Panel */}
            <AnimatePresence>
              {showFilters && (
                <motion.div
                  initial={{ opacity: 0, height: 0, y: -20 }}
                  animate={{ opacity: 1, height: 'auto', y: 0 }}
                  exit={{ opacity: 0, height: 0, y: -20 }}
                  className="bg-white rounded-2xl shadow-lg mt-3 p-5"
                >
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-semibold">Filter Properties</h3>
                    <button onClick={resetFilters} className="text-sm text-red-600 hover:text-red-700">Reset All</button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Listing Type</label>
                      <select
                        value={listingType}
                        onChange={(e) => setListingType(e.target.value)}
                        className="w-full p-2 border rounded-lg"
                      >
                        <option value="all">All</option>
                        <option value="sale">For Sale</option>
                        <option value="rent">For Rent</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Property Type</label>
                      <select
                        value={propertyType}
                        onChange={(e) => setPropertyType(e.target.value)}
                        className="w-full p-2 border rounded-lg"
                      >
                        <option value="all">All</option>
                        <option value="house">House</option>
                        <option value="apartment">Apartment</option>
                        <option value="villa">Villa</option>
                        <option value="commercial">Commercial</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                      <select
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        className="w-full p-2 border rounded-lg"
                      >
                        <option value="">All Cities</option>
                        {locations.map(loc => (
                          <option key={loc} value={loc}>{loc}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Min Price (ETB)</label>
                      <input
                        type="number"
                        value={minPrice}
                        onChange={(e) => setMinPrice(e.target.value)}
                        placeholder="Min"
                        className="w-full p-2 border rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Max Price (ETB)</label>
                      <input
                        type="number"
                        value={maxPrice}
                        onChange={(e) => setMaxPrice(e.target.value)}
                        placeholder="Max"
                        className="w-full p-2 border rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Sort By</label>
                      <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="w-full p-2 border rounded-lg"
                      >
                        <option value="latest">Latest</option>
                        <option value="price_low">Price: Low to High</option>
                        <option value="price_high">Price: High to Low</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Bedrooms</label>
                      <select
                        value={bedrooms}
                        onChange={(e) => setBedrooms(e.target.value)}
                        className="w-full p-2 border rounded-lg"
                      >
                        <option value="any">Any</option>
                        <option value="1">1+</option>
                        <option value="2">2+</option>
                        <option value="3">3+</option>
                        <option value="4">4+</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Bathrooms</label>
                      <select
                        value={bathrooms}
                        onChange={(e) => setBathrooms(e.target.value)}
                        className="w-full p-2 border rounded-lg"
                      >
                        <option value="any">Any</option>
                        <option value="1">1+</option>
                        <option value="2">2+</option>
                        <option value="3">3+</option>
                      </select>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
      
      {/* Results Section */}
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <p className="text-gray-600">
            Found <span className="font-semibold text-blue-600">{total}</span> properties
          </p>
          <div className="flex gap-2">
            <div className="relative">
              <button
                onMouseEnter={() => setShowGridTooltip(true)}
                onMouseLeave={() => setShowGridTooltip(false)}
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg transition ${viewMode === 'grid' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600'}`}
              >
                <Grid3x3 className="w-5 h-5" />
              </button>
              {showGridTooltip && (
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap z-50">
                  Grid View
                </div>
              )}
            </div>
            <div className="relative">
              <button
                onMouseEnter={() => setShowListTooltip(true)}
                onMouseLeave={() => setShowListTooltip(false)}
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg transition ${viewMode === 'list' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600'}`}
              >
                <List className="w-5 h-5" />
              </button>
              {showListTooltip && (
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap z-50">
                  List View
                </div>
              )}
            </div>
          </div>
        </div>
        
        {properties.length === 0 && !loading ? (
          <div className="text-center py-12 bg-white rounded-2xl shadow-sm">
            <Home className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">No properties found</p>
            <button onClick={resetFilters} className="mt-4 text-blue-600 hover:underline">Clear filters</button>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {properties.map((property) => (
              <div
                key={property.id}
                onClick={() => navigate(`/properties/${property.id}`)}
                className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition cursor-pointer group"
              >
                <div className="relative h-56 overflow-hidden">
                  <img
                    src={property.images?.[0] || 'https://via.placeholder.com/400x300?text=No+Image'}
                    alt={property.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition duration-500"
                    onError={(e) => { e.target.src = 'https://via.placeholder.com/400x300?text=Property+Image' }}
                  />
                  <div className="absolute top-4 right-4 px-3 py-1 rounded-full text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-purple-600">
                    {property.listing_type === 'sale' ? 'For Sale' : 'For Rent'}
                  </div>
                  {property.featured && (
                    <div className="absolute top-4 left-4 px-2 py-1 rounded-full text-xs font-semibold bg-yellow-500 text-white flex items-center gap-1">
                      <Star className="w-3 h-3" /> Featured
                    </div>
                  )}
                </div>
                <div className="p-5">
                  <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-1">{property.title}</h3>
                  <div className="flex items-center gap-1 text-gray-500 mb-3">
                    <MapPin className="w-4 h-4" />
                    <span className="text-sm">{property.city}, {property.region || 'Ethiopia'}</span>
                  </div>
                  <div className="flex items-center gap-4 mb-4 text-sm text-gray-500">
                    <div className="flex items-center gap-1"><Bed className="w-4 h-4" /> {property.bedrooms} beds</div>
                    <div className="flex items-center gap-1"><Bath className="w-4 h-4" /> {property.bathrooms} baths</div>
                    <div className="flex items-center gap-1"><Square className="w-4 h-4" /> {property.sqft} sqft</div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xl font-bold text-blue-600">
                      {formatPrice(property.price, property.listing_type)}
                    </span>
                    <button className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:shadow-lg transition flex items-center gap-2">
                      View Details <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {properties.map((property) => (
              <div
                key={property.id}
                onClick={() => navigate(`/properties/${property.id}`)}
                className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition cursor-pointer flex"
              >
                <div className="w-48 h-48 overflow-hidden flex-shrink-0">
                  <img
                    src={property.images?.[0] || 'https://via.placeholder.com/200x200?text=No+Image'}
                    alt={property.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 p-5">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${property.listing_type === 'sale' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>
                          {property.listing_type === 'sale' ? 'For Sale' : 'For Rent'}
                        </span>
                        {property.featured && (
                          <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs flex items-center gap-1">
                            <Star className="w-3 h-3" /> Featured
                          </span>
                        )}
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 mb-1">{property.title}</h3>
                      <div className="flex items-center gap-1 text-gray-500 mb-2">
                        <MapPin className="w-4 h-4" />
                        <span className="text-sm">{property.city}</span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <div className="flex items-center gap-1"><Bed className="w-4 h-4" /> {property.bedrooms} beds</div>
                        <div className="flex items-center gap-1"><Bath className="w-4 h-4" /> {property.bathrooms} baths</div>
                        <div className="flex items-center gap-1"><Square className="w-4 h-4" /> {property.sqft} sqft</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-blue-600">{formatPrice(property.price, property.listing_type)}</p>
                      <button className="mt-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:shadow-lg transition flex items-center gap-2">
                        View Details <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {hasMore && (
          <div className="text-center mt-8">
            <button
              onClick={handleLoadMore}
              disabled={loading}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg transition disabled:opacity-50"
            >
              {loading ? 'Loading...' : 'Load More'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default PropertiesPage