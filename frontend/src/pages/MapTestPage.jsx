// src/pages/MapTestPage.jsx
import { useNavigate } from 'react-router-dom';
import React, {
  lazy,
  Suspense,
  useState,
  useEffect
} from 'react';


const MapTestPage = () => {
  const navigate = useNavigate();
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [mapReady, setMapReady] = useState(false);

  // Sample properties with Ethiopian coordinates
  const sampleProperties = [
    {
      id: 1,
      title: 'Luxury Villa in Bole',
      price: 25000000,
      listing_type: 'sale',
      property_type: 'villa',
      bedrooms: 5,
      bathrooms: 4,
      sqft: 450,
      latitude: 9.01,
      longitude: 38.78,
      address: 'Bole, Addis Ababa',
      city: 'Addis Ababa',
      images: ['https://placehold.co/600x400/0d9488/white?text=Luxury+Villa']
    },
    {
      id: 2,
      title: 'Modern Apartment in CMC',
      price: 15000,
      listing_type: 'rent',
      property_type: 'apartment',
      bedrooms: 2,
      bathrooms: 2,
      sqft: 120,
      latitude: 9.05,
      longitude: 38.82,
      address: 'CMC, Addis Ababa',
      city: 'Addis Ababa',
      images: ['https://placehold.co/600x400/3b82f6/white?text=Modern+Apartment']
    },
    {
      id: 3,
      title: 'Family House in Summit',
      price: 8500000,
      listing_type: 'sale',
      property_type: 'house',
      bedrooms: 3,
      bathrooms: 2,
      sqft: 250,
      latitude: 9.08,
      longitude: 38.75,
      address: 'Summit, Addis Ababa',
      city: 'Addis Ababa',
      images: ['https://placehold.co/600x400/10b981/white?text=Family+House']
    },
    {
      id: 4,
      title: 'Commercial Building in Mexico',
      price: 45000,
      listing_type: 'rent',
      property_type: 'commercial',
      bedrooms: 0,
      bathrooms: 2,
      sqft: 500,
      latitude: 9.00,
      longitude: 38.73,
      address: 'Mexico, Addis Ababa',
      city: 'Addis Ababa',
      images: ['https://placehold.co/600x400/f59e0b/white?text=Commercial']
    },
    {
      id: 5,
      title: 'Land for Sale in Ayat',
      price: 3000000,
      listing_type: 'sale',
      property_type: 'land',
      bedrooms: 0,
      bathrooms: 0,
      sqft: 1000,
      latitude: 9.12,
      longitude: 38.88,
      address: 'Ayat, Addis Ababa',
      city: 'Addis Ababa',
      images: ['https://placehold.co/600x400/ef4444/white?text=Land']
    },
    {
      id: 6,
      title: 'Penthouse in Kazanchis',
      price: 35000,
      listing_type: 'rent',
      property_type: 'apartment',
      bedrooms: 3,
      bathrooms: 3,
      sqft: 180,
      latitude: 9.02,
      longitude: 38.76,
      address: 'Kazanchis, Addis Ababa',
      city: 'Addis Ababa',
      images: ['https://placehold.co/600x400/8b5cf6/white?text=Penthouse']
    },
  ];

  useEffect(() => {
    // Check if PropertyMap component is available
    try {
      // This will try to import the component
      import('../components/maps/PropertyMap');
      setMapReady(true);
    } catch (error) {
      console.warn('PropertyMap component not ready yet:', error);
      setMapReady(false);
    }
  }, []);

  const handlePropertyClick = (property) => {
    setSelectedProperty(property);
    console.log('Selected property:', property);
  };

  if (!mapReady) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading map components...</p>
          <button 
            onClick={() => navigate('/simple-map')}
            className="mt-4 px-4 py-2 bg-teal-600 text-white rounded-lg"
          >
            Try Simple Map Instead
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Property Map</h1>
              <p className="text-gray-500 text-sm">Find your dream property in Ethiopia</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => navigate('/simple-map')}
                className="px-4 py-2 text-teal-600 hover:text-teal-700 transition border border-teal-600 rounded-lg"
              >
                Simple Map
              </button>
              <button
                onClick={() => navigate('/')}
                className="px-4 py-2 text-gray-600 hover:text-gray-900 transition"
              >
                ← Back to Home
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Map Container */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <PropertyMap
            properties={sampleProperties}
            onPropertyClick={handlePropertyClick}
            center={[9.03, 38.74]}
            zoom={12}
            showUserLocation={true}
            showSearch={true}
            height="600px"
          />
        </div>
      </div>

      {/* Property Details Modal */}
      {selectedProperty && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setSelectedProperty(null)}>
          <div className="bg-white rounded-2xl max-w-md w-full max-h-[80vh] overflow-y-auto animate-slide-up" onClick={(e) => e.stopPropagation()}>
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-bold text-gray-900">{selectedProperty.title}</h3>
                <button
                  onClick={() => setSelectedProperty(null)}
                  className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
                >
                  ×
                </button>
              </div>
              
              {selectedProperty.images && selectedProperty.images[0] && (
                <div className="mb-4 rounded-lg overflow-hidden">
                  <img 
                    src={selectedProperty.images[0]} 
                    alt={selectedProperty.title}
                    className="w-full h-48 object-cover"
                  />
                </div>
              )}
              
              <p className="text-2xl font-bold text-teal-600 mb-2">
                ETB {selectedProperty.price.toLocaleString()}
                {selectedProperty.listing_type === 'rent' && <span className="text-sm font-normal">/month</span>}
              </p>
              
              <div className="flex items-center gap-2 mb-3">
                <span className={`text-xs px-2 py-1 rounded-full ${
                  selectedProperty.listing_type === 'sale' 
                    ? 'bg-red-100 text-red-600' 
                    : 'bg-blue-100 text-blue-600'
                }`}>
                  {selectedProperty.listing_type === 'sale' ? 'For Sale' : 'For Rent'}
                </span>
                <span className="text-xs text-gray-500 capitalize">{selectedProperty.property_type}</span>
              </div>
              
              <div className="flex items-center gap-4 mb-3 text-gray-500">
                {selectedProperty.bedrooms > 0 && (
                  <div className="flex items-center gap-1">🛏️ {selectedProperty.bedrooms}</div>
                )}
                {selectedProperty.bathrooms > 0 && (
                  <div className="flex items-center gap-1">🚿 {selectedProperty.bathrooms}</div>
                )}
                {selectedProperty.sqft > 0 && (
                  <div className="flex items-center gap-1">📐 {selectedProperty.sqft} sqft</div>
                )}
              </div>
              
              <p className="text-gray-600 mb-4">📍 {selectedProperty.address}</p>
              
              <button className="w-full py-3 bg-gradient-to-r from-teal-600 to-emerald-600 text-white rounded-lg font-semibold hover:shadow-md transition">
                Contact Agent
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-slide-up {
          animation: slideUp 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default MapTestPage;