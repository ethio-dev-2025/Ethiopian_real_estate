// src/pages/public/PropertyDetailPage.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import Header from '../../components/layout/Header';
import PropertyMap from '../../components/maps/PropertyMap';
import { 
  MapPin, Bed, Bath, Square, Calendar, Heart, Share2, MessageCircle, Phone, Mail, 
  ArrowLeft, Star, X, UserPlus, LogIn, AlertCircle, ImageOff, 
  ChevronLeft, ChevronRight, Navigation, Maximize2, Home, DollarSign,
  Wifi, Wind, Thermometer, Coffee, Dumbbell, Tv, Microwave, Refrigerator, 
  Car, Lock, TreePine, Zap, Sofa, Activity, Building2, CheckCircle,
  FileText
} from 'lucide-react';
import toast from 'react-hot-toast';

const API_URL = 'http://localhost:8000';

const PropertyDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [property, setProperty] = useState(null);
  const [error, setError] = useState(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [openingChat, setOpeningChat] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [showFullDescription, setShowFullDescription] = useState(false);
  const autoOpenProcessedRef = useRef(false);
  const fetchAttemptedRef = useRef(false);

  useEffect(() => {
    if (id && !fetchAttemptedRef.current) {
      fetchAttemptedRef.current = true;
      fetchProperty();
    }
  }, [id]);

  const fetchProperty = async () => {
    try {
      console.log('Fetching property with ID:', id);
      const response = await fetch(`${API_URL}/api/buyer/properties/${id}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Property data received:', data);
        setProperty(data);
      } else if (response.status === 404) {
        setError('Property not found');
      } else {
        setError('Failed to load property');
      }
    } catch (err) {
      console.error('Error fetching property:', err);
      setError('Network error. Please try again.');
    }
  };

  useEffect(() => {
    const checkSaved = async () => {
      const token = localStorage.getItem('access_token');
      if (!token || !property?.id) return;
      try {
        const response = await fetch(`${API_URL}/api/buyer/is-saved/${property.id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (response.ok) {
          const data = await response.json();
          setIsSaved(data.saved);
        }
      } catch (error) {}
    };
    checkSaved();
  }, [property?.id]);

  useEffect(() => {
    const shouldOpenChat = localStorage.getItem('openChatAfterLogin') === 'true';
    const propertyId = localStorage.getItem('chatPropertyId');
    const token = localStorage.getItem('access_token');
    
    if (shouldOpenChat && propertyId === id && token && !autoOpenProcessedRef.current && property) {
      autoOpenProcessedRef.current = true;
      localStorage.removeItem('openChatAfterLogin');
      localStorage.removeItem('chatPropertyId');
      
      setTimeout(() => {
        directOpenChat();
      }, 500);
    }
  }, [id, property]);

  const directOpenChat = async () => {
    if (openingChat) return;
    
    setOpeningChat(true);
    
    try {
      const token = localStorage.getItem('access_token');
      
      const response = await fetch(`${API_URL}/api/buyer/property-owner/${id}`, {
        method: 'GET',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        const conversationId = data.conversation_id;
        toast.success(`Start chatting with ${data.owner_name}`);
        setOpeningChat(false);
        window.location.href = `/dashboard/buyer/messages/${conversationId}`;
      } else {
        toast.error(data.error || 'Unable to start conversation');
        setOpeningChat(false);
      }
    } catch (error) {
      console.error('Error opening chat:', error);
      toast.error('Failed to open chat. Please try again.');
      setOpeningChat(false);
    }
  };

  const handleContactClick = () => {
    const token = localStorage.getItem('access_token');
    
    if (!token) {
      localStorage.setItem('chatPropertyId', id);
      localStorage.setItem('openChatAfterLogin', 'true');
      setShowAuthModal(true);
      return;
    }
    
    directOpenChat();
  };

  const handleAuthChoice = (action) => {
    setShowAuthModal(false);
    localStorage.setItem('chatPropertyId', id);
    localStorage.setItem('openChatAfterLogin', 'true');
    
    if (action === 'register') {
      navigate('/buyer/register', { state: { returnTo: id, openContact: true } });
    } else {
      navigate('/buyer/login', { state: { returnTo: id, openContact: true } });
    }
  };

  const handleSaveProperty = async () => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      setShowAuthModal(true);
      return;
    }
    
    try {
      if (isSaved) {
        const response = await fetch(`${API_URL}/api/buyer/unsave-property/${property.id}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` }
        });
        if (response.ok) {
          setIsSaved(false);
          toast.success('Removed from saved');
        }
      } else {
        const response = await fetch(`${API_URL}/api/buyer/save-property/${property.id}`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` }
        });
        if (response.ok) {
          setIsSaved(true);
          toast.success('Saved to favorites');
        }
      }
    } catch (error) {
      toast.error('Failed to save property');
    }
  };

  const formatPrice = (price, type) => {
    if (!price) return 'ETB 0';
    if (type === 'rent') return `ETB ${price.toLocaleString()}/month`;
    if (price >= 10000000) return `ETB ${(price / 10000000).toFixed(1)} Cr`;
    if (price >= 1000000) return `ETB ${(price / 1000000).toFixed(1)} M`;
    return `ETB ${price.toLocaleString()}`;
  };

  const getImageUrl = (imagePath) => {
    if (!imagePath) return null;
    if (imagePath.startsWith('http')) return imagePath;
    if (imagePath.startsWith('/uploads')) return `${API_URL}${imagePath}`;
    return imagePath;
  };

  const amenityIcons = {
    'WiFi': Wifi,
    'Air Conditioning': Wind,
    'Heating': Thermometer,
    'Cable TV': Tv,
    'Refrigerator': Refrigerator,
    'Microwave': Microwave,
    'Washing Machine': Wifi,
    'Coffee Maker': Coffee,
    'Parking': Car,
    'Swimming Pool': Activity,
    'Gym': Dumbbell,
    'Security System': Lock,
    'Garden': TreePine,
    'Pet Friendly': Heart,
    'Furnished': Sofa,
    'Backup Power': Zap
  };

  const AuthModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Contact Property Owner</h2>
          <button onClick={() => setShowAuthModal(false)} className="p-1 hover:bg-gray-100 rounded"><X className="w-5 h-5" /></button>
        </div>
        <p className="text-gray-600 mb-6 text-center">Please create a buyer account to contact the owner</p>
        <div className="space-y-3">
          <button onClick={() => handleAuthChoice('register')} className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold flex items-center justify-center gap-2">
            <UserPlus className="w-5 h-5" /> Create Buyer Account
          </button>
          <button onClick={() => handleAuthChoice('login')} className="w-full py-3 border-2 border-blue-600 text-blue-600 rounded-xl font-semibold flex items-center justify-center gap-2">
            <LogIn className="w-5 h-5" /> Login to Buyer Account
          </button>
        </div>
      </div>
    </div>
  );

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex flex-col items-center justify-center h-96">
          <AlertCircle className="w-16 h-16 text-red-400 mb-4" />
          <p className="text-gray-500 text-lg">{error}</p>
          <button onClick={() => navigate('/')} className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
            Go Home
          </button>
        </div>
      </div>
    );
  }

  const images = property?.images || [];
  const mainImage = getImageUrl(images[selectedImage]) || getImageUrl(property?.cover_image);
  const description = property?.description || '';
  const shouldTruncate = description.length > 300;
  const displayedDescription = showFullDescription ? description : description.slice(0, 300);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Header />
      {showAuthModal && <AuthModal />}

      <div className="max-w-7xl mx-auto px-4 py-6 pt-[90px]">
        {/* Equal Height Columns with 80px gap */}
        <div className="flex flex-col lg:flex-row gap-20">
          
          {/* ========== LEFT COLUMN - Property Details ========== */}
          <div className="flex-1 lg:w-1/2">
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden sticky top-24">
              
              {/* Image Gallery - Added margin-bottom 20px */}
              <div className="mb-5">
                <div className="relative h-[400px] w-full bg-gradient-to-br from-gray-800 to-gray-900">
                  {mainImage ? (
                    <img 
                      src={mainImage} 
                      alt={property?.title || 'Property'} 
                      className="w-full h-full object-cover" 
                      onError={(e) => { e.target.src = 'https://via.placeholder.com/800x600?text=No+Image'; }} 
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <div className="text-center">
                        <ImageOff className="w-16 h-16 text-gray-500 mx-auto mb-3" />
                        <p className="text-gray-400">No image available</p>
                      </div>
                    </div>
                  )}
                  
                  {/* Badges */}
                  <div className="absolute top-4 left-4 flex gap-2">
                    <span className={`px-3 py-1.5 text-sm font-semibold rounded-xl shadow-lg text-white ${property?.listing_type === 'sale' ? 'bg-gradient-to-r from-green-500 to-green-600' : 'bg-gradient-to-r from-blue-500 to-blue-600'}`}>
                      {property?.listing_type === 'sale' ? 'For Sale' : 'For Rent'}
                    </span>
                    {property?.featured && (
                      <span className="px-3 py-1.5 text-sm font-semibold rounded-xl shadow-lg bg-gradient-to-r from-yellow-500 to-orange-500 text-white flex items-center gap-1">
                        <Star className="w-4 h-4" /> Featured
                      </span>
                    )}
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="absolute top-4 right-4 flex gap-2">
                    <button onClick={handleSaveProperty} className="p-2.5 bg-white/95 hover:bg-white rounded-xl shadow-lg transition transform hover:scale-105">
                      <Heart className={`w-5 h-5 ${isSaved ? 'fill-red-500 text-red-500' : 'text-gray-600'}`} />
                    </button>
                    <button onClick={() => { navigator.clipboard.writeText(window.location.href); toast.success('Link copied!'); }} className="p-2.5 bg-white/95 hover:bg-white rounded-xl shadow-lg transition transform hover:scale-105">
                      <Share2 className="w-5 h-5 text-gray-600" />
                    </button>
                  </div>
                  
                  {/* Navigation Arrows */}
                  {images.length > 1 && (
                    <>
                      <button onClick={() => setSelectedImage((prev) => (prev - 1 + images.length) % images.length)} className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-black/60 hover:bg-black/80 rounded-full text-white transition">
                        <ChevronLeft className="w-6 h-6" />
                      </button>
                      <button onClick={() => setSelectedImage((prev) => (prev + 1) % images.length)} className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-black/60 hover:bg-black/80 rounded-full text-white transition">
                        <ChevronRight className="w-6 h-6" />
                      </button>
                    </>
                  )}
                  
                  {/* Image Counter */}
                  {images.length > 1 && (
                    <div className="absolute bottom-4 right-4 px-3 py-1.5 bg-black/60 backdrop-blur-sm rounded-full text-white text-xs">
                      {selectedImage + 1} / {images.length}
                    </div>
                  )}
                </div>
                
                {/* Thumbnails */}
                {images.length > 1 && (
                  <div className="flex gap-2 p-3 overflow-x-auto bg-gray-100 border-b">
                    {images.map((img, idx) => (
                      <button key={idx} onClick={() => setSelectedImage(idx)} className={`flex-shrink-0 w-16 h-16 rounded-xl overflow-hidden border-2 transition-all ${selectedImage === idx ? 'border-blue-500 shadow-md' : 'border-transparent opacity-70 hover:opacity-100'}`}>
                        <img 
                          src={getImageUrl(img)} 
                          alt={`Thumbnail ${idx + 1}`} 
                          className="w-full h-full object-cover" 
                          onError={(e) => { e.target.src = 'https://via.placeholder.com/80x80?text=No+Image'; }} 
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Property Content */}
              <div className="p-6 space-y-6">
                {/* Title & Location */}
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <h1 className="text-2xl font-bold text-gray-900 mb-2">{property?.title || 'Loading...'}</h1>
                      <div className="flex items-center gap-1 text-gray-500">
                        <MapPin className="w-4 h-4 text-red-500" />
                        <span className="text-sm">{property?.address || 'Loading...'}, {property?.city || ''}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-3xl font-bold text-blue-600">{formatPrice(property?.price, property?.listing_type)}</p>
                      {property?.listing_type === 'rent' && (
                        <p className="text-xs text-gray-500">Monthly rent</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Property Type Badge */}
                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-full">
                  <Building2 className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-600 capitalize">{property?.property_type || 'Property'}</span>
                </div>

                {/* Key Features Grid */}
                <div className="grid grid-cols-4 gap-3">
                  <div className="text-center p-3 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl">
                    <Bed className="w-5 h-5 text-blue-600 mx-auto mb-2" />
                    <p className="text-xl font-bold text-gray-900">{property?.bedrooms || 0}</p>
                    <p className="text-xs text-gray-500">Bedrooms</p>
                  </div>
                  <div className="text-center p-3 bg-gradient-to-br from-green-50 to-teal-50 rounded-xl">
                    <Bath className="w-5 h-5 text-green-600 mx-auto mb-2" />
                    <p className="text-xl font-bold text-gray-900">{property?.bathrooms || 0}</p>
                    <p className="text-xs text-gray-500">Bathrooms</p>
                  </div>
                  <div className="text-center p-3 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl">
                    <Square className="w-5 h-5 text-purple-600 mx-auto mb-2" />
                    <p className="text-xl font-bold text-gray-900">{property?.sqft?.toLocaleString() || 0}</p>
                    <p className="text-xs text-gray-500">Sq Ft</p>
                  </div>
                  <div className="text-center p-3 bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl">
                    <Calendar className="w-5 h-5 text-orange-600 mx-auto mb-2" />
                    <p className="text-xl font-bold text-gray-900">{property?.year_built || 'N/A'}</p>
                    <p className="text-xs text-gray-500">Year Built</p>
                  </div>
                </div>

                {/* Description */}
                <div className="border-t pt-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-blue-600" />
                    Description
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    {displayedDescription}
                    {shouldTruncate && !showFullDescription && '...'}
                  </p>
                  {shouldTruncate && (
                    <button 
                      onClick={() => setShowFullDescription(!showFullDescription)}
                      className="text-blue-600 text-sm mt-2 hover:underline font-medium"
                    >
                      {showFullDescription ? 'Show less' : 'Read more'}
                    </button>
                  )}
                </div>

                {/* Amenities */}
                {property?.features && property.features.length > 0 && (
                  <div className="border-t pt-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      Amenities & Features
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {property.features.map((feature, idx) => {
                        const Icon = amenityIcons[feature] || Home;
                        return (
                          <span key={idx} className="inline-flex items-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-xl text-sm hover:bg-gray-200 transition">
                            <Icon className="w-4 h-4" />
                            {feature}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Contact Information Card */}
                <div className="border-t pt-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Phone className="w-5 h-5 text-green-600" />
                    Contact Information
                  </h3>
                  <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-4 space-y-3">
                    {property?.phone_number && (
                      <div className="flex items-center justify-between p-3 bg-white rounded-lg shadow-sm">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                            <Phone className="w-5 h-5 text-green-600" />
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Phone Number</p>
                            <a href={`tel:${property.phone_number}`} className="font-medium text-gray-900 hover:text-green-600">
                              {property.phone_number}
                            </a>
                          </div>
                        </div>
                        <a href={`tel:${property.phone_number}`} className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 transition">
                          Call
                        </a>
                      </div>
                    )}
                    {property?.email && (
                      <div className="flex items-center justify-between p-3 bg-white rounded-lg shadow-sm">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <Mail className="w-5 h-5 text-blue-600" />
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Email Address</p>
                            <a href={`mailto:${property.email}`} className="font-medium text-gray-900 hover:text-blue-600">
                              {property.email}
                            </a>
                          </div>
                        </div>
                        <a href={`mailto:${property.email}`} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition">
                          Send Email
                        </a>
                      </div>
                    )}
                  </div>
                </div>

                {/* Contact Owner Button */}
                <div className="pt-2">
                  <button 
                    onClick={handleContactClick} 
                    disabled={openingChat}
                    className="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-70 transform hover:scale-[1.02]"
                  >
                    {openingChat ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                        Opening chat...
                      </>
                    ) : (
                      <>
                        <MessageCircle className="w-5 h-5" />
                        Contact Owner
                      </>
                    )}
                  </button>
                  <p className="text-xs text-center text-gray-400 mt-3">
                    Message the owner directly through our secure chat
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* ========== RIGHT COLUMN - Map Only (Same height as left) ========== */}
          <div className="flex-1 lg:w-1/2">
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden sticky top-24 h-full">
              <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Navigation className="w-4 h-4 text-blue-600" />
                    </div>
                    <h3 className="font-semibold text-gray-900">Location Map</h3>
                  </div>
                  <span className="text-xs text-white bg-gradient-to-r from-blue-500 to-purple-500 px-3 py-1 rounded-full shadow-sm">
                    {property?.city || 'Addis Ababa'}
                  </span>
                </div>
              </div>
              
              {/* Map Component - Full height */}
              <div className="h-[calc(100%-120px)] min-h-[500px] w-full">
                <PropertyMap
                  properties={property ? [property] : []}
                  onPropertyClick={() => {}}
                  center={[property?.latitude || 9.03, property?.longitude || 38.74]}
                  zoom={15}
                  height="100%"
                />
              </div>
              
              {/* Address Info Footer */}
              <div className="p-4 bg-gradient-to-r from-gray-50 to-white border-t">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-4 h-4 text-red-500" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Full Address</p>
                    <p className="text-sm font-medium text-gray-900">{property?.address || 'Address not available'}</p>
                    <p className="text-sm text-gray-500 mt-1">{property?.city}, {property?.region || 'Ethiopia'}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default PropertyDetailPage;