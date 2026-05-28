// src/components/maps/UserLocation.jsx
import React, { useEffect } from 'react';
import { Marker, Popup, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';

// Custom user location icon
const userIcon = L.divIcon({
  html: `<div class="relative">
    <div class="w-5 h-5 bg-blue-500 rounded-full border-2 border-white shadow-lg animate-ping absolute"></div>
    <div class="w-5 h-5 bg-blue-500 rounded-full border-2 border-white shadow-lg relative z-10"></div>
  </div>`,
  className: 'custom-user-icon',
  iconSize: L.point(20, 20),
  iconAnchor: L.point(10, 10),
});

const UserLocation = ({ position }) => {
  const map = useMap();
  
  useEffect(() => {
    if (position) {
      // Fly to user location smoothly
      map.flyTo(position, 15, {
        duration: 1.5,
      });
    }
  }, [position, map]);

  if (!position) return null;

  return (
    <>
      <Circle
        center={position}
        radius={50}
        pathOptions={{
          color: '#3b82f6',
          fillColor: '#3b82f6',
          fillOpacity: 0.1,
          weight: 2,
        }}
      />
      <Circle
        center={position}
        radius={200}
        pathOptions={{
          color: '#3b82f6',
          fillColor: '#3b82f6',
          fillOpacity: 0.05,
          weight: 1,
        }}
      />
      <Marker position={position} icon={userIcon}>
        <Popup>
          <div className="text-center">
            <p className="font-semibold text-gray-900">Your Location</p>
            <p className="text-sm text-gray-500">You are here</p>
          </div>
        </Popup>
      </Marker>
    </>
  );
};

export default UserLocation;