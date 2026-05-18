import React, { useState, useEffect, useCallback, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Header from '../../components/layout/Header'
import { listingsAPI } from '../../services/api/listingsApi'
import { 
  Building2, Home, Search, MapPin, Heart, Shield, 
  Award, Phone, Mail, Star, ArrowRight, 
  Bed, Bath, Square, Filter,
  Grid3x3, List, FilterX, ChevronRight, AlertCircle, ImageOff,
  RefreshCw
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'

const API_URL = 'http://localhost:8000'

// Demo properties for instant display (no delay)
const DEMO_PROPERTIES = [
  {
    id: 1,
    title: 'Luxury Apartment in Bole',
    location: 'Bole, Addis Ababa',
    price: 15000000,
    type: 'sale',
    image: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=500',
    beds: 3,
    baths: 2,
    sqft: 2200,
    featured: true,
    created_at: '2024-03-15'
  },
  {
    id: 2,
    title: 'Modern Villa with Garden',
    location: 'Summit, Addis Ababa',
    price: 45000,
    type: 'rent',
    image: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=500',
    beds: 4,
    baths: 3,
    sqft: 3500,
    featured: true,
    created_at: '2024-02-10'
  },
  {
    id: 3,
    title: 'Commercial Space Kazanchis',
    location: 'Kazanchis, Addis Ababa',
    price: 25000000,
    type: 'sale',
    image: 'https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=500',
    beds: 0,
    baths: 2,
    sqft: 5000,
    featured: false,
    created_at: '2024-01-20'
  },
  {
    id: 4,
    title: 'Cozy Studio Apartment',
    location: 'Mexico, Addis Ababa',
    price: 12000,
    type: 'rent',
    image: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=500',
    beds: 1,
    baths: 1,
    sqft: 450,
    featured: false,
    created_at: '2024-03-01'
  },
  {
    id: 5,
    title: 'Spacious Family House',
    location: 'CMC, Addis Ababa',
    price: 18000000,
    type: 'sale',
    image: 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=500',
    beds: 5,
    baths: 4,
    sqft: 4200,
    featured: true,
    created_at: '2023-12-05'
  },
  {
    id: 6,
    title: 'Executive Apartment Bole',
    location: 'Bole, Addis Ababa',
    price: 35000,
    type: 'rent',
    image: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=500',
    beds: 3,
    baths: 2,
    sqft: 2800,
    featured: false,
    created_at: '2024-03-10'
  }
]

const HomePage = () => {
  const navigate = useNavigate()
  const [allProperties, setAllProperties] = useState(DEMO_PROPERTIES)
  const [filteredProperties, setFilteredProperties] = useState(DEMO_PROPERTIES)
  const [loading, setLoading] = useState(false)
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
  const [usingRealData, setUsingRealData] = useState(false)
  const [fetchStatus, setFetchStatus] = useState('idle')
  const [realPropertyCount, setRealPropertyCount] = useState(0)
  const dataFetched = useRef(false)

  // Format API property to match demo format
  const formatApiProperty = (apiProp) => {
    // Get image URL
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
    
    // Default images
    if (!imageUrl) {
      imageUrl = apiProp.listing_type === 'sale' 
        ? 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=500'
        : 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=500'
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
      created_at: apiProp.created_at || new Date().toISOString()
    }
  }

  // Fetch real properties using the FAST API endpoint
  const fetchRealProperties = async () => {
    console.log('🔄 Fetching real properties from database using FAST API...')
    setFetchStatus('loading')
    
    try {
      // Use the fast endpoint for better performance
      const response = await listingsAPI.getPublicListingsFast({ limit: 20 })
      console.log('✅ API Response:', response)
      
      if (response && response.success && response.listings && response.listings.length > 0) {
        const formattedProperties = response.listings.map(formatApiProperty)
        console.log(`✅ Loaded ${formattedProperties.length} real properties from database`)
        
        setAllProperties(formattedProperties)
        setUsingRealData(true)
        setFetchStatus('success')
        setRealPropertyCount(response.total || formattedProperties.length)
        setError(null)
        
        toast.success(`Loaded ${formattedProperties.length} properties from database`, {
          duration: 3000,
          icon: '🏠'
        })
        return
      }
      
      console.log('⚠️ No properties found in response')
      setFetchStatus('error')
      setUsingRealData(false)
      
    } catch (error) {
      console.log('❌ Error fetching:', error.message)
      setFetchStatus('error')
      setUsingRealData(false)
    }
  }

  // Extract locations from properties
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
  }, [allProperties, activeTab, searchTerm, priceRange, bedrooms, bathrooms, sortBy, selectedLocation])

  // Fetch real data on mount
  useEffect(() => {
    if (!dataFetched.current) {
      dataFetched.current = true
      // Delay slightly to not block initial render
      setTimeout(() => {
        fetchRealProperties()
      }, 500)
    }
  }, [])

  const handleImageError = (propertyId) => {
    setImageErrors(prev => ({ ...prev, [propertyId]: true }))
  }

  const resetFilters = () => {
    setSearchTerm('')
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
        return `ETB ${(price / 1000000).toFixed(1)}M/month`
      }
      return `ETB ${price.toLocaleString()}/month`
    }
    if (price >= 10000000) {
      return `ETB ${(price / 10000000).toFixed(1)} Cr`
    }
    if (price >= 1000000) {
      return `ETB ${(price / 1000000).toFixed(1)} M`
    }
    return `ETB ${price.toLocaleString()}`
  }

  const tabs = [
    { id: 'all', label: 'All Properties', icon: Building2, count: allProperties.length },
    { id: 'sale', label: 'For Sale', icon: Home, count: allProperties.filter(p => p.type === 'sale').length },
    { id: 'rent', label: 'For Rent', icon: Home, count: allProperties.filter(p => p.type === 'rent').length }
  ]

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

  const displayedProperties = filteredProperties.slice(0, 6)

  const handleRefresh = () => {
    fetchRealProperties()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100">
      <Header />

      {/* Hero Section */}
      <section className="relative pt-24 pb-16 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative z-10 container mx-auto px-4 text-center text-white">
          <h1 className="text-4xl md:text-6xl font-bold mb-4">
            Find Your Dream Property
          </h1>
          <p className="text-lg md:text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Discover the best real estate opportunities in Ethiopia
          </p>
          
          {/* Data Source Indicator */}
          <div className="mb-4 flex justify-center items-center gap-3 flex-wrap">
                    <button
              onClick={handleRefresh}
              disabled={fetchStatus === 'loading'}
              className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs bg-white/20 hover:bg-white/30 transition disabled:opacity-50"
            >
              <RefreshCw className={`w-3 h-3 ${fetchStatus === 'loading' ? 'animate-spin' : ''}`} />
              {fetchStatus === 'loading' ? 'Loading...' : 'Refresh'}
            </button>
          </div>
          
          <div className="bg-white rounded-2xl shadow-2xl p-2 max-w-3xl mx-auto">
            <div className="flex flex-col md:flex-row gap-2">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input 
                  type="text" 
                  placeholder="Search by city, region, or property type..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <button 
                onClick={() => setShowFilters(!showFilters)}
                className={`px-6 py-4 rounded-xl transition flex items-center gap-2 ${
                  showFilters 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Filter className="w-5 h-5" />
                Filters
              </button>
              <button 
                onClick={resetFilters}
                className="px-6 py-4 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition flex items-center gap-2"
              >
                <FilterX className="w-5 h-5" />
                Reset
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Properties Section */}
      <section className="py-16 px-4">
        <div className="container mx-auto">
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0, y: -20 }}
                animate={{ opacity: 1, height: 'auto', y: 0 }}
                exit={{ opacity: 0, height: 0, y: -20 }}
                transition={{ duration: 0.2 }}
                className="bg-white rounded-2xl shadow-lg p-6 mb-8"
              >
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                    <Filter className="w-5 h-5" />
                    Filter Properties
                  </h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="latest">Latest</option>
                      <option value="price_low">Price: Low to High</option>
                      <option value="price_high">Price: High to Low</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Price Range</label>
                    <select
                      value={priceRange}
                      onChange={(e) => setPriceRange(e.target.value)}
                      className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-blue-500"
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
                      className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-blue-500"
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
                      className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-blue-500"
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
                      className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="all">All Locations</option>
                      {locations.map(loc => (
                        <option key={loc} value={loc}>{loc}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex flex-wrap justify-between items-center mb-8">
            <div className="flex flex-wrap gap-2 bg-white rounded-full p-1 shadow-sm">
              {tabs.map((tab) => {
                const Icon = tab.icon
                const isActive = activeTab === tab.id
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-6 py-2 rounded-full font-semibold transition ${
                      isActive
                        ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {tab.label}
                    <span className={`text-xs ${isActive ? 'text-white/80' : 'text-gray-400'}`}>
                      ({tab.count})
                    </span>
                  </button>
                )
              })}
            </div>
            
            <div className="flex gap-2 mt-4 md:mt-0">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg transition ${viewMode === 'grid' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600'}`}
              >
                <Grid3x3 className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg transition ${viewMode === 'list' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600'}`}
              >
                <List className="w-5 h-5" />
              </button>
            </div>
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {displayedProperties.map((property) => {
                const hasError = imageErrors[property.id]
                const imageUrl = property.image
                
                return (
                  <div
                    key={property.id}
                    onClick={() => handleViewDetails(property.id)}
                    className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition cursor-pointer group"
                  >
                    <div className="relative h-56 overflow-hidden bg-gray-200">
                      {!hasError && imageUrl ? (
                        <img 
                          src={imageUrl} 
                          alt={property.title}
                          className="w-full h-full object-cover group-hover:scale-110 transition duration-500"
                          loading="eager"
                          onError={() => handleImageError(property.id)}
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                          <ImageOff className="w-8 h-8 mb-1" />
                          <p className="text-xs">No Image</p>
                        </div>
                      )}
                      <div className="absolute top-4 right-4 px-3 py-1 rounded-full text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-purple-600">
                        {property.type === 'sale' ? 'For Sale' : 'For Rent'}
                      </div>
                      {property.featured && (
                        <div className="absolute top-4 left-4 bg-yellow-500 text-white px-3 py-1 rounded-full text-sm font-semibold flex items-center gap-1">
                          <Star className="w-3 h-3" /> Featured
                        </div>
                      )}
                    </div>
                    <div className="p-5">
                      <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-1">{property.title}</h3>
                      <div className="flex items-center gap-1 text-gray-500 mb-3">
                        <MapPin className="w-4 h-4" />
                        <span className="text-sm line-clamp-1">{property.location}</span>
                      </div>
                      <div className="flex gap-4 mb-4 text-sm text-gray-500">
                        <div className="flex items-center gap-1"><Bed className="w-4 h-4" /> {property.beds}</div>
                        <div className="flex items-center gap-1"><Bath className="w-4 h-4" /> {property.baths}</div>
                        <div className="flex items-center gap-1"><Square className="w-4 h-4" /> {property.sqft} sqft</div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xl font-bold text-blue-600">
                          {formatPrice(property.price, property.type)}
                        </span>
                        <button className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:shadow-lg transition">
                          View Details <ArrowRight className="w-4 h-4 inline" />
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="space-y-4">
              {displayedProperties.map((property) => {
                const hasError = imageErrors[property.id]
                const imageUrl = property.image
                
                return (
                  <div
                    key={property.id}
                    onClick={() => handleViewDetails(property.id)}
                    className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition cursor-pointer flex"
                  >
                    <div className="w-48 h-48 overflow-hidden bg-gray-200 flex-shrink-0">
                      {!hasError && imageUrl ? (
                        <img 
                          src={imageUrl} 
                          alt={property.title}
                          className="w-full h-full object-cover hover:scale-110 transition duration-500"
                          loading="eager"
                          onError={() => handleImageError(property.id)}
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                          <ImageOff className="w-6 h-6 mb-1" />
                          <p className="text-xs">No Image</p>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 p-5">
                      <div className="flex justify-between items-start">
                        <div>
                          <span className={`inline-block px-2 py-1 rounded-full text-xs font-semibold mb-2 ${property.type === 'sale' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>
                            {property.type === 'sale' ? 'For Sale' : 'For Rent'}
                          </span>
                          <h3 className="text-xl font-bold text-gray-900 mb-1">{property.title}</h3>
                          <div className="flex items-center gap-1 text-gray-500 mb-2">
                            <MapPin className="w-4 h-4" />
                            <span className="text-sm">{property.location}</span>
                          </div>
                          <div className="flex gap-4 text-sm text-gray-500">
                            <span className="flex items-center gap-1"><Bed className="w-4 h-4" /> {property.beds} beds</span>
                            <span className="flex items-center gap-1"><Bath className="w-4 h-4" /> {property.baths} baths</span>
                            <span className="flex items-center gap-1"><Square className="w-4 h-4" /> {property.sqft} sqft</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-blue-600">{formatPrice(property.price, property.type)}</p>
                          <button className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
                            View Details
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {filteredProperties.length > 6 && (
            <div className="text-center mt-12">
              <button
                onClick={handleSeeMore}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg transition"
              >
                See More Properties <ChevronRight className="w-4 h-4 inline" />
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12 px-4">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Building2 className="w-8 h-8 text-blue-500" />
                <span className="text-xl font-bold text-white">RealEstate Pro</span>
              </div>
              <p className="text-sm">Your trusted partner in real estate</p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2 text-sm">
                <li><Link to="/properties" className="hover:text-white">Properties</Link></li>
                <li><Link to="/about" className="hover:text-white">About Us</Link></li>
                <li><Link to="/contact" className="hover:text-white">Contact</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Contact Us</h4>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2"><Phone className="w-4 h-4" /> +251 11 123 4567</li>
                <li className="flex items-center gap-2"><Mail className="w-4 h-4" /> info@realestatepro.com</li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Newsletter</h4>
              <p className="text-sm mb-3">Subscribe for updates</p>
              <div className="flex">
                <input type="email" placeholder="Your email" className="flex-1 px-3 py-2 rounded-l-lg text-gray-900" />
                <button className="px-4 py-2 bg-blue-600 text-white rounded-r-lg hover:bg-blue-700">Subscribe</button>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm">
            <p>&copy; 2024 RealEstate Pro. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default HomePage