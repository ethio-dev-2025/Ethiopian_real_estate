// src/components/maps/PropertyMarker.jsx - COMPLETE WORKING VERSION
import React from 'react';
import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { MapPin, Home, DollarSign } from 'lucide-react';

// Create custom marker icon
const createPropertyIcon = (propertyType) => {
  const isSale = propertyType === 'sale';
  const color = isSale ? '#22c55e' : '#3b82f6';
  
  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div style="
        background-color: ${color};
        width: 36px;
        height: 36px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 2px 5px rgba(0,0,0,0.2);
        border: 2px solid white;
        cursor: pointer;
        transition: transform 0.2s;
      ">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
          <polyline points="9 22 9 12 15 12 15 22"></polyline>
        </svg>
      </div>
    `,
    iconSize: [36, 36],
    popupAnchor: [0, -18],
  });
};

const PropertyMarker = ({ property, onClick }) => {
  if (!property || !property.latitude || !property.longitude) {
    console.warn('Property missing coordinates:', property);
    return null;
  }

  const position = [property.latitude, property.longitude];
  const icon = createPropertyIcon(property.listing_type);

  const formatPrice = (price, type) => {
    if (!price) return 'ETB 0';
    if (type === 'rent') return `ETB ${price.toLocaleString()}/mo`;
    if (price >= 10000000) return `ETB ${(price / 10000000).toFixed(1)}Cr`;
    if (price >= 1000000) return `ETB ${(price / 1000000).toFixed(1)}M`;
    return `ETB ${price.toLocaleString()}`;
  };

  const getImageUrl = (imagePath) => {
    if (!imagePath) return null;
    if (imagePath.startsWith('http')) return imagePath;
    if (imagePath.startsWith('/uploads')) return `http://localhost:8000${imagePath}`;
    return imagePath;
  };

  const imageUrl = getImageUrl(property.images?.[0] || property.cover_image);

  return (
    <Marker 
      position={position} 
      icon={icon}
      eventHandlers={{
        click: () => onClick && onClick(property.id),
      }}
    >
      <Popup>
        <div 
          className="cursor-pointer min-w-[200px] max-w-[250px]"
          onClick={() => onClick && onClick(property.id)}
        >
          <div className="relative h-32 bg-gray-200 rounded-lg overflow-hidden mb-2">
            {imageUrl ? (
              <img 
                src={imageUrl} 
                alt={property.title}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.src = 'https://placehold.co/400x300/e2e8f0/64748b?text=No+Image';
                }}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gray-100">
                <Home className="w-8 h-8 text-gray-400" />
              </div>
            )}
            <div className={`absolute top-1 right-1 px-1.5 py-0.5 rounded text-xs font-bold text-white ${
              property.listing_type === 'sale' ? 'bg-green-600' : 'bg-blue-600'
            }`}>
              {property.listing_type === 'sale' ? 'SALE' : 'RENT'}
            </div>
          </div>
          <h4 className="font-semibold text-gray-900 text-sm truncate">{property.title}</h4>
          <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
            <MapPin className="w-3 h-3" />
            {property.city || 'Addis Ababa'}
          </p>
          <p className="text-sm font-bold text-blue-600 mt-2">
            {formatPrice(property.price, property.listing_type)}
          </p>
          <div className="flex gap-1 mt-2 text-[10px] text-gray-500">
            <span>🛏️ {property.bedrooms || 0}</span>
            <span>🛁 {property.bathrooms || 0}</span>
            <span>📐 {property.sqft || 0} sqft</span>
          </div>
          <button 
            className="w-full mt-2 py-1.5 bg-blue-600 text-white rounded text-xs font-medium hover:bg-blue-700 transition"
            onClick={(e) => {
              e.stopPropagation();
              onClick && onClick(property.id);
            }}
          >
            View Details
          </button>
        </div>
      </Popup>
    </Marker>
  );
};

export default PropertyMarker;