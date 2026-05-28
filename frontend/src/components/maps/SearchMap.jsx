// src/components/maps/SearchMap.jsx
import React, { useState } from 'react';
import { Search, MapPin, X } from 'lucide-react';

// Ethiopian cities with coordinates
const ETHIOPIAN_CITIES = [
  { name: 'Addis Ababa', lat: 9.03, lng: 38.74 },
  { name: 'Dire Dawa', lat: 9.59, lng: 41.86 },
  { name: 'Mekelle', lat: 13.49, lng: 39.47 },
  { name: 'Gondar', lat: 12.60, lng: 37.46 },
  { name: 'Bahir Dar', lat: 11.60, lng: 37.38 },
  { name: 'Hawassa', lat: 7.05, lng: 38.47 },
  { name: 'Jimma', lat: 7.67, lng: 36.83 },
  { name: 'Debre Zeit', lat: 8.75, lng: 38.98 },
  { name: 'Adama', lat: 8.55, lng: 39.27 },
  { name: 'Arba Minch', lat: 6.03, lng: 37.55 },
  { name: 'Dessie', lat: 11.13, lng: 39.63 },
  { name: 'Harar', lat: 9.31, lng: 42.12 },
  { name: 'Jijiga', lat: 9.35, lng: 42.80 },
  { name: 'Shashamane', lat: 7.20, lng: 38.60 },
  { name: 'Wolayita Sodo', lat: 6.83, lng: 37.75 },
  { name: 'Debre Markos', lat: 10.33, lng: 37.73 },
  { name: 'Debre Birhan', lat: 9.68, lng: 39.53 },
  { name: 'Adigrat', lat: 14.27, lng: 39.45 },
  { name: 'Axum', lat: 14.12, lng: 38.72 },
  { name: 'Lalibela', lat: 12.03, lng: 39.04 },
];

const SearchMap = ({ map, onLocationSelect, placeholder = "Search for a city or area..." }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);

  const handleSearch = (value) => {
    setSearchTerm(value);
    
    if (value.length > 1) {
      const filtered = ETHIOPIAN_CITIES.filter(city =>
        city.name.toLowerCase().includes(value.toLowerCase())
      );
      setSuggestions(filtered);
      setShowResults(true);
    } else {
      setSuggestions([]);
      setShowResults(false);
    }
  };

  const handleSelectLocation = (city) => {
    setSearchTerm(city.name);
    setShowResults(false);
    setIsSearching(true);
    
    if (map) {
      map.flyTo([city.lat, city.lng], 13, {
        duration: 1.5,
      });
      
      if (onLocationSelect) {
        onLocationSelect([city.lat, city.lng]);
      }
    }
    
    setTimeout(() => {
      setIsSearching(false);
    }, 1000);
  };

  const handleUseMyLocation = () => {
    if (navigator.geolocation) {
      setIsSearching(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          if (map) {
            map.flyTo([latitude, longitude], 15, {
              duration: 1.5,
            });
            
            if (onLocationSelect) {
              onLocationSelect([latitude, longitude]);
            }
          }
          setIsSearching(false);
          setSearchTerm('Your Location');
        },
        (error) => {
          console.error("Error getting location:", error);
          setIsSearching(false);
        }
      );
    }
  };

  const clearSearch = () => {
    setSearchTerm('');
    setSuggestions([]);
    setShowResults(false);
  };

  return (
    <div className="absolute top-4 left-4 right-4 z-[1000] md:left-auto md:right-auto md:w-96">
      <div className="relative">
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder={placeholder}
                className="w-full pl-9 pr-8 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 bg-white shadow-md"
              />
              {searchTerm && (
                <button
                  onClick={clearSearch}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2"
                >
                  <X className="w-4 h-4 text-gray-400 hover:text-gray-600" />
                </button>
              )}
            </div>
            
            {/* Suggestions dropdown */}
            {showResults && suggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl shadow-lg border border-gray-200 max-h-64 overflow-y-auto z-[1001]">
                {suggestions.map((city, index) => (
                  <button
                    key={index}
                    onClick={() => handleSelectLocation(city)}
                    className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-2 transition"
                  >
                    <MapPin className="w-4 h-4 text-teal-500" />
                    <span className="text-sm text-gray-700">{city.name}</span>
                  </button>
                ))}
              </div>
            )}
            
            {showResults && suggestions.length === 0 && searchTerm.length > 1 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl shadow-lg border border-gray-200 p-4 text-center">
                <p className="text-sm text-gray-500">No cities found matching "{searchTerm}"</p>
              </div>
            )}
          </div>
          
          <button
            onClick={handleUseMyLocation}
            disabled={isSearching}
            className="px-4 py-2.5 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition shadow-md disabled:opacity-50"
            title="Use my current location"
          >
            <MapPin className="w-4 h-4 text-teal-600" />
          </button>
        </div>
        
        {isSearching && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-lg p-2 text-center">
            <div className="flex items-center justify-center gap-2">
              <div className="w-4 h-4 border-2 border-teal-600 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-sm text-gray-600">Finding location...</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchMap;