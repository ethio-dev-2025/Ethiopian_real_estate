// src/pages/public/PropertiesListPage.jsx - WITH HOMEPAGE STYLE BUTTONS
import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Header from '../../components/layout/Header'
import { listingsAPI } from '../../services/api/listingsApi'
import { 
  Home, MapPin, Bed, Bath, Square, Filter,
  Grid3x3, List, FilterX, ChevronLeft, ChevronRight, ImageOff,
  Star, RefreshCw, ArrowRight
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'

const API_URL = 'http://localhost:8000'

// Custom Select Component
const CustomSelect = ({ value, onChange, options, placeholder }) => {
  const [isOpen, setIsOpen] = useState(false)
  const selectRef = React.useRef(null)

  React.useEffect(() => {
    const handleClickOutside = (event) => {
      if (selectRef.current && !selectRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const selectedOption = options.find(opt => opt.value === value)

  return (
    <div className="relative" ref={selectRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-2 text-left bg-white border border-gray-300 rounded-lg flex justify-between items-center focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
      >
        <span className={selectedOption ? 'text-gray-900' : 'text-gray-500'}>
          {selectedOption ? selectedOption.label : placeholder || 'Select option'}
        </span>
        <svg className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
          {options.map((option) => (
            <button
              key={option.value}
              onClick={() => {
                onChange(option.value)
                setIsOpen(false)
              }}
              className={`w-full px-4 py-2 text-left hover:bg-gray-50 transition text-sm ${
                value === option.value ? 'bg-blue-50 text-blue-600' : 'text-gray-700'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

const PropertiesListPage = () => {
  const navigate = useNavigate()
  const [allProperties, setAllProperties] = useState([])
  const [filteredProperties, setFilteredProperties] = useState([])
  const [displayedProperties, setDisplayedProperties] = useState([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState('grid')
  const [searchTerm, setSearchTerm] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [priceRange, setPriceRange] = useState('all')
  const [bedrooms, setBedrooms] = useState('any')
  const [bathrooms, setBathrooms] = useState('any')
  const [sortBy, setSortBy] = useState('latest')
  const [activeTab, setActiveTab] = useState('all')
  const [locations, setLocations] = useState([])
  const [selectedLocation, setSelectedLocation] = useState('all')
  const [imageErrors, setImageErrors] = useState({})
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const propertiesPerPage = 6

  // Format API property
  const formatApiProperty = (apiProp) => {
    let imageUrl = null
    if (apiProp.images && apiProp.images.length > 0) {
      const img = apiProp.images[0]
      if (img && img.startsWith('http')) {
        imageUrl = img
      } else if (img && img.startsWith('/uploads')) {
        imageUrl = `${API_URL}${img}`
      } else if (img) {
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
      imageUrl = apiProp.listing_type === 'sale' 
        ? 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=600&h=400&fit=crop'
        : 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=600&h=400&fit=crop'
    }
    
    return {
      id: apiProp.id,
      title: apiProp.title || 'Property',
      location: apiProp.city || apiProp.sub_city || apiProp.address || 'Addis Ababa',
      price: apiProp.price || 0,
      type: apiProp.listing_type || 'sale',
      image: imageUrl,
      beds: apiProp.bedrooms || 0,
      baths: apiProp.bathrooms || 0,
      sqft: apiProp.sqft || 0,
      featured: apiProp.featured || false,
      created_at: apiProp.created_at || new Date().toISOString(),
      listing_status: apiProp.listing_status || 'available'
    }
  }

  // Fetch real properties
  const fetchRealProperties = async () => {
    setLoading(true)
    try {
      const response = await listingsAPI.getPublicListingsFast({ limit: 100 })
      
      let listings = []
      if (response && response.success && Array.isArray(response.listings) && response.listings.length > 0) {
        listings = response.listings
      }

      if (listings.length > 0) {
        const formattedProperties = listings.map(formatApiProperty)
        setAllProperties(formattedProperties)
        
        // Extract unique locations
        const uniqueLocations = [...new Set(formattedProperties.map(p => p.location))].filter(Boolean)
        setLocations(uniqueLocations)
      } else {
        setAllProperties([])
      }
    } catch (error) {
      console.error('Error fetching properties:', error)
      toast.error('Failed to load properties')
      setAllProperties([])
    } finally {
      setLoading(false)
    }
  }

  // Apply filters
  useEffect(() => {
    let filtered = [...allProperties]

    if (activeTab !== 'all') {
      filtered = filtered.filter(prop => prop.type === activeTab)
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(prop =>
        prop.title.toLowerCase().includes(term) ||
        prop.location.toLowerCase().includes(term)
      )
    }

    if (priceRange !== 'all') {
      if (activeTab === 'rent') {
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

    if (bedrooms !== 'any') {
      filtered = filtered.filter(prop => prop.beds >= parseInt(bedrooms))
    }

    if (bathrooms !== 'any') {
      filtered = filtered.filter(prop => prop.baths >= parseInt(bathrooms))
    }

    if (selectedLocation !== 'all') {
      filtered = filtered.filter(prop => prop.location === selectedLocation)
    }

    if (sortBy === 'price_low') {
      filtered.sort((a, b) => a.price - b.price)
    } else if (sortBy === 'price_high') {
      filtered.sort((a, b) => b.price - a.price)
    } else if (sortBy === 'latest') {
      filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    }

    setFilteredProperties(filtered)
    setCurrentPage(1)
  }, [allProperties, activeTab, searchTerm, priceRange, bedrooms, bathrooms, sortBy, selectedLocation])

  // Update displayed properties when page changes
  useEffect(() => {
    const startIndex = (currentPage - 1) * propertiesPerPage
    const endIndex = startIndex + propertiesPerPage
    setDisplayedProperties(filteredProperties.slice(startIndex, endIndex))
  }, [filteredProperties, currentPage])

  const handleImageError = (propertyId) => {
    setImageErrors(prev => ({ ...prev, [propertyId]: true }))
  }

  const resetFilters = () => {
    setSearchTerm('')
    setActiveTab('all')
    setPriceRange('all')
    setBedrooms('any')
    setBathrooms('any')
    setSortBy('latest')
    setSelectedLocation('all')
    setShowFilters(false)
    toast.success('All filters reset')
  }

  const handleViewDetails = (propertyId) => {
    navigate(`/properties/${propertyId}`)
  }

  const formatPrice = (price, type) => {
    if (!price) return 'ETB 0'
    if (type === 'rent') {
      if (price >= 1000000) {
        return `ETB ${(price / 1000000).toFixed(1)}M/mo`
      }
      return `ETB ${price.toLocaleString()}/mo`
    }
    if (price >= 10000000) {
      return `ETB ${(price / 10000000).toFixed(1)}Cr`
    }
    if (price >= 1000000) {
      return `ETB ${(price / 1000000).toFixed(1)}M`
    }
    return `ETB ${price.toLocaleString()}`
  }

  const getPriceOptions = () => {
    if (activeTab === 'rent') {
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

  const tabs = [
    { id: 'all', label: 'All Properties', count: allProperties.length },
    { id: 'sale', label: 'For Sale', count: allProperties.filter(p => p.type === 'sale').length },
    { id: 'rent', label: 'For Rent', count: allProperties.filter(p => p.type === 'rent').length }
  ]

  // Diagonal badge component for sold/rented
  const DiagonalBadge = ({ status }) => {
    const isSold = status === 'sold'
    const isRented = status === 'rented'
    
    if (!isSold && !isRented) return null
    
    return (
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
        <div className={`transform -rotate-45 px-8 py-2 text-white font-bold text-lg uppercase tracking-wider shadow-lg ${
          isSold ? 'bg-red-600' : 'bg-purple-600'
        }`}>
          {isSold ? 'SOLD' : 'RENTED'}
        </div>
      </div>
    )
  }

  // Fetch data on mount
  useEffect(() => {
    fetchRealProperties()
  }, [])

  // Pagination calculations
  const totalPages = Math.ceil(filteredProperties.length / propertiesPerPage)
  
  const generatePaginationNumbers = () => {
    const pages = []
    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || (i >= currentPage - 1 && i <= currentPage + 1)) {
        pages.push(i)
      } else if (pages[pages.length - 1] !== '...') {
        pages.push('...')
      }
    }
    return pages
  }

  const goToPage = (page) => {
    if (page < 1 || page > totalPages) return
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleRefresh = () => {
    fetchRealProperties()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex justify-center items-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100">
      <Header />

      {/* Hero Section */}
      <section className="relative pt-20 pb-8 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative z-10 container mx-auto px-4 text-center text-white">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">
            Browse All Properties
          </h1>
          <p className="text-sm text-blue-100 mb-4">
            {filteredProperties.length} properties available
          </p>
          
          <div className="mb-2 flex justify-center items-center gap-2 flex-wrap">
            <button
              onClick={handleRefresh}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-white/20 hover:bg-white/30 transition"
            >
              <RefreshCw className="w-3 h-3" />
              Refresh
            </button>
          </div>
          
          <div className="bg-white rounded-2xl shadow-2xl p-2 max-w-3xl mx-auto">
            <div className="flex flex-col md:flex-row gap-2">
              <div className="flex-1 relative">
                <input 
                  type="text" 
                  placeholder="Search by location, property name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 border border-gray-200"
                />
              </div>
              <button 
                onClick={() => setShowFilters(!showFilters)}
                className={`px-5 py-3 rounded-xl transition flex items-center gap-2 text-sm ${
                  showFilters 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Filter className="w-4 h-4" />
                Filters
              </button>
              <button 
                onClick={resetFilters}
                className="px-5 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition flex items-center gap-2 text-sm"
              >
                <FilterX className="w-4 h-4" />
                Reset
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Properties Section */}
      <section className="py-8 px-4">
        <div className="container mx-auto">
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0, y: -20 }}
                animate={{ opacity: 1, height: 'auto', y: 0 }}
                exit={{ opacity: 0, height: 0, y: -20 }}
                transition={{ duration: 0.2 }}
                className="bg-white rounded-2xl shadow-lg p-5 mb-6"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Sort By</label>
                    <CustomSelect
                      value={sortBy}
                      onChange={setSortBy}
                      options={[
                        { value: 'latest', label: 'Latest' },
                        { value: 'price_low', label: 'Price: Low to High' },
                        { value: 'price_high', label: 'Price: High to Low' }
                      ]}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Price Range</label>
                    <CustomSelect
                      value={priceRange}
                      onChange={setPriceRange}
                      options={getPriceOptions()}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Bedrooms</label>
                    <CustomSelect
                      value={bedrooms}
                      onChange={setBedrooms}
                      options={[
                        { value: 'any', label: 'Any' },
                        { value: '1', label: '1+' },
                        { value: '2', label: '2+' },
                        { value: '3', label: '3+' },
                        { value: '4', label: '4+' }
                      ]}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Bathrooms</label>
                    <CustomSelect
                      value={bathrooms}
                      onChange={setBathrooms}
                      options={[
                        { value: 'any', label: 'Any' },
                        { value: '1', label: '1+' },
                        { value: '2', label: '2+' },
                        { value: '3', label: '3+' }
                      ]}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Location</label>
                    <CustomSelect
                      value={selectedLocation}
                      onChange={setSelectedLocation}
                      options={[{ value: 'all', label: 'All Locations' }, ...locations.map(l => ({ value: l, label: l }))]}
                    />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Tab Filters */}
          <div className="flex flex-wrap gap-2 mb-6">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-1.5 rounded-full text-sm font-semibold transition ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md'
                    : 'bg-white text-gray-600 hover:text-gray-900 shadow-sm'
                }`}
              >
                {tab.label} ({tab.count})
              </button>
            ))}
          </div>

          {/* View Mode Toggle */}
          <div className="flex justify-end items-center mb-4 gap-2">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition ${viewMode === 'grid' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 shadow'}`}
            >
              <Grid3x3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-lg transition ${viewMode === 'list' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 shadow'}`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>

          {displayedProperties.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl shadow-sm">
              <Home className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">No properties found</p>
              <button onClick={resetFilters} className="mt-4 text-blue-600 hover:underline">
                Clear filters
              </button>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-8">
              {displayedProperties.map((property) => {
                const hasError = imageErrors[property.id]
                const isSold = property.listing_status === 'sold'
                const isRented = property.listing_status === 'rented'
                
                return (
                  <div
                    key={property.id}
                    onClick={() => handleViewDetails(property.id)}
                    className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition cursor-pointer group flex flex-col"
                  >
                    <div className="relative h-[280px] bg-gray-200 overflow-hidden flex-shrink-0">
                      {!hasError ? (
                        <img 
                          src={property.image} 
                          alt={property.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                          loading="lazy"
                          onError={() => handleImageError(property.id)}
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                          <ImageOff className="w-8 h-8 mb-1" />
                          <p className="text-xs">No Image</p>
                        </div>
                      )}
                      
                      <DiagonalBadge status={property.listing_status} />
                      
                      <div className="absolute top-3 left-3 z-10">
                        <span className={`px-2 py-1 rounded-md text-xs font-semibold text-white shadow-md ${
                          property.type === 'sale' ? 'bg-green-600' : 'bg-blue-600'
                        }`}>
                          {property.type === 'sale' ? 'For Sale' : 'For Rent'}
                        </span>
                      </div>
                      
                      {property.featured && (
                        <div className="absolute bottom-3 left-3 z-10 bg-yellow-500 text-white px-2 py-1 rounded-md text-xs font-semibold flex items-center gap-1 shadow-md">
                          <Star className="w-3 h-3" /> Featured
                        </div>
                      )}
                    </div>
                    
                    <div className="p-2.5 flex flex-col gap-1 flex-shrink-0">
                      <h3 className="font-semibold text-gray-900 text-xs line-clamp-1">{property.title}</h3>
                      <div className="flex items-center gap-1 text-gray-500 text-[10px]">
                        <MapPin className="w-2.5 h-2.5 flex-shrink-0" />
                        <span className="truncate">{property.location}</span>
                      </div>
                      <div className="flex gap-2 text-[10px] text-gray-500">
                        <span className="flex items-center gap-0.5"><Bed className="w-2.5 h-2.5" /> {property.beds}</span>
                        <span className="flex items-center gap-0.5"><Bath className="w-2.5 h-2.5" /> {property.baths}</span>
                        <span className="flex items-center gap-0.5"><Square className="w-2.5 h-2.5" /> {property.sqft}</span>
                      </div>
                      <div className="flex justify-between items-center mt-0.5">
                        <span className={`text-sm font-bold ${isSold || isRented ? 'text-gray-500 line-through' : 'text-blue-600'}`}>
                          {formatPrice(property.price, property.type)}
                        </span>
                        {!isSold && !isRented && (
                          <button className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold text-sm hover:shadow-lg transition flex items-center justify-center gap-2">
                            View Details <ArrowRight className="w-4 h-4" />
                          </button>
                        )}
                        {(isSold || isRented) && (
                          <span className="text-[9px] text-gray-400 italic text-center block mt-1">Transaction Completed</span>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="space-y-3">
              {displayedProperties.map((property) => {
                const isSold = property.listing_status === 'sold'
                const isRented = property.listing_status === 'rented'
                
                return (
                  <div
                    key={property.id}
                    onClick={() => handleViewDetails(property.id)}
                    className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition cursor-pointer flex flex-row"
                  >
                    <div className="w-32 h-[100px] bg-gray-200 flex-shrink-0 relative">
                      <img 
                        src={property.image} 
                        alt={property.title}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                      {(isSold || isRented) && (
                        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                          <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold text-white ${isSold ? 'bg-red-600' : 'bg-purple-600'}`}>
                            {isSold ? 'SOLD' : 'RENTED'}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 p-2.5">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold text-gray-900 text-sm">{property.title}</h3>
                          <div className="flex items-center gap-1 text-gray-500 text-xs mt-0.5">
                            <MapPin className="w-3 h-3" />
                            <span>{property.location}</span>
                          </div>
                          <div className="flex gap-3 mt-1 text-xs text-gray-500">
                            <span><Bed className="w-3 h-3 inline mr-0.5" /> {property.beds}</span>
                            <span><Bath className="w-3 h-3 inline mr-0.5" /> {property.baths}</span>
                            <span><Square className="w-3 h-3 inline mr-0.5" /> {property.sqft}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`text-sm font-bold ${isSold || isRented ? 'text-gray-500 line-through' : 'text-blue-600'}`}>
                            {formatPrice(property.price, property.type)}
                          </p>
                          {!isSold && !isRented && (
                            <button className="mt-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold text-sm hover:shadow-lg transition flex items-center justify-center gap-2">
                              View Details <ArrowRight className="w-4 h-4" />
                            </button>
                          )}
                          {(isSold || isRented) && (
                            <p className="mt-2 text-[8px] text-gray-400 italic">Completed</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-10">
              <button
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 1}
                className="p-2 rounded-lg bg-white shadow-md text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              
              {generatePaginationNumbers().map((page, index) => (
                <button
                  key={index}
                  onClick={() => typeof page === 'number' && goToPage(page)}
                  className={`w-10 h-10 rounded-lg font-medium transition ${
                    currentPage === page
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md'
                      : 'bg-white text-gray-600 hover:bg-gray-100 shadow-sm'
                  } ${typeof page !== 'number' ? 'cursor-default' : ''}`}
                >
                  {page}
                </button>
              ))}
              
              <button
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg bg-white shadow-md text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          )}

          {/* Results count */}
          <div className="text-center mt-6 text-sm text-gray-500">
            Showing {((currentPage - 1) * propertiesPerPage) + 1} to {Math.min(currentPage * propertiesPerPage, filteredProperties.length)} of {filteredProperties.length} properties
          </div>
        </div>
      </section>
    </div>
  )
}

export default PropertiesListPage