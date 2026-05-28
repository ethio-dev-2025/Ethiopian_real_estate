// src/components/maps/MapPopup.jsx
import React from 'react';
import { Bed, Bath, Square, Home, Eye } from 'lucide-react';

const MapPopup = ({ property, onViewDetails }) => {
  const getPropertyTypeIcon = () => {
    switch (property.property_type) {
      case 'house':
        return '🏠';
      case 'apartment':
        return '🏢';
      case 'villa':
        return '🏰';
      case 'land':
        return '🌳';
      default:
        return '🏠';
    }
  };

  const formatPrice = (price) => {
    if (!price) return 'Price on request';
    return `ETB ${price.toLocaleString()}`;
  };

  return (
    <div className="max-w-xs">
      {/* Property Image */}
      {property.images && property.images[0] && (
        <div className="mb-3 rounded-lg overflow-hidden">
          <img 
            src={property.images[0]} 
            alt={property.title}
            className="w-full h-32 object-cover"
          />
        </div>
      )}
      
      {/* Property Title */}
      <h3 className="font-semibold text-gray-900 text-base mb-1 line-clamp-1">
        {property.title}
      </h3>
      
      {/* Property Type Badge */}
      <div className="flex items-center gap-1 mb-2">
        <span className="text-lg">{getPropertyTypeIcon()}</span>
        <span className="text-xs text-gray-500 capitalize">{property.property_type}</span>
        <span className={`text-xs px-2 py-0.5 rounded-full ${
          property.listing_type === 'sale' 
            ? 'bg-red-100 text-red-600' 
            : 'bg-blue-100 text-blue-600'
        }`}>
          {property.listing_type === 'sale' ? 'For Sale' : 'For Rent'}
        </span>
      </div>
      
      {/* Price */}
      <p className="text-teal-600 font-bold text-lg mb-2">
        {formatPrice(property.price)}
        {property.listing_type === 'rent' && <span className="text-sm font-normal">/month</span>}
      </p>
      
      {/* Property Details */}
      <div className="flex items-center gap-3 mb-3 text-gray-500 text-sm">
        {property.bedrooms > 0 && (
          <div className="flex items-center gap-1">
            <Bed className="w-3 h-3" />
            <span>{property.bedrooms}</span>
          </div>
        )}
        {property.bathrooms > 0 && (
          <div className="flex items-center gap-1">
            <Bath className="w-3 h-3" />
            <span>{property.bathrooms}</span>
          </div>
        )}
        {property.sqft > 0 && (
          <div className="flex items-center gap-1">
            <Square className="w-3 h-3" />
            <span>{property.sqft} sqft</span>
          </div>
        )}
      </div>
      
      {/* Address */}
      <p className="text-xs text-gray-500 mb-3 line-clamp-1">
        📍 {property.address || property.city || 'Location available on map'}
      </p>
      
      {/* View Details Button */}
      <button
        onClick={onViewDetails}
        className="w-full py-1.5 bg-gradient-to-r from-teal-600 to-emerald-600 text-white rounded-lg text-sm font-medium hover:shadow-md transition flex items-center justify-center gap-1"
      >
        <Eye className="w-3 h-3" />
        View Details
      </button>
    </div>
  );
};

export default MapPopup;