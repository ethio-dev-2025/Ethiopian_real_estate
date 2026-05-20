// src/components/dashboard/buyer/BuyerSaved.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, MapPin, Bed, Bath, Square, ArrowRight, RefreshCw, Star, ImageOff } from 'lucide-react';
import toast from 'react-hot-toast';

const API_URL = 'http://localhost:8000';

// Fallback images
const PROPERTY_IMAGES = [
  'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=500&h=300&fit=crop',
  'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=500&h=300&fit=crop',
  'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=500&h=300&fit=crop',
  'https://images.unsplash.com/photo-1512917774080-9991f1c4c751?w=500&h=300&fit=crop',
];

const getPropertyImage = (id) => PROPERTY_IMAGES[id % PROPERTY_IMAGES.length];

const BuyerSaved = () => {
  const navigate = useNavigate();
  const [savedProperties, setSavedProperties] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchSavedProperties = useCallback(async () => {
    try {
      // Get saved property IDs from localStorage
      const localSaved = localStorage.getItem('buyer_saved_properties');
      let savedIds = [];
      
      if (localSaved) {
        try {
          const saved = JSON.parse(localSaved);
          savedIds = saved.map(p => p.id);
        } catch (e) {}
      }
      
      if (savedIds.length === 0) {
        setSavedProperties([]);
        setIsLoading(false);
        return;
      }
      
      // Fetch full property details from API
      const fullProperties = [];
      
      for (const id of savedIds) {
        try {
          const response = await fetch(`${API_URL}/api/buyer/properties/${id}`, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('access_token')}`
            }
          });
          
          if (response.ok) {
            const property = await response.json();
            fullProperties.push(property);
          }
        } catch (err) {
          console.error(`Error fetching property ${id}:`, err);
        }
      }
      
      setSavedProperties(fullProperties);
      
      // Update localStorage with full data
      if (fullProperties.length > 0) {
        localStorage.setItem('buyer_saved_properties', JSON.stringify(fullProperties));
      }
      
    } catch (error) {
      console.error('Error fetching saved properties:', error);
      toast.error('Failed to load saved properties');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleRemove = (propertyId) => {
    const newSaved = savedProperties.filter(p => p.id !== propertyId);
    setSavedProperties(newSaved);
    // Update localStorage with remaining properties
    localStorage.setItem('buyer_saved_properties', JSON.stringify(newSaved));
    toast.success('Removed from saved');
  };

  const formatPrice = (price, type) => {
    if (!price) return 'ETB 0';
    if (type === 'rent') return `ETB ${price.toLocaleString()}/month`;
    if (price >= 10000000) return `ETB ${(price / 10000000).toFixed(1)} Cr`;
    if (price >= 1000000) return `ETB ${(price / 1000000).toFixed(1)} M`;
    return `ETB ${price.toLocaleString()}`;
  };

  const getImageUrl = (property) => {
    // Try to get image from property data
    if (property.images && property.images.length > 0) {
      const img = property.images[0];
      if (img.startsWith('http')) return img;
      if (img.startsWith('/uploads')) return `${API_URL}${img}`;
      return `${API_URL}/uploads/${img}`;
    }
    if (property.cover_image) {
      if (property.cover_image.startsWith('http')) return property.cover_image;
      if (property.cover_image.startsWith('/uploads')) return `${API_URL}${property.cover_image}`;
      return `${API_URL}/uploads/${property.cover_image}`;
    }
    return getPropertyImage(property.id);
  };

  useEffect(() => { 
    fetchSavedProperties(); 
  }, [fetchSavedProperties]);

  // Show content immediately, no spinner
  if (savedProperties.length === 0 && !isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] bg-white rounded-2xl shadow-sm border p-12 text-center">
        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-4">
          <Heart className="w-10 h-10 text-red-500" />
        </div>
        <h2 className="text-2xl font-bold text-gray-700 mb-2">No saved properties yet</h2>
        <p className="text-gray-500 mb-6">Start saving properties you like and they'll appear here</p>
        <button 
          onClick={() => navigate('/dashboard/buyer/properties')} 
          className="px-6 py-2.5 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition flex items-center gap-2"
        >
          Browse Properties <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
            <Heart className="w-5 h-5 text-red-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Saved Properties</h1>
            <p className="text-gray-500 text-sm">Properties you've saved for later</p>
          </div>
          <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-sm ml-2">
            {savedProperties.length} saved
          </span>
        </div>
        <button 
          onClick={fetchSavedProperties} 
          className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition"
          title="Refresh"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {savedProperties.map((property) => {
          const imageUrl = getImageUrl(property);
          
          return (
            <div 
              key={property.id} 
              className="bg-white rounded-xl shadow-sm border overflow-hidden hover:shadow-md transition group cursor-pointer"
              onClick={() => navigate(`/properties/${property.id}`)}
            >
              <div className="relative h-36 bg-gray-200">
                {imageUrl ? (
                  <img 
                    src={imageUrl} 
                    alt={property.title} 
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    onError={(e) => { e.target.src = getPropertyImage(property.id); }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-300">
                    <ImageOff className="w-8 h-8 text-gray-400" />
                  </div>
                )}
                <div className={`absolute top-3 right-3 px-2 py-1 rounded-lg text-xs font-semibold text-white ${property.listing_type === 'sale' ? 'bg-green-600' : 'bg-blue-600'}`}>
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
                  <MapPin className="w-3 h-3" /> {property.city || property.address || 'Addis Ababa'}
                </div>
                <div className="flex gap-3 mt-2 text-sm text-gray-500">
                  <span><Bed className="w-3 h-3 inline mr-1" /> {property.bedrooms || 0}</span>
                  <span><Bath className="w-3 h-3 inline mr-1" /> {property.bathrooms || 0}</span>
                  <span><Square className="w-3 h-3 inline mr-1" /> {property.sqft || 0}</span>
                </div>
                <p className="text-lg font-bold text-blue-600 mt-2">
                  {formatPrice(property.price, property.listing_type)}
                </p>
                <div className="flex gap-2 mt-3">
                  <button 
                    onClick={(e) => { e.stopPropagation(); navigate(`/properties/${property.id}`); }} 
                    className="flex-1 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition"
                  >
                    View Details
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleRemove(property.id); }} 
                    className="px-3 py-2 bg-red-100 text-red-600 rounded-lg text-sm font-semibold hover:bg-red-200 transition flex items-center gap-1"
                  >
                    <Heart className="w-4 h-4 fill-current" />
                    Remove
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default BuyerSaved;