// src/pages/public/PropertiesPage.jsx
import React, { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import Header from '../../components/layout/Header'
import PropertyMap from '../../components/maps/PropertyMap'
import { 
  Search, Filter, Grid3x3, List, Map, 
  Bed, Bath, Square, Star, ArrowRight, 
  MapPin, Home, X, ChevronDown, ChevronUp
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'

const API_URL = 'http://localhost:8000'

const PropertiesPage = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const [properties, setProperties] = useState([])
  const [loading, setLoading] = useState(true)
  const [initialLoad, setInitialLoad] = useState(true)
  const [viewMode, setViewMode] = useState('grid')
  const [showFilters, setShowFilters] = useState(false)
  const [selectedProperty, setSelectedProperty] = useState(null)
  const [total, setTotal] = useState(0)
  const [hasMore, setHasMore] = useState(false)
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState(location.state?.searchTerm || '')
  const [listingType, setListingType] = useState(location.state?.listingType || 'all')
  const [propertyType, setPropertyType] = useState('all')
  const [city, setCity] = useState('')
  const [sortBy, setSortBy] = useState('latest')
  
  // Pagination
  const [page, setPage] = useState(1)
  const [loadingMore, setLoadingMore] = useState(false)
  const observerRef = useRef()
  const limit = 12

  // Fast endpoint - use public-fast for better performance
  const fetchProperties = useCallback(async (reset = true, loadMore = false) => {
    if (reset) {
      setLoading(true)
      setProperties([])
      setPage(1)
    }
    
    if (loadMore) {
      setLoadingMore(true)
    }
    
    try {
      const currentPage = reset ? 1 : page
      const offset = (currentPage - 1) * limit
      
      // Use the FAST endpoint for better performance
      let url = `${API_URL}/api/listings/public-fast?limit=${limit}&offset=${offset}`
      
      if (listingType !== 'all') url += `&listing_type=${listingType}`
      
      console.log('Fetching from:', url)
      
      const response = await fetch(url)
      const data = await response.json()
      
      if (data.success !== false) {
        let listings = []
        let totalCount = 0
        let hasMoreData = false
        
        if (data.listings) {
          listings = data.listings
          totalCount = data.total || listings.length
          hasMoreData = data.has_more || false
        } else if (Array.isArray(data)) {
          listings = data
          totalCount = listings.length
          hasMoreData = false
        }
        
        // Apply frontend filters (since fast endpoint doesn't support all filters)
        let filteredListings = listings
        if (propertyType !== 'all') {
          filteredListings = filteredListings.filter(p => p.property_type === propertyType)
        }
        if (city) {
          filteredListings = filteredListings.filter(p => p.city === city)
        }
        if (searchTerm) {
          const term = searchTerm.toLowerCase()
          filteredListings = filteredListings.filter(p => 
            p.title?.toLowerCase().includes(term) || 
            p.city?.toLowerCase().includes(term) ||
            p.description?.toLowerCase().includes(term)
          )
        }
        
        // Sort
        if (sortBy === 'price_low') {
          filteredListings.sort((a, b) => a.price - b.price)
        } else if (sortBy === 'price_high') {
          filteredListings.sort((a, b) => b.price - a.price)
        }
        
        if (reset) {
          setProperties(filteredListings)
          setTotal(filteredListings.length)
          setHasMore(filteredListings.length >= limit && hasMoreData)
        } else {
          setProperties(prev => [...prev, ...filteredListings])
          setHasMore(filteredListings.length >= limit && hasMoreData)
        }
      }
    } catch (error) {
      console.error('Error fetching properties:', error)
      toast.error('Failed to load properties')
    } finally {
      setLoading(false)
      setInitialLoad(false)
      setLoadingMore(false)
    }
  }, [listingType, propertyType, city, searchTerm, sortBy, page, limit])

  // Initial load
  useEffect(() => {
    fetchProperties(true)
  }, [listingType, propertyType, city, searchTerm, sortBy])

  // Infinite scroll
  useEffect(() => {
    if (!hasMore || loadingMore || loading) return
    
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore && !loading) {
          setPage(prev => prev + 1)
        }
      },
      { threshold: 0.1, rootMargin: '100px' }
    )
    
    if (observerRef.current) {
      observer.observe(observerRef.current)
    }
    
    return () => observer.disconnect()
  }, [hasMore, loadingMore, loading])

  // Fetch more when page changes
  useEffect(() => {
    if (page > 1) {
      fetchProperties(false, true)
    }
  }, [page])

  const handleSearch = () => {
    setPage(1)
    fetchProperties(true)
    if (viewMode === 'map') setViewMode('grid')
  }

  const resetFilters = () => {
    setSearchTerm('')
    setListingType('all')
    setPropertyType('all')
    setCity('')
    setSortBy('latest')
    setPage(1)
    setShowFilters(false)
    fetchProperties(true)
    toast.success('All filters reset')
  }

  const formatPrice = (price, type) => {
    if (!price) return 'Price on request'
    if (type === 'rent') {
      return `ETB ${price.toLocaleString()}/month`
    }
    if (price >= 10000000) return `ETB ${(price / 10000000).toFixed(1)}Cr`
    if (price >= 1000000) return `ETB ${(price / 1000000).toFixed(1)}M`
    return `ETB ${price.toLocaleString()}`
  }

  const handlePropertyClick = (property) => {
    setSelectedProperty(property)
  }

  const closePropertyModal = () => {
    setSelectedProperty(null)
  }

  const cities = ['Addis Ababa', 'Dire Dawa', 'Mekelle', 'Gondar', 'Bahir Dar', 'Hawassa', 'Jimma']

  // Show skeleton loading only on initial load
  if (initialLoad && loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-8">
          {/* Hero Section Skeleton */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 mb-8 animate-pulse">
            <div className="h-8 bg-white/20 rounded w-64 mx-auto mb-4"></div>
            <div className="h-4 bg-white/20 rounded w-96 mx-auto"></div>
          </div>
          
          {/* Results Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-white rounded-2xl shadow-lg overflow-hidden animate-pulse">
                <div className="h-56 bg-gray-200"></div>
                <div className="p-5">
                  <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2 mb-3"></div>
                  <div className="h-4 bg-gray-200 rounded w-full mb-4"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/3"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100">
      <Header />

      {/* Hero Section - Simplified for faster render */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 pt-16 pb-8">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl font-bold text-white text-center mb-2">
            Find Your Dream Property
          </h1>
          <p className="text-blue-100 text-center mb-6">
            {total} properties available
          </p>
          
          {/* Search Bar */}
          <div className="max-w-3xl mx-auto">
            <div className="bg-white rounded-xl shadow-lg p-2 flex gap-2">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  className="w-full pl-9 pr-3 py-2 rounded-lg text-gray-900 focus:outline-none text-sm"
                />
              </div>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="px-3 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition text-sm flex items-center gap-1"
              >
                <Filter className="w-4 h-4" />
                Filter
              </button>
              <button
                onClick={handleSearch}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium"
              >
                Search
              </button>
            </div>
            
            {/* Quick Filters */}
            <div className="flex gap-2 mt-2 justify-center flex-wrap">
              <button
                onClick={() => setListingType('all')}
                className={`px-3 py-1 rounded-full text-xs transition ${listingType === 'all' ? 'bg-white text-blue-600' : 'bg-white/20 text-white hover:bg-white/30'}`}
              >
                All
              </button>
              <button
                onClick={() => setListingType('sale')}
                className={`px-3 py-1 rounded-full text-xs transition ${listingType === 'sale' ? 'bg-white text-blue-600' : 'bg-white/20 text-white hover:bg-white/30'}`}
              >
                For Sale
              </button>
              <button
                onClick={() => setListingType('rent')}
                className={`px-3 py-1 rounded-full text-xs transition ${listingType === 'rent' ? 'bg-white text-blue-600' : 'bg-white/20 text-white hover:bg-white/30'}`}
              >
                For Rent
              </button>
            </div>
            
            {/* Filters Panel */}
            <AnimatePresence>
              {showFilters && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-white rounded-xl shadow-lg mt-2 p-4"
                >
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="font-semibold text-sm">Filters</h3>
                    <button onClick={resetFilters} className="text-xs text-red-600">Reset</button>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <select
                      value={propertyType}
                      onChange={(e) => setPropertyType(e.target.value)}
                      className="w-full p-2 border rounded-lg text-sm"
                    >
                      <option value="all">Property Type</option>
                      <option value="house">House</option>
                      <option value="apartment">Apartment</option>
                      <option value="villa">Villa</option>
                      <option value="commercial">Commercial</option>
                    </select>
                    <select
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full p-2 border rounded-lg text-sm"
                    >
                      <option value="">All Cities</option>
                      {cities.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="w-full p-2 border rounded-lg text-sm"
                    >
                      <option value="latest">Latest</option>
                      <option value="price_low">Price: Low to High</option>
                      <option value="price_high">Price: High to Low</option>
                    </select>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
      
      {/* Results Section */}
      <div className="container mx-auto px-4 py-6">
        {/* View Mode Toggle */}
        <div className="flex justify-between items-center mb-4">
          <p className="text-sm text-gray-600">{total} properties found</p>
          <div className="flex gap-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition ${viewMode === 'grid' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 shadow-sm'}`}
            >
              <Grid3x3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-lg transition ${viewMode === 'list' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 shadow-sm'}`}
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('map')}
              className={`p-1.5 rounded-lg transition ${viewMode === 'map' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 shadow-sm'}`}
            >
              <Map className="w-4 h-4" />
            </button>
          </div>
        </div>
        
        {/* Map View */}
        {viewMode === 'map' && (
          <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-4">
            <PropertyMap
              properties={properties}
              onPropertyClick={handlePropertyClick}
              center={[9.03, 38.74]}
              zoom={12}
              height="450px"
            />
          </div>
        )}
        
        {/* Grid View */}
        {viewMode === 'grid' && properties.length > 0 && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {properties.map((property) => (
                <div
                  key={property.id}
                  onClick={() => navigate(`/properties/${property.id}`)}
                  className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition cursor-pointer group"
                >
                  <div className="relative h-40 overflow-hidden">
                    <img
                      src={property.images?.[0] || 'https://placehold.co/400x300/e2e8f0/64748b?text=No+Image'}
                      alt={property.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                      loading="lazy"
                    />
                    <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full text-xs font-semibold text-white bg-gradient-to-r from-blue-600 to-purple-600">
                      {property.listing_type === 'sale' ? 'Sale' : 'Rent'}
                    </div>
                  </div>
                  <div className="p-3">
                    <h3 className="font-semibold text-gray-900 text-sm mb-1 line-clamp-1">{property.title}</h3>
                    <div className="flex items-center gap-1 text-gray-500 text-xs mb-2">
                      <MapPin className="w-3 h-3" />
                      <span>{property.city || 'Addis Ababa'}</span>
                    </div>
                    <div className="flex items-center gap-3 mb-2 text-xs text-gray-500">
                      {property.bedrooms > 0 && <span>🛏️ {property.bedrooms}</span>}
                      {property.bathrooms > 0 && <span>🚿 {property.bathrooms}</span>}
                      {property.sqft > 0 && <span>📐 {property.sqft}</span>}
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-bold text-blue-600">
                        {formatPrice(property.price, property.listing_type)}
                      </span>
                      <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-blue-600 transition" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Infinite scroll trigger */}
            <div ref={observerRef} className="h-10 mt-4 flex justify-center">
              {loadingMore && (
                <div className="flex items-center gap-2 text-gray-500">
                  <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-sm">Loading more...</span>
                </div>
              )}
            </div>
          </>
        )}
        
        {/* List View */}
        {viewMode === 'list' && properties.length > 0 && (
          <>
            <div className="space-y-3">
              {properties.map((property) => (
                <div
                  key={property.id}
                  onClick={() => navigate(`/properties/${property.id}`)}
                  className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition cursor-pointer flex"
                >
                  <div className="w-24 h-24 flex-shrink-0">
                    <img
                      src={property.images?.[0] || 'https://placehold.co/100x100/e2e8f0/64748b?text=No+Image'}
                      alt={property.title}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </div>
                  <div className="flex-1 p-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold text-gray-900 text-sm">{property.title}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700">
                            {property.listing_type === 'sale' ? 'Sale' : 'Rent'}
                          </span>
                          <span className="text-xs text-gray-500">{property.city}</span>
                        </div>
                      </div>
                      <span className="text-sm font-bold text-blue-600">
                        {formatPrice(property.price, property.listing_type)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Infinite scroll trigger */}
            <div ref={observerRef} className="h-10 mt-4 flex justify-center">
              {loadingMore && (
                <div className="flex items-center gap-2 text-gray-500">
                  <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-sm">Loading more...</span>
                </div>
              )}
            </div>
          </>
        )}
        
        {properties.length === 0 && !loading && viewMode !== 'map' && (
          <div className="text-center py-12 bg-white rounded-xl shadow-sm">
            <Home className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No properties found</p>
            <button onClick={resetFilters} className="mt-3 text-sm text-blue-600 hover:underline">Clear filters</button>
          </div>
        )}
      </div>
      
      {/* Property Details Modal */}
      {selectedProperty && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={closePropertyModal}>
          <div className="bg-white rounded-xl max-w-md w-full max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="relative">
              <button
                onClick={closePropertyModal}
                className="absolute top-3 right-3 z-10 p-1.5 bg-white rounded-full shadow-md"
              >
                <X className="w-4 h-4" />
              </button>
              <img
                src={selectedProperty.images?.[0] || 'https://placehold.co/600x400/e2e8f0/64748b?text=Property'}
                alt={selectedProperty.title}
                className="w-full h-48 object-cover rounded-t-xl"
              />
              <div className="p-4">
                <h3 className="font-bold text-lg text-gray-900">{selectedProperty.title}</h3>
                <p className="text-2xl font-bold text-blue-600 my-2">
                  {formatPrice(selectedProperty.price, selectedProperty.listing_type)}
                </p>
                <div className="flex items-center gap-3 mb-3 text-sm text-gray-500">
                  {selectedProperty.bedrooms > 0 && <span>🛏️ {selectedProperty.bedrooms}</span>}
                  {selectedProperty.bathrooms > 0 && <span>🚿 {selectedProperty.bathrooms}</span>}
                  {selectedProperty.sqft > 0 && <span>📐 {selectedProperty.sqft} sqft</span>}
                </div>
                <button
                  onClick={() => {
                    closePropertyModal()
                    navigate(`/properties/${selectedProperty.id}`)
                  }}
                  className="w-full py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg text-sm font-semibold"
                >
                  View Details
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default PropertiesPage