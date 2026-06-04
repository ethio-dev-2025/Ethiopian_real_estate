// src/components/maps/PropertyMap.jsx - COMPLETE WORKING VERSION
import React, { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons in Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Component to handle map center updates
function MapUpdater({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (center && center[0] && center[1] && !isNaN(center[0]) && !isNaN(center[1])) {
      map.setView(center, zoom);
    }
  }, [map, center, zoom]);
  return null;
}

// Custom marker icon creator
const createCustomIcon = (isSale) => {
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

const PropertyMap = ({ 
  properties = [], 
  onPropertyClick, 
  center = [9.03, 38.74],
  zoom = 13,
  height = '100%'
}) => {
  const mapRef = useRef(null);

  // Filter valid properties (with coordinates)
  const validProperties = properties.filter(p => 
    p && p.latitude && p.longitude && 
    !isNaN(parseFloat(p.latitude)) && !isNaN(parseFloat(p.longitude))
  );

  // Get center from first valid property or use default
  const mapCenter = validProperties.length > 0 && validProperties[0].latitude && validProperties[0].longitude
    ? [parseFloat(validProperties[0].latitude), parseFloat(validProperties[0].longitude)]
    : (center && center[0] && center[1] ? [center[0], center[1]] : [9.03, 38.74]);

  useEffect(() => {
    console.log('PropertyMap mounted');
    console.log('Valid properties:', validProperties.length);
    console.log('Map center:', mapCenter);
  }, [validProperties.length, mapCenter]);

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

  // If no valid properties, show a message
  if (validProperties.length === 0 && properties.length > 0) {
    console.warn('No valid coordinates found for properties');
  }

  return (
    <div style={{ height, width: '100%', position: 'relative' }}>
      <MapContainer
        ref={mapRef}
        center={mapCenter}
        zoom={zoom}
        style={{ height: '100%', width: '100%', borderRadius: '0.5rem' }}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        <MapUpdater center={mapCenter} zoom={zoom} />
        
        {validProperties.map((property) => {
          const position = [parseFloat(property.latitude), parseFloat(property.longitude)];
          const isSale = property.listing_type === 'sale';
          const customIcon = createCustomIcon(isSale);
          const imageUrl = getImageUrl(property.images?.[0] || property.cover_image);
          const priceText = formatPrice(property.price, property.listing_type);
          
          return (
            <Marker 
              key={property.id} 
              position={position} 
              icon={customIcon}
              eventHandlers={{
                click: () => onPropertyClick && onPropertyClick(property.id),
              }}
            >
              <Popup>
                <div 
                  className="cursor-pointer min-w-[200px] max-w-[250px]"
                  style={{ cursor: 'pointer' }}
                  onClick={() => onPropertyClick && onPropertyClick(property.id)}
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
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2">
                          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                          <polyline points="9 22 9 12 15 12 15 22"></polyline>
                        </svg>
                      </div>
                    )}
                    <div className={`absolute top-1 right-1 px-1.5 py-0.5 rounded text-xs font-bold text-white ${isSale ? 'bg-green-600' : 'bg-blue-600'}`}>
                      {isSale ? 'SALE' : 'RENT'}
                    </div>
                  </div>
                  <h4 className="font-semibold text-gray-900 text-sm truncate">{property.title || 'Property'}</h4>
                  <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                    📍 {property.city || 'Addis Ababa'}
                  </p>
                  <p className="text-sm font-bold text-blue-600 mt-2">
                    {priceText}
                  </p>
                  <div className="flex gap-2 mt-2 text-[10px] text-gray-500">
                    <span>🛏️ {property.bedrooms || 0}</span>
                    <span>🛁 {property.bathrooms || 0}</span>
                    <span>📐 {property.sqft || 0} sqft</span>
                  </div>
                  <button 
                    className="w-full mt-2 py-1.5 bg-blue-600 text-white rounded text-xs font-medium hover:bg-blue-700 transition"
                    onClick={(e) => {
                      e.stopPropagation();
                      onPropertyClick && onPropertyClick(property.id);
                    }}
                  >
                    View Details
                  </button>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
};

export default PropertyMap;