// src/components/dashboard/buyer/BuyerProperties.jsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, MapPin, Bed, Bath, Square, Grid3X3, List, Loader, 
  Heart, Building2, FilterX, Eye, Star, Filter, RefreshCw,
  ImageOff, Home, ArrowRight, ChevronDown
} from 'lucide-react';
import { listingsAPI } from '../../../services/api/listingsApi';
import toast from 'react-hot-toast';

const API_URL = 'http://localhost:8000';

// Simple Select Component
const SimpleSelect = ({ value, onChange, options, label }) => {
  const [isOpen, setIsOpen] = useState(false);
  const selectRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (selectRef.current && !selectRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOption = options.find(opt => opt.value === value);

  return (
    <div className="relative" ref={selectRef}>
      <label className="block text-xs font-medium text-text-primary mb-1">{label}</label>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-3 py-2.5 text-left bg-white border border-border-light rounded-lg flex justify-between items-center focus:outline-none focus:ring-2 focus:ring-primary-500 hover:border-primary-400 transition shadow-sm min-h-[44px]"
      >
        <span className={selectedOption ? 'text-text-primary text-sm' : 'text-text-muted text-sm'}>
          {selectedOption ? selectedOption.label : 'Select'}
        </span>
        <ChevronDown className={`w-4 h-4 text-text-muted transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-border-light rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
              className={`w-full px-3 py-2.5 text-left hover:bg-gray-50 transition text-sm ${
                value === option.value ? 'bg-primary-50 text-primary-700 font-medium' : 'text-text-secondary'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// Fallback mock data
const MOCK_PROPERTIES = [
  { id: 1, title: 'Luxury Apartment in Bole', city: 'Bole, Addis Ababa', price: 15000000, listing_type: 'sale', bedrooms: 3, bathrooms: 2, sqft: 2200, featured: true, created_at: '2024-03-15' },
  { id: 2, title: 'Modern Villa with Garden', city: 'Summit, Addis Ababa', price: 45000, listing_type: 'rent', bedrooms: 4, bathrooms: 3, sqft: 3500, featured: true, created_at: '2024-02-10' },
  { id: 3, title: 'Commercial Space Kazanchis', city: 'Kazanchis, Addis Ababa', price: 25000000, listing_type: 'sale', bedrooms: 0, bathrooms: 2, sqft: 5000, featured: false, created_at: '2024-01-20' },
  { id: 4, title: 'Cozy Studio Apartment', city: 'Mexico, Addis Ababa', price: 12000, listing_type: 'rent', bedrooms: 1, bathrooms: 1, sqft: 450, featured: false, created_at: '2024-03-01' },
  { id: 5, title: 'Spacious Family House', city: 'CMC, Addis Ababa', price: 18000000, listing_type: 'sale', bedrooms: 5, bathrooms: 4, sqft: 4200, featured: true, created_at: '2023-12-05' },
  { id: 6, title: 'Executive Apartment', city: 'Bole, Addis Ababa', price: 35000, listing_type: 'rent', bedrooms: 3, bathrooms: 2, sqft: 2800, featured: false, created_at: '2024-03-10' },
];

const PROPERTY_IMAGES = [
  'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=500&h=300&fit=crop',
  'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=500&h=300&fit=crop',
  'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=500&h=300&fit=crop',
  'https://images.unsplash.com/photo-1512917774080-9991f1c4c751?w=500&h=300&fit=crop',
  'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=500&h=300&fit=crop',
  'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=500&h=300&fit=crop',
];

const getPropertyImage = (id) => PROPERTY_IMAGES[id % PROPERTY_IMAGES.length];

const BuyerProperties = () => {
  const navigate = useNavigate();
  const [allProperties, setAllProperties] = useState(MOCK_PROPERTIES);
  const [filteredProperties, setFilteredProperties] = useState(MOCK_PROPERTIES);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [viewMode, setViewMode] = useState('grid');
  const [savedProperties, setSavedProperties] = useState([]);
  const [priceRange, setPriceRange] = useState('all');
  const [bedrooms, setBedrooms] = useState('any');
  const [bathrooms, setBathrooms] = useState('any');
  const [sortBy, setSortBy] = useState('latest');
  const [locations, setLocations] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [usingRealData, setUsingRealData] = useState(false);
  const [imageErrors, setImageErrors] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const dataFetched = useRef(false);

  const getPriceOptions = () => {
    const currentType = activeTab === 'all' ? 'sale' : activeTab;
    
    if (currentType === 'rent') {
      return [
        { value: 'all', label: 'Any Price' },
        { value: 'under-20k', label: 'Under ETB 20,000' },
        { value: '20k-50k', label: 'ETB 20,000 - 50,000' },
        { value: 'above-50k', label: 'Above ETB 50,000' }
      ];
    }
    return [
      { value: 'all', label: 'Any Price' },
      { value: 'under-5m', label: 'Under ETB 5M' },
      { value: '5m-15m', label: 'ETB 5M - 15M' },
      { value: 'above-15m', label: 'Above ETB 15M' }
    ];
  };

  const formatApiProperty = (apiProp) => {
    let imageUrl = null;
    if (apiProp.images && apiProp.images.length > 0) {
      const img = apiProp.images[0];
      if (img.startsWith('http')) imageUrl = img;
      else if (img.startsWith('/uploads')) imageUrl = `${API_URL}${img}`;
      else imageUrl = `${API_URL}/uploads/${img}`;
    }
    if (!imageUrl && apiProp.cover_image) {
      if (apiProp.cover_image.startsWith('http')) imageUrl = apiProp.cover_image;
      else if (apiProp.cover_image.startsWith('/uploads')) imageUrl = `${API_URL}${apiProp.cover_image}`;
      else imageUrl = `${API_URL}/uploads/${apiProp.cover_image}`;
    }
    if (!imageUrl) imageUrl = getPropertyImage(apiProp.id);
    
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
    };
  };

  const fetchRealProperties = async () => {
    try {
      const response = await listingsAPI.getPublicListingsFast({ limit: 50 });
      if (response && response.success && response.listings && response.listings.length > 0) {
        const formattedProperties = response.listings.map(formatApiProperty);
        setAllProperties(formattedProperties);
        setUsingRealData(true);
      } else {
        setUsingRealData(false);
      }
    } catch (error) {
      console.error('Error fetching properties:', error);
      setUsingRealData(false);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const uniqueLocations = [...new Set(allProperties.map(p => p.city))].filter(Boolean);
    setLocations(uniqueLocations);
  }, [allProperties]);

  useEffect(() => {
    const saved = localStorage.getItem('buyer_saved_properties');
    if (saved) {
      try { setSavedProperties(JSON.parse(saved)); } catch (e) {}
    }
  }, []);

  // Apply filters
  useEffect(() => {
    let filtered = [...allProperties];

    if (activeTab !== 'all') {
      filtered = filtered.filter(prop => prop.listing_type === activeTab);
    }

    if (searchTerm && searchTerm.trim() !== '') {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(prop =>
        prop.title.toLowerCase().includes(term) ||
        prop.city.toLowerCase().includes(term)
      );
    }

    if (priceRange !== 'all') {
      const currentType = activeTab === 'all' ? 'sale' : activeTab;
      
      if (currentType === 'rent') {
        if (priceRange === 'under-20k') {
          filtered = filtered.filter(prop => prop.price < 20000);
        } else if (priceRange === '20k-50k') {
          filtered = filtered.filter(prop => prop.price >= 20000 && prop.price <= 50000);
        } else if (priceRange === 'above-50k') {
          filtered = filtered.filter(prop => prop.price > 50000);
        }
      } else {
        if (priceRange === 'under-5m') {
          filtered = filtered.filter(prop => prop.price < 5000000);
        } else if (priceRange === '5m-15m') {
          filtered = filtered.filter(prop => prop.price >= 5000000 && prop.price <= 15000000);
        } else if (priceRange === 'above-15m') {
          filtered = filtered.filter(prop => prop.price > 15000000);
        }
      }
    }

    if (bedrooms !== 'any') {
      const minBeds = parseInt(bedrooms, 10);
      filtered = filtered.filter(prop => prop.bedrooms >= minBeds);
    }

    if (bathrooms !== 'any') {
      const minBaths = parseInt(bathrooms, 10);
      filtered = filtered.filter(prop => prop.bathrooms >= minBaths);
    }

    if (selectedLocation !== 'all') {
      filtered = filtered.filter(prop => prop.city === selectedLocation);
    }

    if (sortBy === 'price_low') {
      filtered.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'price_high') {
      filtered.sort((a, b) => b.price - a.price);
    } else if (sortBy === 'latest') {
      filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    }

    setFilteredProperties(filtered);
  }, [allProperties, activeTab, searchTerm, priceRange, bedrooms, bathrooms, selectedLocation, sortBy]);

  useEffect(() => {
    if (!dataFetched.current) {
      dataFetched.current = true;
      fetchRealProperties();
    }
  }, []);

  const handleSaveProperty = (property) => {
    const exists = savedProperties.some(p => p.id === property.id);
    let newSaved;
    if (exists) {
      newSaved = savedProperties.filter(p => p.id !== property.id);
      toast.success('Removed from saved');
    } else {
      newSaved = [...savedProperties, property];
      toast.success('Saved to favorites');
    }
    setSavedProperties(newSaved);
    localStorage.setItem('buyer_saved_properties', JSON.stringify(newSaved));
  };

  const formatPrice = (price, type) => {
    if (!price) return 'ETB 0';
    if (type === 'rent') return `ETB ${price.toLocaleString()}/month`;
    if (price >= 10000000) return `ETB ${(price / 10000000).toFixed(1)} Cr`;
    if (price >= 1000000) return `ETB ${(price / 1000000).toFixed(1)} M`;
    return `ETB ${price.toLocaleString()}`;
  };

  const resetFilters = () => {
    setSearchTerm('');
    setActiveTab('all');
    setPriceRange('all');
    setBedrooms('any');
    setBathrooms('any');
    setSortBy('latest');
    setSelectedLocation('all');
    setShowFilters(false);
    toast.success('All filters reset');
  };

  const hasActiveFilters = searchTerm !== '' || activeTab !== 'all' || priceRange !== 'all' || 
                           bedrooms !== 'any' || bathrooms !== 'any' || selectedLocation !== 'all';

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="overflow-x-hidden">
      {/* Search, Filter, and View Mode - ALL IN ONE ROW */}
      <div className="mb-6">
        <div className="flex items-center gap-2">
          {/* Search Bar - 1/3 width */}
          <div className="relative w-1/3 min-w-[180px]">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-muted w-4 h-4" />
            <input
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 text-sm border border-border-light rounded-xl focus:ring-2 focus:ring-primary-500 bg-white shadow-sm min-h-[44px]"
            />
          </div>
          
          {/* Filter Button */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`px-4 py-2.5 rounded-xl transition flex items-center gap-2 text-sm min-h-[44px] whitespace-nowrap ${
              showFilters ? 'bg-primary-600 text-white' : 'bg-gray-100 text-text-secondary hover:bg-gray-200'
            }`}
          >
            <Filter className="w-4 h-4" /> Filters
          </button>
          
          {/* Clear Filters Button - Only show if filters active */}
          {hasActiveFilters && (
            <button 
              onClick={resetFilters} 
              className="px-3 py-2.5 rounded-xl text-sm bg-error/10 text-error hover:bg-error/20 min-h-[44px] whitespace-nowrap"
              title="Clear filters"
            >
              <FilterX className="w-4 h-4" />
            </button>
          )}
          
          {/* Spacer to push view mode to the right */}
          <div className="flex-1"></div>
          
          {/* View Mode Buttons - Right side */}
          <div className="flex gap-1.5 bg-white rounded-lg p-1 shadow-sm">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-md transition min-w-[40px] min-h-[40px] flex items-center justify-center ${
                viewMode === 'grid' 
                  ? 'bg-gradient-to-r from-primary-600 to-primary-700 text-white' 
                  : 'text-text-muted hover:bg-gray-100'
              }`}
              title="Grid View"
            >
              <Grid3X3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-md transition min-w-[40px] min-h-[40px] flex items-center justify-center ${
                viewMode === 'list' 
                  ? 'bg-gradient-to-r from-primary-600 to-primary-700 text-white' 
                  : 'text-text-muted hover:bg-gray-100'
              }`}
              title="List View"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="bg-white rounded-xl shadow-lg p-4 mb-6">
          <div className="space-y-4">
            {/* Sort By */}
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
            
            {/* Price Range */}
            <SimpleSelect
              value={priceRange}
              onChange={setPriceRange}
              options={getPriceOptions()}
              label="Price Range"
            />
            
            {/* Bedrooms & Bathrooms */}
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
            
            {/* Location */}
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
      )}

      {/* Results Count */}
      <div className="mb-4">
        <p className="text-sm text-text-muted">{filteredProperties.length} properties found</p>
      </div>

      {/* Properties Display */}
      {filteredProperties.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-border-light p-12 text-center">
          <Home className="w-12 h-12 text-text-muted mx-auto mb-3" />
          <p className="text-text-muted">No properties found</p>
          {hasActiveFilters && <button onClick={resetFilters} className="mt-3 text-primary-600 text-sm hover:underline">Clear all filters</button>}
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredProperties.map((property) => (
            <div key={property.id} onClick={() => navigate(`/properties/${property.id}`)} className="bg-white rounded-xl shadow-sm border border-border-light overflow-hidden hover:shadow-lg transition-all cursor-pointer group">
              <div className="relative h-44 bg-gray-200">
                <img 
                  src={usingRealData && property.image ? property.image : getPropertyImage(property.id)} 
                  alt={property.title} 
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                  onError={(e) => { e.target.src = getPropertyImage(property.id); }}
                />
                <div className={`absolute top-3 right-3 px-2 py-1 rounded-lg text-xs font-semibold text-white ${property.listing_type === 'sale' ? 'bg-success' : 'bg-primary-600'}`}>
                  {property.listing_type === 'sale' ? 'For Sale' : 'For Rent'}
                </div>
                {property.featured && <div className="absolute top-3 left-3 px-2 py-1 rounded-lg text-xs font-semibold bg-warning text-white flex items-center gap-1"><Star className="w-3 h-3" /> Featured</div>}
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-text-primary group-hover:text-primary-600 transition line-clamp-1">{property.title}</h3>
                <div className="flex items-center gap-1 text-text-muted text-sm mt-1"><MapPin className="w-3 h-3" /> {property.city}</div>
                <div className="flex gap-3 mt-2 text-sm text-text-muted">
                  <span><Bed className="w-3 h-3 inline mr-1" /> {property.bedrooms}</span>
                  <span><Bath className="w-3 h-3 inline mr-1" /> {property.bathrooms}</span>
                  <span><Square className="w-3 h-3 inline mr-1" /> {property.sqft}</span>
                </div>
                <p className="text-lg font-bold text-primary-600 mt-2">{formatPrice(property.price, property.listing_type)}</p>
                <button onClick={(e) => { e.stopPropagation(); handleSaveProperty(property); }} className={`mt-3 w-full py-2 rounded-lg text-sm font-medium transition min-h-[44px] ${
                  savedProperties.some(p => p.id === property.id) ? 'bg-gray-100 text-text-muted' : 'bg-primary-600 text-white hover:bg-primary-700'
                }`}>
                  {savedProperties.some(p => p.id === property.id) ? '✓ Saved' : '❤️ Save Property'}
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredProperties.map((property) => (
            <div key={property.id} onClick={() => navigate(`/properties/${property.id}`)} className="bg-white rounded-xl shadow-sm border border-border-light overflow-hidden hover:shadow-md transition cursor-pointer flex flex-col sm:flex-row">
              <div className="w-full sm:w-28 h-28 flex-shrink-0 bg-gray-200">
                <img 
                  src={usingRealData && property.image ? property.image : getPropertyImage(property.id)} 
                  alt={property.title} 
                  className="w-full h-full object-cover"
                  onError={(e) => { e.target.src = getPropertyImage(property.id); }}
                />
              </div>
              <div className="flex-1 p-4">
                <div className="flex flex-col sm:flex-row justify-between items-start gap-2">
                  <div>
                    <h3 className="font-semibold text-text-primary">{property.title}</h3>
                    <div className="flex items-center gap-1 text-text-muted text-sm mt-1"><MapPin className="w-3 h-3" /> {property.city}</div>
                    <div className="flex gap-3 mt-2 text-sm text-text-muted">
                      <span><Bed className="w-3 h-3 inline mr-1" /> {property.bedrooms} beds</span>
                      <span><Bath className="w-3 h-3 inline mr-1" /> {property.bathrooms} baths</span>
                      <span><Square className="w-3 h-3 inline mr-1" /> {property.sqft} sqft</span>
                    </div>
                  </div>
                  <div className="text-left sm:text-right">
                    <p className="text-lg font-bold text-primary-600">{formatPrice(property.price, property.listing_type)}</p>
                    <span className={`inline-block mt-1 px-2 py-1 rounded-lg text-xs font-semibold ${property.listing_type === 'sale' ? 'bg-success/10 text-success' : 'bg-primary-50 text-primary-600'}`}>
                      {property.listing_type === 'sale' ? 'Sale' : 'Rent'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <style>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
};

export default BuyerProperties;