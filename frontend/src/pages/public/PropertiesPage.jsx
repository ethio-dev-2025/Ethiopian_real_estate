// src/pages/public/PropertiesPage.jsx - COMPLETE WITH LARGER BOLD VIEW DETAILS BUTTON
import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import Header from '../../components/layout/Header'
import { Search, Grid3x3, List, MapPin, Home, Filter, ChevronDown, Award, ArrowRight } from 'lucide-react'
import toast from 'react-hot-toast'

const API_URL = 'http://localhost:8000'

const PropertiesPage = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const [properties, setProperties] = useState([])
  const [soldRentedListings, setSoldRentedListings] = useState([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState('grid')
  const [showFilters, setShowFilters] = useState(true)
  const [total, setTotal] = useState(0)
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState(location.state?.searchTerm || '')
  const [listingType, setListingType] = useState(location.state?.listingType || 'all')
  const [propertyType, setPropertyType] = useState('all')
  const [city, setCity] = useState('')
  const [priceRange, setPriceRange] = useState('any')
  const [bedrooms, setBedrooms] = useState('')
  const [bathrooms, setBathrooms] = useState('')
  const [sortBy, setSortBy] = useState('latest')

  const priceRanges = [
    { value: 'any', label: 'Any Price' },
    { value: 'under_5m', label: 'Under ETB 5,000,000', min: 0, max: 5000000 },
    { value: '5m_15m', label: 'ETB 5M - 15M', min: 5000000, max: 15000000 },
    { value: 'above_15m', label: 'Above ETB 15M', min: 15000000, max: null }
  ]

  const propertyTypeOptions = [
    { value: 'all', label: 'All Properties' },
    { value: 'house', label: 'House' },
    { value: 'apartment', label: 'Apartment' },
    { value: 'villa', label: 'Villa' },
    { value: 'condo', label: 'Condo' },
    { value: 'townhouse', label: 'Townhouse' },
    { value: 'commercial', label: 'Commercial' }
  ]

  const bedroomOptions = [
    { value: '', label: 'Any' },
    { value: '1', label: '1+' },
    { value: '2', label: '2+' },
    { value: '3', label: '3+' },
    { value: '4', label: '4+' },
    { value: '5', label: '5+' }
  ]

  const bathroomOptions = [
    { value: '', label: 'Any' },
    { value: '1', label: '1+' },
    { value: '2', label: '2+' },
    { value: '3', label: '3+' },
    { value: '4', label: '4+' }
  ]

  const cities = [
    { value: '', label: 'All Locations' },
    { value: 'Addis Ababa', label: 'Addis Ababa' },
    { value: 'Dire Dawa', label: 'Dire Dawa' },
    { value: 'Mekelle', label: 'Mekelle' },
    { value: 'Gondar', label: 'Gondar' },
    { value: 'Bahir Dar', label: 'Bahir Dar' },
    { value: 'Hawassa', label: 'Hawassa' }
  ]

  const sortOptions = [
    { value: 'latest', label: 'Latest' },
    { value: 'price_low', label: 'Price: Low to High' },
    { value: 'price_high', label: 'Price: High to Low' }
  ]

  const fetchSoldRentedListings = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/api/listings/sold-rented?limit=6`)
      const data = await response.json()
      if (data.success) {
        setSoldRentedListings(data.listings)
      }
    } catch (error) {
      console.error('Error fetching sold/rented listings:', error)
    }
  }, [])

  const fetchProperties = useCallback(async () => {
    setLoading(true)
    try {
      let url = `${API_URL}/api/listings/public-fast?limit=100&offset=0`
      if (listingType !== 'all') url += `&listing_type=${listingType}`
      
      const response = await fetch(url)
      const data = await response.json()
      
      if (data.success !== false) {
        let listings = data.listings || []
        
        listings = listings.filter(p => p.listing_status !== 'sold' && p.listing_status !== 'rented')
        
        if (propertyType !== 'all') {
          listings = listings.filter(p => p.property_type === propertyType)
        }
        if (city) {
          listings = listings.filter(p => p.city?.toLowerCase().includes(city.toLowerCase()))
        }
        
        const selectedRange = priceRanges.find(r => r.value === priceRange)
        if (selectedRange && selectedRange.value !== 'any') {
          if (selectedRange.min !== null) listings = listings.filter(p => p.price >= selectedRange.min)
          if (selectedRange.max !== null) listings = listings.filter(p => p.price <= selectedRange.max)
        }
        
        if (bedrooms) listings = listings.filter(p => p.bedrooms >= parseInt(bedrooms))
        if (bathrooms) listings = listings.filter(p => p.bathrooms >= parseInt(bathrooms))
        
        if (searchTerm) {
          const term = searchTerm.toLowerCase()
          listings = listings.filter(p => 
            p.title?.toLowerCase().includes(term) || 
            p.city?.toLowerCase().includes(term)
          )
        }
        
        if (sortBy === 'price_low') {
          listings.sort((a, b) => a.price - b.price)
        } else if (sortBy === 'price_high') {
          listings.sort((a, b) => b.price - a.price)
        }
        
        setProperties(listings)
        setTotal(listings.length)
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Failed to load properties')
    } finally {
      setLoading(false)
    }
  }, [listingType, propertyType, city, priceRange, searchTerm, sortBy, bedrooms, bathrooms])

  useEffect(() => {
    fetchProperties()
    fetchSoldRentedListings()
  }, [fetchProperties, fetchSoldRentedListings])

  const formatPrice = (price, type) => {
    if (!price) return 'Price on request'
    if (type === 'rent') return `ETB ${price.toLocaleString()}/mo`
    if (price >= 10000000) return `ETB ${(price / 10000000).toFixed(1)}Cr`
    if (price >= 1000000) return `ETB ${(price / 1000000).toFixed(1)}M`
    return `ETB ${price.toLocaleString()}`
  }

  const resetFilters = () => {
    setSearchTerm('')
    setListingType('all')
    setPropertyType('all')
    setCity('')
    setPriceRange('any')
    setBedrooms('')
    setBathrooms('')
    setSortBy('latest')
    fetchProperties()
    toast.success('Filters reset')
  }

  const hasActiveFilters = listingType !== 'all' || propertyType !== 'all' || city !== '' || 
                           priceRange !== 'any' || bedrooms !== '' || bathrooms !== ''

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      {/* Hero Section */}
      <div className="bg-gradient-to-r from-primary-800 to-primary-900 pt-6 pb-6">
        <div className="px-4 max-w-7xl mx-auto">
          <h1 className="text-xl font-bold text-white text-center mb-4">
            Browse Properties
          </h1>
          
          {/* Search Bar */}
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-xl shadow-lg p-2 flex gap-2">
              <div className="relative flex-1 min-w-0">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search by location, property name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && fetchProperties()}
                  className="w-full pl-9 pr-3 py-2 rounded-lg text-gray-900 text-sm outline-none focus:ring-2 focus:ring-primary-600"
                />
              </div>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="px-4 py-2 rounded-lg text-sm flex items-center gap-2 bg-gray-100 text-gray-700 lg:hidden"
              >
                <Filter className="w-4 h-4" />
                {showFilters ? 'Hide' : 'Show'} Filters
              </button>
              <button
                onClick={fetchProperties}
                className="px-5 py-2 bg-primary-700 text-white rounded-lg text-sm font-medium hover:bg-primary-800 transition"
              >
                Search
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Results Section */}
      <div className="px-4 py-6 max-w-7xl mx-auto">
        
        {/* Recently Sold/Rented Section */}
        {soldRentedListings.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Award className="w-5 h-5 text-secondary-500" />
              <h2 className="text-lg font-bold text-gray-900">Recently Sold & Rented</h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {soldRentedListings.map(property => (
                <div
                  key={property.id}
                  onClick={() => navigate(`/properties/${property.id}`)}
                  className="bg-white rounded-xl shadow-sm overflow-hidden cursor-pointer hover:shadow-md transition group"
                >
                  <div className="relative h-32 bg-gray-200">
                    <img
                      src={property.images?.[0] || property.cover_image || 'https://placehold.co/400x300/e2e8f0/64748b?text=No+Image'}
                      alt={property.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    />
                    <div className={`absolute top-1 right-1 px-1.5 py-0.5 rounded text-xs font-bold text-white ${
                      property.listing_status === 'sold' ? 'bg-error' : 'bg-purple-600'
                    }`}>
                      {property.listing_status === 'sold' ? 'SOLD' : 'RENTED'}
                    </div>
                  </div>
                  <div className="p-2">
                    <h3 className="font-semibold text-xs text-gray-900 line-clamp-1">{property.title}</h3>
                    <p className="text-gray-500 text-xs">{property.city}</p>
                    <p className="text-xs font-bold text-success mt-1">
                      {property.listing_status === 'sold' ? 'Sold' : 'Rented'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* FILTERS SECTION */}
        <div className={`bg-white rounded-xl shadow-sm border p-4 mb-6 transition-all duration-300 ${showFilters ? 'block' : 'hidden lg:block'}`}>
          
          {/* Mobile toggle button */}
          <div className="flex justify-between items-center lg:hidden mb-4 pb-3 border-b">
            <h3 className="font-semibold text-gray-900">Filter Properties</h3>
            <button onClick={() => setShowFilters(false)} className="text-gray-400">
              <ChevronDown className="w-5 h-5" />
            </button>
          </div>
          
          {/* First Row - Main filters */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Listing Type</label>
              <select 
                value={listingType} 
                onChange={(e) => setListingType(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-600 focus:border-primary-600"
              >
                <option value="all">All Properties</option>
                <option value="sale">For Sale</option>
                <option value="rent">For Rent</option>
              </select>
            </div>
            
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Property Type</label>
              <select 
                value={propertyType} 
                onChange={(e) => setPropertyType(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-600"
              >
                {propertyTypeOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Price Range</label>
              <select 
                value={priceRange} 
                onChange={(e) => setPriceRange(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-600"
              >
                {priceRanges.map(range => (
                  <option key={range.value} value={range.value}>{range.label}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Bedrooms</label>
              <select 
                value={bedrooms} 
                onChange={(e) => setBedrooms(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-600"
              >
                {bedroomOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Bathrooms</label>
              <select 
                value={bathrooms} 
                onChange={(e) => setBathrooms(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-600"
              >
                {bathroomOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>
          
          {/* Second Row - Location, Sort, Actions */}
          <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 mt-4 pt-3 border-t">
            <div className="flex flex-col sm:flex-row gap-3">
              <select 
                value={city} 
                onChange={(e) => setCity(e.target.value)}
                className="p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-600"
              >
                {cities.map(c => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
              
              <select 
                value={sortBy} 
                onChange={(e) => setSortBy(e.target.value)}
                className="p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-600"
              >
                {sortOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              
              {hasActiveFilters && (
                <button 
                  onClick={resetFilters}
                  className="px-3 py-2 text-sm text-error hover:bg-red-50 rounded-lg transition"
                >
                  Clear All Filters
                </button>
              )}
            </div>
            
            <button 
              onClick={fetchProperties}
              className="px-4 py-2 bg-primary-700 text-white rounded-lg text-sm font-medium hover:bg-primary-800 transition w-full sm:w-auto"
            >
              Apply Filters
            </button>
          </div>
        </div>
        
        {/* Results Header */}
        <div className="flex flex-wrap justify-between items-center gap-3 mb-4">
          <p className="text-sm text-gray-600">
            {total} {total === 1 ? 'property' : 'properties'} found
          </p>
          <div className="flex gap-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg transition ${
                viewMode === 'grid' ? 'bg-primary-700 text-white' : 'bg-white text-gray-600 shadow'
              }`}
            >
              <Grid3x3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg transition ${
                viewMode === 'list' ? 'bg-primary-700 text-white' : 'bg-white text-gray-600 shadow'
              }`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
        
        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-700"></div>
            <p className="mt-2 text-gray-500">Loading properties...</p>
          </div>
        )}
        
        {/* No Results */}
        {!loading && properties.length === 0 && (
          <div className="text-center py-12 bg-white rounded-xl shadow-sm">
            <Home className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">No properties found</p>
            <button onClick={resetFilters} className="mt-3 text-sm text-primary-700 hover:underline">
              Clear filters
            </button>
          </div>
        )}
        
        {/* Grid View */}
        {!loading && properties.length > 0 && viewMode === 'grid' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {properties.map(property => (
              <div
                key={property.id}
                onClick={() => navigate(`/properties/${property.id}`)}
                className="bg-white rounded-xl shadow-md overflow-hidden cursor-pointer hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
              >
                <div className="relative h-48">
                  <img
                    src={property.images?.[0] || 'https://placehold.co/400x300/e2e8f0/64748b?text=No+Image'}
                    alt={property.title}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                  <div className="absolute top-2 right-2 px-2 py-1 rounded-md text-xs font-semibold text-white bg-primary-700">
                    {property.listing_type === 'sale' ? 'For Sale' : 'For Rent'}
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 mb-1 line-clamp-1">{property.title}</h3>
                  <div className="flex items-center gap-1 text-gray-500 text-sm mb-2">
                    <MapPin className="w-3 h-3" />
                    <span>{property.city || 'Addis Ababa'}</span>
                  </div>
                  <div className="text-xl font-bold text-primary-700 mb-3">
                    {formatPrice(property.price, property.listing_type)}
                  </div>
                  
                  <button className="w-full py-3 bg-gradient-to-r from-primary-700 to-primary-800 text-white rounded-lg font-bold text-base hover:shadow-lg transition transform hover:scale-105 flex items-center justify-center gap-2">
                    View Details <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {/* List View */}
        {!loading && properties.length > 0 && viewMode === 'list' && (
          <div className="space-y-3">
            {properties.map(property => (
              <div
                key={property.id}
                onClick={() => navigate(`/properties/${property.id}`)}
                className="bg-white rounded-xl shadow-md overflow-hidden cursor-pointer hover:shadow-lg transition flex flex-col sm:flex-row"
              >
                <div className="h-48 sm:h-auto sm:w-48 md:w-56 flex-shrink-0">
                  <img
                    src={property.images?.[0] || 'https://placehold.co/400x300/e2e8f0/64748b?text=No+Image'}
                    alt={property.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 p-4">
                  <div className="flex flex-wrap justify-between items-start gap-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 line-clamp-1">{property.title}</h3>
                      <div className="flex items-center gap-1 text-gray-500 text-sm mt-1">
                        <MapPin className="w-3 h-3 flex-shrink-0" />
                        <span className="truncate">{property.city || 'Addis Ababa'}</span>
                      </div>
                      <p className="text-lg font-bold text-primary-700 mt-2">
                        {formatPrice(property.price, property.listing_type)}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className={`inline-block px-2 py-1 rounded-lg text-xs font-semibold ${
                        property.listing_type === 'sale' ? 'bg-success/10 text-success' : 'bg-primary-100 text-primary-700'
                      }`}>
                        {property.listing_type === 'sale' ? 'Sale' : 'Rent'}
                      </span>
                      <button className="mt-2 w-full sm:w-auto px-5 py-2.5 bg-gradient-to-r from-primary-700 to-primary-800 text-white rounded-lg font-bold text-sm hover:shadow-lg transition transform hover:scale-105 flex items-center justify-center gap-2">
                        View Details <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default PropertiesPage