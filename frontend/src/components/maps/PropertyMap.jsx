// src/components/maps/PropertyMap.jsx
import React, { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const PropertyMap = ({ 
  properties = [], 
  onPropertyClick,
  center = [9.03, 38.74],
  zoom = 13,
  height = "500px"
}) => {
  const mapRef = useRef(null);
  const [map, setMap] = useState(null);

  useEffect(() => {
    if (!mapRef.current) {
      const mapInstance = L.map('property-map-container').setView(center, zoom);
      
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(mapInstance);
      
      L.control.zoom({ position: 'bottomright' }).addTo(mapInstance);
      
      setMap(mapInstance);
      mapRef.current = mapInstance;
    }
    
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Add markers when properties change
  useEffect(() => {
    if (!map) return;
    
    // Clear existing markers
    map.eachLayer((layer) => {
      if (layer instanceof L.Marker) {
        map.removeLayer(layer);
      }
    });
    
    // Add new markers
    properties.forEach((property) => {
      const position = [property.latitude || 9.03, property.longitude || 38.74];
      
      let iconColor = '#3b82f6'; // blue for rent
      if (property.listing_type === 'sale') {
        iconColor = '#ef4444'; // red for sale
      }
      
      const customIcon = L.divIcon({
        html: `<div style="background-color: ${iconColor}; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.2);">
                ${property.listing_type === 'sale' ? '💰' : '🏠'}
               </div>`,
        iconSize: [30, 30],
        className: 'custom-marker'
      });
      
      const marker = L.marker(position, { icon: customIcon }).addTo(map);
      
      const popupContent = `
        <div style="min-width: 260px; padding: 5px;">
          <h4 style="margin: 0 0 8px; color: #1f2937;">${property.title}</h4>
          <p style="color: #0d9488; font-weight: bold; margin: 0 0 8px;">
            ETB ${property.price?.toLocaleString()}${property.listing_type === 'rent' ? '/month' : ''}
          </p>
          <p style="margin: 0 0 8px; font-size: 12px; color: #6b7280;">📍 ${property.address || property.city}</p>
          <button onclick="window.dispatchEvent(new CustomEvent('propertyClick', { detail: ${JSON.stringify(property)} }))" 
                  style="background: #0d9488; color: white; border: none; padding: 6px 12px; border-radius: 6px; cursor: pointer; width: 100%;">
            View Details →
          </button>
        </div>
      `;
      
      marker.bindPopup(popupContent);
      
      marker.on('click', () => {
        if (onPropertyClick) onPropertyClick(property);
      });
    });
    
    // Listen for custom event from popup button
    window.addEventListener('propertyClick', (e) => {
      if (onPropertyClick) onPropertyClick(e.detail);
    });
    
    return () => {
      window.removeEventListener('propertyClick', () => {});
    };
  }, [map, properties, onPropertyClick]);

  return (
    <div style={{ height, width: '100%', position: 'relative' }}>
      <div id="property-map-container" style={{ height: '100%', width: '100%', borderRadius: '12px' }} />
    </div>
  );
};

export default PropertyMap;