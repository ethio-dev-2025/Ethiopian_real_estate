// src/components/maps/PropertyCluster.jsx - FIXED VERSION (no CSS import)
import React, { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Try to import markercluster dynamically (if installed)
let MarkerClusterGroup = null;
let markerClusterCssLoaded = false;

// Add CSS dynamically
const loadMarkerClusterCSS = () => {
  if (markerClusterCssLoaded) return;
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet.markercluster/1.5.3/MarkerCluster.css';
  document.head.appendChild(link);
  const linkDefault = document.createElement('link');
  linkDefault.rel = 'stylesheet';
  linkDefault.href = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet.markercluster/1.5.3/MarkerCluster.Default.css';
  document.head.appendChild(linkDefault);
  markerClusterCssLoaded = true;
};

// Load markercluster library dynamically
const loadMarkerCluster = async () => {
  try {
    const module = await import('leaflet.markercluster');
    MarkerClusterGroup = module.default;
    loadMarkerClusterCSS();
    return true;
  } catch (error) {
    console.warn('leaflet.markercluster not installed. Install with: npm install leaflet.markercluster');
    return false;
  }
};

// Custom cluster icon
const createClusterIcon = (cluster) => {
  const count = cluster.getChildCount();
  let color = '#3b82f6';
  let size = 40;
  
  if (count > 100) {
    color = '#ef4444';
    size = 56;
  } else if (count > 50) {
    color = '#f59e0b';
    size = 48;
  } else if (count > 10) {
    color = '#10b981';
    size = 44;
  }
  
  return L.divIcon({
    html: `<div style="
      background-color: ${color};
      width: ${size}px;
      height: ${size}px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: bold;
      font-size: ${size > 45 ? '16px' : '14px'};
      box-shadow: 0 2px 5px rgba(0,0,0,0.2);
      border: 2px solid white;
      font-family: sans-serif;
    ">${count}</div>`,
    className: 'custom-cluster-icon',
    iconSize: [size, size],
  });
};

const PropertyCluster = ({ properties, onPropertyClick }) => {
  const map = useMap();
  const markerClusterRef = useRef(null);
  const [clusterReady, setClusterReady] = React.useState(false);

  useEffect(() => {
    const initCluster = async () => {
      const loaded = await loadMarkerCluster();
      setClusterReady(loaded);
    };
    initCluster();
  }, []);

  useEffect(() => {
    if (!map || !clusterReady || !MarkerClusterGroup || properties.length === 0) return;

    // Create marker cluster group
    const markerClusterGroup = new MarkerClusterGroup({
      iconCreateFunction: createClusterIcon,
      maxClusterRadius: 80,
      spiderfyOnMaxZoom: true,
      showCoverageOnHover: false,
      zoomToBoundsOnClick: true,
    });

    // Add markers to cluster group
    properties.forEach((property) => {
      if (property && property.latitude && property.longitude) {
        // Create custom marker icon
        const isSale = property.listing_type === 'sale';
        const color = isSale ? '#22c55e' : '#3b82f6';
        
        const customIcon = L.divIcon({
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
        
        const marker = L.marker([property.latitude, property.longitude], { icon: customIcon });
        
        // Format price
        let priceText = `ETB ${property.price?.toLocaleString()}`;
        if (property.listing_type === 'rent') {
          priceText = `ETB ${property.price?.toLocaleString()}/mo`;
        } else if (property.price >= 10000000) {
          priceText = `ETB ${(property.price / 10000000).toFixed(1)}Cr`;
        } else if (property.price >= 1000000) {
          priceText = `ETB ${(property.price / 1000000).toFixed(1)}M`;
        }
        
        const imageUrl = property.images?.[0] || property.cover_image;
        const fullImageUrl = imageUrl ? (imageUrl.startsWith('http') ? imageUrl : `http://localhost:8000${imageUrl}`) : null;
        
        // Create popup content
        const popupContent = document.createElement('div');
        popupContent.className = 'cursor-pointer min-w-[200px] max-w-[250px]';
        popupContent.style.padding = '0';
        popupContent.innerHTML = `
          <div style="cursor: pointer;">
            <div style="position: relative; height: 120px; background-color: #e5e7eb; border-radius: 8px; overflow: hidden; margin-bottom: 8px;">
              ${fullImageUrl ? `<img src="${fullImageUrl}" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.src='https://placehold.co/400x300/e2e8f0/64748b?text=No+Image'">` : '<div style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center;"><svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg></div>'}
              <div style="position: absolute; top: 4px; right: 4px; padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: bold; color: white; background-color: ${isSale ? '#22c55e' : '#3b82f6'}">
                ${isSale ? 'SALE' : 'RENT'}
              </div>
            </div>
            <h4 style="font-weight: 600; color: #111827; font-size: 14px; margin-bottom: 4px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${property.title || 'Property'}</h4>
            <p style="display: flex; align-items: center; gap: 4px; font-size: 11px; color: #6b7280; margin-top: 4px; margin-bottom: 0;">
              📍 ${property.city || 'Addis Ababa'}
            </p>
            <p style="font-weight: bold; color: #2563eb; font-size: 14px; margin-top: 8px; margin-bottom: 0;">
              ${priceText}
            </p>
            <div style="display: flex; gap: 8px; margin-top: 8px; font-size: 10px; color: #6b7280;">
              <span>🛏️ ${property.bedrooms || 0}</span>
              <span>🛁 ${property.bathrooms || 0}</span>
              <span>📐 ${property.sqft || 0} sqft</span>
            </div>
            <button style="width: 100%; margin-top: 8px; padding: 6px 0; background-color: #2563eb; color: white; border: none; border-radius: 6px; font-size: 11px; font-weight: 500; cursor: pointer;">
              View Details
            </button>
          </div>
        `;
        
        marker.bindPopup(popupContent);
        marker.on('click', () => onPropertyClick && onPropertyClick(property.id));
        markerClusterGroup.addLayer(marker);
      }
    });

    markerClusterGroup.addTo(map);
    markerClusterRef.current = markerClusterGroup;

    // Cleanup
    return () => {
      if (markerClusterRef.current && map) {
        map.removeLayer(markerClusterRef.current);
      }
    };
  }, [map, properties, onPropertyClick, clusterReady]);

  // If cluster is not ready or no properties, return null
  if (!clusterReady || properties.length === 0) {
    return null;
  }

  return null;
};

export default PropertyCluster;