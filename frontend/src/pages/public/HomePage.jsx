// src/pages/public/HomePage.jsx
import React, { useState, useEffect, useCallback, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Header from '../../components/layout/Header'
import { useLanguage } from '../../context/LanguageContext'
import { listingsAPI } from '../../services/api/listingsApi'
import { 
  Building2, Home, Search, MapPin, Heart, Shield, 
  Award, Phone, Mail, Star, ArrowRight, 
  Bed, Bath, Square, Filter,
  Grid3x3, List, FilterX, ChevronRight, AlertCircle, ImageOff,
  RefreshCw, Sparkles, ChevronDown
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'

const API_URL = 'http://localhost:8000'

// Simple Select Component that works reliably on mobile
const SimpleSelect = ({ value, onChange, options, label }) => {
  const [isOpen, setIsOpen] = useState(false)
  const selectRef = useRef(null)

  useEffect(() => {
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
      <label className="block text-xs font-medium text-gray-700 mb-1">{label}</label>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-3 py-2.5 text-left bg-white border border-gray-300 rounded-lg flex justify-between items-center focus:outline-none focus:ring-2 focus:ring-primary-600 min-h-[44px]"
      >
        <span className={selectedOption ? 'text-gray-900 text-sm' : 'text-gray-500 text-sm'}>
          {selectedOption ? selectedOption.label : 'Select'}
        </span>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                onChange(option.value)
                setIsOpen(false)
              }}
              className={`w-full px-3 py-2.5 text-left hover:bg-gray-50 transition text-sm ${
                value === option.value ? 'bg-primary-50 text-primary-700 font-medium' : 'text-gray-700'
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

const HomePage = () => {
  const navigate = useNavigate()
  const [allProperties, setAllProperties] = useState([])
  const [filteredProperties, setFilteredProperties] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeTab, setActiveTab] = useState('all')
  const [viewMode, setViewMode] = useState('grid')
  const [searchTerm, setSearchTerm] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [priceRange, setPriceRange] = useState('all')
  const [bedrooms, setBedrooms] = useState('any')
  const [bathrooms, setBathrooms] = useState('any')
  const [sortBy, setSortBy] = useState('latest')
  const [locations, setLocations] = useState([])
  const [selectedLocation, setSelectedLocation] = useState('all')
  const [imageErrors, setImageErrors] = useState({})
  const { t } = useLanguage()

  // Format API property
  const formatApiProperty = (apiProp) => {
    let imageUrl = null
    
    if (apiProp.cover_image) {
      let coverImg = apiProp.cover_image
      if (coverImg.startsWith('http')) {
        imageUrl = coverImg
      } else if (coverImg.startsWith('/uploads')) {
        imageUrl = `${API_URL}${coverImg}`
      } else {
        imageUrl = `${API_URL}/uploads/${coverImg}`
      }
    }
    
    if (!imageUrl && apiProp.images && apiProp.images.length > 0) {
      const img = apiProp.images[0]
      if (img) {
        if (img.startsWith('http')) {
          imageUrl = img
        } else if (img.startsWith('/uploads')) {
          imageUrl = `${API_URL}${img}`
        } else {
          imageUrl = `${API_URL}/uploads/${img}`
        }
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
      const response = await listingsAPI.getPublicListingsFast({ limit: 50 })
      
      let listings = []
      if (response && response.success && Array.isArray(response.listings) && response.listings.length > 0) {
        listings = response.listings
      }

      if (listings.length > 0) {
        const formattedProperties = listings.map(formatApiProperty)
        setAllProperties(formattedProperties)
        setError(null)
      } else {
        setAllProperties([])
      }
    } catch (error) {
      console.error('Error fetching properties:', error)
      setError('Unable to load properties')
      setAllProperties([])
    } finally {
      setLoading(false)
    }
  }

  // Extract locations
  useEffect(() => {
    const uniqueLocations = [...new Set(allProperties.map(p => p.location))].filter(Boolean)
    setLocations(uniqueLocations)
  }, [allProperties])

  // Apply filters
  useEffect(() => {
    let filtered = [...allProperties]

    if (activeTab !== 'all') {
      filtered = filtered.filter(prop => prop.type === activeTab)
    }

    if (searchTerm && searchTerm.trim() !== '') {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(prop =>
        prop.title.toLowerCase().includes(term) ||
        prop.location.toLowerCase().includes(term)
      )
    }

    if (priceRange !== 'all') {
      const currentType = activeTab === 'all' ? 'sale' : activeTab
      
      if (currentType === 'rent') {
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
      const minBeds = parseInt(bedrooms, 10)
      filtered = filtered.filter(prop => prop.beds >= minBeds)
    }

    if (bathrooms !== 'any') {
      const minBaths = parseInt(bathrooms, 10)
      filtered = filtered.filter(prop => prop.baths >= minBaths)
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
  }, [allProperties, activeTab, searchTerm, priceRange, bedrooms, bathrooms, selectedLocation, sortBy])

  // Fetch data on mount
  useEffect(() => {
    fetchRealProperties()
  }, [])

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

  const handleSeeMore = () => {
    navigate('/properties')
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
    const currentType = activeTab === 'all' ? 'sale' : activeTab
    
    if (currentType === 'rent') {
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

  const displayedProperties = filteredProperties.slice(0, 6)

  const DiagonalBadge = ({ status }) => {
    const isSold = status === 'sold'
    const isRented = status === 'rented'
    
    if (!isSold && !isRented) return null
    
    return (
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
        <div className={`transform -rotate-45 px-6 py-1 text-white font-bold text-sm uppercase tracking-wider shadow-lg ${
          isSold ? 'bg-error' : 'bg-purple-600'
        }`}>
          {isSold ? 'SOLD' : 'RENTED'}
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex justify-center items-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-700"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 overflow-x-hidden">
      <Header />

      {/* Hero Section */}
      <section className="relative pt-20 pb-8 bg-gradient-to-r from-primary-800 to-primary-900">
        <div className="container mx-auto px-4 text-center text-white">
          <h1 className="text-3xl md:text-5xl font-bold mb-3">
            Find Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-yellow-300">Dream Property</span>
          </h1>
          <p className="text-sm md:text-lg text-primary-100 mb-6 max-w-2xl mx-auto">
            Discover the best properties in Ethiopia. Buy, sell, or rent with confidence.
          </p>
          
          {/* ROW 1: Search Bar + Filter Button + Reset Button */}
          <div className="flex justify-center">
            <div className="flex items-center gap-3 bg-white rounded-xl shadow-2xl p-2 w-full max-w-3xl">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input 
                  type="text" 
                  placeholder="Search by location, property name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-600 text-sm"
                />
              </div>
              <button 
                onClick={() => setShowFilters(!showFilters)}
                className={`px-4 py-2 rounded-lg transition flex items-center gap-1.5 text-sm whitespace-nowrap ${
                  showFilters 
                    ? 'bg-primary-700 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Filter className="w-3.5 h-3.5" /> Filters
              </button>
              <button 
                onClick={resetFilters}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition flex items-center gap-1.5 text-sm whitespace-nowrap"
              >
                <FilterX className="w-3.5 h-3.5" /> Reset
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Properties Section */}
      <section className="py-8 px-4">
        <div className="container mx-auto">
          {/* Filters Panel */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0, y: -20 }}
                animate={{ opacity: 1, height: 'auto', y: 0 }}
                exit={{ opacity: 0, height: 0, y: -20 }}
                transition={{ duration: 0.2 }}
                className="bg-white rounded-xl shadow-lg p-4 mb-5"
              >
                <div className="space-y-4">
                  <div>
                    <SimpleSelect
                      value={sortBy}
                      onChange={setSortBy}
                      options={[
                        { value: 'latest', label: 'Latest' },
                        { value: 'price_low', label: 'Price: Low to High' },
                        { value: 'price_high', label: 'Price: High to Low' }
                      ]}
                      label="Sort By"
                    />
                  </div>
                  
                  <div>
                    <SimpleSelect
                      value={priceRange}
                      onChange={setPriceRange}
                      options={getPriceOptions()}
                      label="Price Range"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <SimpleSelect
                      value={bedrooms}
                      onChange={setBedrooms}
                      options={[
                        { value: 'any', label: 'Any' },
                        { value: '1', label: '1+' },
                        { value: '2', label: '2+' },
                        { value: '3', label: '3+' },
                        { value: '4', label: '4+' },
                        { value: '5', label: '5+' }
                      ]}
                      label="Bedrooms"
                    />
                    <SimpleSelect
                      value={bathrooms}
                      onChange={setBathrooms}
                      options={[
                        { value: 'any', label: 'Any' },
                        { value: '1', label: '1+' },
                        { value: '2', label: '2+' },
                        { value: '3', label: '3+' },
                        { value: '4', label: '4+' }
                      ]}
                      label="Bathrooms"
                    />
                  </div>
                  
                  <div>
                    <SimpleSelect
                      value={selectedLocation}
                      onChange={setSelectedLocation}
                      options={[
                        { value: 'all', label: 'All Locations' },
                        ...locations.map(l => ({ value: l, label: l }))
                      ]}
                      label="Location"
                    />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ROW 2: Tabs + View Mode Buttons */}
          <div className="flex items-start justify-between gap-2 mb-5">
            <div className="flex-1 overflow-x-auto overflow-y-visible no-scrollbar pb-1">
              <div className="flex gap-1.5 bg-white rounded-full p-1 shadow-sm w-max">
                {tabs.map((tab) => {
                  const isActive = activeTab === tab.id
                  return (
                    <button
                      key={tab.id}
                      onClick={() => {
                        setActiveTab(tab.id)
                        setPriceRange('all')
                      }}
                      className={`flex items-center gap-1.5 px-3 sm:px-4 py-1.5 rounded-full font-medium text-xs sm:text-sm transition whitespace-nowrap ${
                        isActive
                          ? 'bg-gradient-to-r from-primary-700 to-primary-800 text-white shadow-md'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      {tab.label}
                      <span className={`text-xs ${isActive ? 'text-white/80' : 'text-gray-400'}`}>
                        ({tab.count})
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>
            
            <div className="flex-shrink-0 flex gap-1.5 bg-white rounded-lg p-1 shadow-sm">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-md transition ${
                  viewMode === 'grid' 
                    ? 'bg-gradient-to-r from-primary-700 to-primary-800 text-white' 
                    : 'text-gray-500 hover:bg-gray-100'
                }`}
                title="Grid View"
              >
                <Grid3x3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-md transition ${
                  viewMode === 'list' 
                    ? 'bg-gradient-to-r from-primary-700 to-primary-800 text-white' 
                    : 'text-gray-500 hover:bg-gray-100'
                }`}
                title="List View"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>

          {displayedProperties.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl shadow-sm">
              <Home className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">No properties found</p>
              <button onClick={resetFilters} className="mt-4 text-primary-700 hover:underline text-sm">
                Clear filters
              </button>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
              {displayedProperties.map((property) => {
                const hasError = imageErrors[property.id]
                const isSold = property.listing_status === 'sold'
                const isRented = property.listing_status === 'rented'
                const isAvailable = !isSold && !isRented
                
                return (
                  <div
                    key={property.id}
                    onClick={() => isAvailable && handleViewDetails(property.id)}
                    className={`bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition cursor-pointer group ${!isAvailable ? 'opacity-90' : ''}`}
                  >
                    <div className="relative h-44 sm:h-48 overflow-hidden bg-gray-200">
                      {!hasError && property.image ? (
                        <img 
                          src={property.image} 
                          alt={property.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                          loading="lazy"
                          onError={() => handleImageError(property.id)}
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                          <ImageOff className="w-6 h-6 mb-1" />
                          <p className="text-xs">No Image</p>
                        </div>
                      )}
                      
                      <DiagonalBadge status={property.listing_status} />
                      
                      <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full text-xs font-semibold text-white bg-gradient-to-r from-primary-600 to-primary-800">
                        {property.type === 'sale' ? 'For Sale' : 'For Rent'}
                      </div>
                      {property.featured && (
                        <div className="absolute top-2 left-2 bg-secondary-500 text-white px-2 py-0.5 rounded-full text-xs font-semibold flex items-center gap-1">
                          <Star className="w-3 h-3" /> Featured
                        </div>
                      )}
                    </div>
                    <div className="p-3 sm:p-4">
                      <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-1 line-clamp-1">{property.title}</h3>
                      <div className="flex items-center gap-1 text-gray-500 mb-2">
                        <MapPin className="w-3 h-3" />
                        <span className="text-xs sm:text-sm line-clamp-1">{property.location}</span>
                      </div>
                      <div className="flex gap-3 mb-3 text-xs text-gray-500">
                        <div className="flex items-center gap-1"><Bed className="w-3 h-3" /> {property.beds}</div>
                        <div className="flex items-center gap-1"><Bath className="w-3 h-3" /> {property.baths}</div>
                        <div className="flex items-center gap-1"><Square className="w-3 h-3" /> {property.sqft}</div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className={`text-base sm:text-lg font-bold ${isSold || isRented ? 'text-gray-500 line-through' : 'text-primary-700'}`}>
                          {formatPrice(property.price, property.type)}
                        </span>
                        {isAvailable && (
                          <button className="px-2.5 py-1.5 sm:px-3 sm:py-1.5 bg-gradient-to-r from-primary-700 to-primary-800 text-white rounded-lg font-semibold text-xs hover:shadow-lg transition flex items-center gap-1">
                            View Details <ArrowRight className="w-3 h-3" />
                          </button>
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
                const isAvailable = !isSold && !isRented
                
                return (
                  <div
                    key={property.id}
                    onClick={() => isAvailable && handleViewDetails(property.id)}
                    className={`bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition cursor-pointer flex flex-col sm:flex-row ${!isAvailable ? 'opacity-90' : ''}`}
                  >
                    <div className="w-full sm:w-32 md:w-40 h-32 sm:h-32 overflow-hidden bg-gray-200 flex-shrink-0 relative">
                      <img 
                        src={property.image} 
                        alt={property.title}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                      {(isSold || isRented) && (
                        <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center">
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold text-white ${isSold ? 'bg-error' : 'bg-purple-600'}`}>
                            {isSold ? 'SOLD' : 'RENTED'}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 p-3 sm:p-4">
                      <div className="flex flex-col sm:flex-row justify-between items-start gap-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <span className={`inline-block px-1.5 py-0.5 rounded-full text-xs font-semibold ${property.type === 'sale' ? 'bg-primary-100 text-primary-700' : 'bg-success/10 text-success'}`}>
                              {property.type === 'sale' ? 'For Sale' : 'For Rent'}
                            </span>
                            {property.featured && (
                              <span className="inline-flex items-center gap-1 bg-secondary-100 text-secondary-700 px-1.5 py-0.5 rounded-full text-xs font-semibold">
                                <Star className="w-3 h-3" /> Featured
                              </span>
                            )}
                          </div>
                          <h3 className="text-base font-bold text-gray-900 mb-1">{property.title}</h3>
                          <div className="flex items-center gap-1 text-gray-500 mb-2">
                            <MapPin className="w-3 h-3" />
                            <span className="text-xs">{property.location}</span>
                          </div>
                          <div className="flex flex-wrap gap-3 text-xs text-gray-500">
                            <span className="flex items-center gap-1"><Bed className="w-3 h-3" /> {property.beds}</span>
                            <span className="flex items-center gap-1"><Bath className="w-3 h-3" /> {property.baths}</span>
                            <span className="flex items-center gap-1"><Square className="w-3 h-3" /> {property.sqft}</span>
                          </div>
                        </div>
                        <div className="text-left sm:text-right w-full sm:w-auto">
                          <p className={`text-base sm:text-lg font-bold ${isSold || isRented ? 'text-gray-500 line-through' : 'text-primary-700'}`}>
                            {formatPrice(property.price, property.type)}
                          </p>
                          {isAvailable && (
                            <button className="mt-1 px-2.5 py-1 bg-gradient-to-r from-primary-700 to-primary-800 text-white rounded-lg font-semibold text-xs hover:shadow-lg transition inline-flex items-center gap-1">
                              View <ArrowRight className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {filteredProperties.length > 6 && (
            <div className="text-center mt-10">
              <button
                onClick={handleSeeMore}
                className="px-5 py-2.5 bg-gradient-to-r from-primary-700 to-primary-800 text-white rounded-lg font-semibold text-sm hover:shadow-lg transition inline-flex items-center gap-1"
              >
                See More Properties <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-8 px-4">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Building2 className="w-7 h-7 text-primary-500" />
                <span className="text-lg font-bold text-white">EstateHub</span>
              </div>
              <p className="text-sm">Your trusted partner in real estate</p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-3 text-sm">Quick Links</h4>
              <ul className="space-y-1.5 text-sm">
                <li><Link to="/properties" className="hover:text-white transition">Properties</Link></li>
                <li><Link to="/about" className="hover:text-white transition">About Us</Link></li>
                <li><Link to="/contact" className="hover:text-white transition">Contact</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-3 text-sm">Contact Us</h4>
              <ul className="space-y-1.5 text-sm">
                <li className="flex items-center gap-2"><Phone className="w-4 h-4" /> +251-960724272</li>
                <li className="flex items-center gap-2"><Mail className="w-4 h-4" /> info@estatehub.com</li>
                <li className="flex items-center gap-2"><MapPin className="w-4 h-4" /> Addis Ababa, Ethiopia</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-6 pt-6 text-center text-xs">
            <p>&copy; 2024 EstateHub. All rights reserved.</p>
          </div>
        </div>
      </footer>

      <style>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
          overflow-x: auto;
          overflow-y: visible;
          -webkit-overflow-scrolling: touch;
        }
        body {
          overflow-x: hidden;
          max-width: 100%;
        }
      `}</style>
    </div>
  )
}

export default HomePage