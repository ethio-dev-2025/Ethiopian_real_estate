// src/components/maps/PropertyCluster.jsx
import React, { useEffect, useRef } from 'react';
import L from 'leaflet';

// Import markercluster CSS dynamically (only in browser)
if (typeof window !== 'undefined') {
  import('leaflet.markercluster/dist/leaflet.markercluster.css');
}

// Custom cluster icon
const createClusterIcon = (cluster) => {
  const count = cluster.getChildCount();
  let size = 'small';
  let bgColor = '#3b82f6';
  
  if (count > 100) {
    size = 'large';
    bgColor = '#ef4444';
  } else if (count > 10) {
    size = 'medium';
    bgColor = '#f59e0b';
  }
  
  const sizeMap = {
    small: { width: 40, height: 40, fontSize: 14 },
    medium: { width: 50, height: 50, fontSize: 16 },
    large: { width: 60, height: 60, fontSize: 18 },
  };
  
  const dimensions = sizeMap[size];
  
  return L.divIcon({
    html: `<div style="background-color: ${bgColor}; width: ${dimensions.width}px; height: ${dimensions.height}px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: ${dimensions.fontSize}px; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.2);">${count}</div>`,
    className: 'custom-cluster-icon',
    iconSize: L.point(dimensions.width, dimensions.height),
  });
};

// Helper function to create popup content
const createPopupContent = (property, onPropertyClick) => {
  const getPropertyTypeIcon = () => {
    switch (property.property_type) {
      case 'house': return '🏠';
      case 'apartment': return '🏢';
      case 'villa': return '🏰';
      case 'land': return '🌳';
      default: return '🏠';
    }
  };

  const formatPrice = (price) => {
    if (!price) return 'Price on request';
    return `ETB ${price.toLocaleString()}`;
  };

  const div = document.createElement('div');
  div.className = 'max-w-xs p-2';
  div.style.minWidth = '260px';
  div.style.maxWidth = '320px';
  div.innerHTML = `
    ${property.images && property.images[0] ? `
      <div class="mb-3 rounded-lg overflow-hidden">
        <img src="${property.images[0]}" alt="${property.title}" class="w-full h-32 object-cover" />
      </div>
    ` : ''}
    <h3 class="font-semibold text-gray-900 text-base mb-1 line-clamp-1">${property.title}</h3>
    <div class="flex items-center gap-1 mb-2">
      <span class="text-lg">${getPropertyTypeIcon()}</span>
      <span class="text-xs text-gray-500 capitalize">${property.property_type}</span>
      <span class="text-xs px-2 py-0.5 rounded-full ${property.listing_type === 'sale' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}">
        ${property.listing_type === 'sale' ? 'For Sale' : 'For Rent'}
      </span>
    </div>
    <p class="text-teal-600 font-bold text-lg mb-2">${formatPrice(property.price)}${property.listing_type === 'rent' ? '<span class="text-sm font-normal">/month</span>' : ''}</p>
    <div class="flex items-center gap-3 mb-3 text-gray-500 text-sm">
      ${property.bedrooms > 0 ? `<div class="flex items-center gap-1">🛏️ <span>${property.bedrooms}</span></div>` : ''}
      ${property.bathrooms > 0 ? `<div class="flex items-center gap-1">🚿 <span>${property.bathrooms}</span></div>` : ''}
      ${property.sqft > 0 ? `<div class="flex items-center gap-1">📐 <span>${property.sqft} sqft</span></div>` : ''}
    </div>
    <p class="text-xs text-gray-500 mb-3 line-clamp-1">📍 ${property.address || property.city || 'Location available on map'}</p>
    <button class="w-full py-1.5 bg-gradient-to-r from-teal-600 to-emerald-600 text-white rounded-lg text-sm font-medium hover:shadow-md transition flex items-center justify-center gap-1 view-details-btn" data-property-id="${property.id}">
      👁️ View Details
    </button>
  `;
  
  // Add click event listener to the button
  setTimeout(() => {
    const btn = div.querySelector('.view-details-btn');
    if (btn) {
      btn.addEventListener('click', () => {
        if (onPropertyClick) onPropertyClick(property);
      });
    }
  }, 0);
  
  return div;
};

const PropertyCluster = ({ map, properties, onPropertyClick, getMarkerIcon }) => {
  const markerClusterRef = useRef(null);

  useEffect(() => {
    if (!map || !properties || properties.length === 0) return;

    // Dynamically import markercluster to avoid build issues
    const initMarkerCluster = async () => {
      try {
        // Import markercluster library dynamically
        const LModule = await import('leaflet.markercluster');
        const MarkerClusterGroup = LModule.MarkerClusterGroup || LModule.default;
        
        // Create marker cluster group
        const markerCluster = new MarkerClusterGroup({
          chunkedLoading: true,
          spiderfyOnMaxZoom: true,
          showCoverageOnHover: false,
          maxClusterRadius: 80,
          iconCreateFunction: createClusterIcon,
        });

        // Add markers to cluster
        properties.forEach((property) => {
          const position = [property.latitude || 9.03, property.longitude || 38.74];
          const icon = getMarkerIcon(property.property_type, property.listing_type);
          
          const marker = L.marker(position, { icon });
          
          // Add popup
          const popupContent = createPopupContent(property, onPropertyClick);
          marker.bindPopup(popupContent, { minWidth: 280, maxWidth: 320 });
          
          marker.on('click', () => {
            if (onPropertyClick) onPropertyClick(property);
          });
          
          markerCluster.addLayer(marker);
        });

        // Add cluster to map
        map.addLayer(markerCluster);
        markerClusterRef.current = markerCluster;
      } catch (error) {
        console.error('Error loading markercluster:', error);
        // Fallback: add markers without clustering
        properties.forEach((property) => {
          const position = [property.latitude || 9.03, property.longitude || 38.74];
          const icon = getMarkerIcon(property.property_type, property.listing_type);
          const marker = L.marker(position, { icon });
          const popupContent = createPopupContent(property, onPropertyClick);
          marker.bindPopup(popupContent);
          marker.addTo(map);
        });
      }
    };

    initMarkerCluster();

    // Cleanup
    return () => {
      if (markerClusterRef.current && map) {
        map.removeLayer(markerClusterRef.current);
        markerClusterRef.current = null;
      }
    };
  }, [map, properties, onPropertyClick, getMarkerIcon]);

  return null;
};

export default PropertyCluster;