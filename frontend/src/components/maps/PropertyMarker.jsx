// src/components/maps/PropertyMarker.jsx
import React from 'react';
import { Marker, Popup, Tooltip } from 'react-leaflet';
import L from 'leaflet';
import MapPopup from './MapPopup';

const PropertyMarker = ({ property, onClick, icon }) => {
  const position = [property.latitude || 9.03, property.longitude || 38.74];
  
  // If property doesn't have coordinates, generate random nearby
  const getPosition = () => {
    if (property.latitude && property.longitude) {
      return [property.latitude, property.longitude];
    }
    // Generate random offset within Addis Ababa
    const lat = 9.03 + (Math.random() - 0.5) * 0.1;
    const lng = 38.74 + (Math.random() - 0.5) * 0.1;
    return [lat, lng];
  };

  const finalPosition = getPosition();
  const finalIcon = icon || L.icon({
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [0, -41],
  });

  return (
    <Marker
      position={finalPosition}
      icon={finalIcon}
      eventHandlers={{
        click: () => onClick && onClick(property),
      }}
    >
      <Tooltip sticky>
        <div className="font-semibold">{property.title}</div>
        <div className="text-sm">ETB {property.price?.toLocaleString()}</div>
      </Tooltip>
      <Popup minWidth={280} maxWidth={320}>
        <MapPopup property={property} onViewDetails={() => onClick && onClick(property)} />
      </Popup>
    </Marker>
  );
};

export default PropertyMarker;