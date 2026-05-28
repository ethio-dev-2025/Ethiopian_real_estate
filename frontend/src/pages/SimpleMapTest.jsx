// src/pages/SimpleMapTest.jsx
import React, { useEffect } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const SimpleMapTest = () => {
  useEffect(() => {
    // Initialize map centered on Addis Ababa
    const map = L.map('simple-map').setView([9.03, 38.74], 13);
    
    // Add tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);
    
    // Add a marker at Addis Ababa center
    const centerMarker = L.marker([9.03, 38.74]).addTo(map);
    centerMarker.bindPopup('<b>EstateHub</b><br />Welcome to Addis Ababa!').openPopup();
    
    // Add markers for popular areas in Addis Ababa
    const locations = [
      { lat: 9.01, lng: 38.78, name: 'Bole', desc: 'Upscale area with restaurants, hotels, and nightlife' },
      { lat: 9.05, lng: 38.82, name: 'CMC', desc: 'Popular residential area with many properties' },
      { lat: 9.08, lng: 38.75, name: 'Summit', desc: 'Premium residential area with luxury homes' },
      { lat: 9.00, lng: 38.73, name: 'Mexico', desc: 'Commercial and residential area' },
      { lat: 9.02, lng: 38.70, name: 'Piassa', desc: 'Historic city center and shopping district' },
      { lat: 9.04, lng: 38.71, name: 'Megenagna', desc: 'Major transportation hub' },
      { lat: 9.07, lng: 38.80, name: 'Kazanchis', desc: 'Business district' },
      { lat: 8.98, lng: 38.79, name: 'Ayat', desc: 'Growing residential area' },
    ];
    
    locations.forEach(loc => {
      const marker = L.marker([loc.lat, loc.lng]).addTo(map);
      marker.bindPopup(`
        <div style="min-width: 200px;">
          <h4 style="margin: 0 0 5px; color: #0d9488;">${loc.name}</h4>
          <p style="margin: 0; font-size: 12px; color: #666;">${loc.desc}</p>
          <hr style="margin: 8px 0;" />
          <button onclick="window.location.href='/properties'" style="background: #0d9488; color: white; border: none; padding: 4px 12px; border-radius: 4px; cursor: pointer;">
            View Properties →
          </button>
        </div>
      `);
    });
    
    // Add zoom control
    L.control.zoom({ position: 'bottomright' }).addTo(map);
    
    // Cleanup on component unmount
    return () => {
      map.remove();
    };
  }, []);

  return (
    <div style={{ height: '100vh', width: '100%', position: 'relative' }}>
      <div style={{ 
        position: 'absolute', 
        top: '20px', 
        left: '20px', 
        zIndex: 1000, 
        background: 'white', 
        padding: '12px 20px', 
        borderRadius: '12px', 
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        pointerEvents: 'none'
      }}>
        <h2 style={{ margin: 0, fontSize: '18px', color: '#0d9488' }}>🗺️ EstateHub</h2>
        <p style={{ margin: '5px 0 0', fontSize: '12px', color: '#666' }}>Exploring Addis Ababa Real Estate</p>
      </div>
      <div id="simple-map" style={{ height: '100%', width: '100%' }} />
    </div>
  );
};

export default SimpleMapTest;