// src/pages/public/PropertyDetailPage.jsx - FULL HEIGHT IMAGE GALLERY
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import Header from '../../components/layout/Header';
import { 
  MapPin, Bed, Bath, Square, Calendar, Heart, Share2, MessageCircle, Phone, Mail, 
  ArrowLeft, Star, X, UserPlus, LogIn, AlertCircle, ImageOff, 
  ChevronLeft, ChevronRight, Navigation, Maximize2, Home, DollarSign,
  Wifi, Wind, Thermometer, Coffee, Dumbbell, Tv, Microwave, Refrigerator, 
  Car, Lock, TreePine, Zap, Sofa, Activity, Building2, CheckCircle,
  FileText, Grid, List
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
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [showAllImages, setShowAllImages] = useState(false);
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
      let data = null;
      const contentType = response.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        data = await response.json();
      }

      if (response.ok && data && data.success) {
        const conversationId = data.conversation_id;
        toast.success(`Start chatting with ${data.owner_name}`);
        setOpeningChat(false);
        window.location.href = `/dashboard/buyer/messages/${conversationId}`;
      } else {
        if (response.status === 401) {
          localStorage.setItem('chatPropertyId', id);
          localStorage.setItem('openChatAfterLogin', 'true');
          setShowAuthModal(true);
        } else if (response.status === 404) {
          toast.error('Property or owner not found');
        } else if (data && data.error) {
          toast.error(data.error);
        } else {
          toast.error('Unable to start conversation');
        }
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

  // Image Gallery Modal
  const ImageGalleryModal = () => {
    if (!showAllImages) return null;
    
    const allImages = property?.images || [];
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-95 z-50 flex flex-col">
        <div className="flex justify-between items-center p-4 bg-black/80">
          <h3 className="text-white font-semibold">All Photos ({allImages.length})</h3>
          <button onClick={() => setShowAllImages(false)} className="text-white p-2 hover:bg-white/20 rounded-lg">
            <X className="w-6 h-6" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 max-w-6xl mx-auto">
            {allImages.map((img, idx) => (
              <div 
                key={idx} 
                className="relative aspect-video bg-gray-800 rounded-lg overflow-hidden cursor-pointer hover:scale-105 transition-transform"
                onClick={() => {
                  setSelectedImage(idx);
                  setShowAllImages(false);
                }}
              >
                <img 
                  src={getImageUrl(img)} 
                  alt={`Property image ${idx + 1}`}
                  className="w-full h-full object-cover"
                  onError={(e) => { e.target.src = 'https://via.placeholder.com/800x600?text=No+Image'; }}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

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
  const shouldTruncate = description.length > 200;
  const displayedDescription = showFullDescription ? description : description.slice(0, 200);
  const isSold = property?.listing_status === 'sold';
  const isRented = property?.listing_status === 'rented';

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Header />
      {showAuthModal && <AuthModal />}
      <ImageGalleryModal />

      {/* Main Container with 150px padding at the top */}
      <div className="max-w-7xl mx-auto px-4 pt-[150px] pb-8">
        
        {/* Back Button */}
        <button 
          onClick={() => navigate(-1)} 
          className="mb-6 flex items-center gap-2 text-gray-600 hover:text-blue-600 transition"
        >
          <ArrowLeft className="w-5 h-5" /> Back
        </button>

        {/* Two Column Layout with 150px gap - MATCHING FULL HEIGHT */}
        <div className="flex flex-col lg:flex-row gap-[150px]">
          
          {/* LEFT COLUMN - Image Gallery FULL HEIGHT */}
          <div className="w-full lg:w-1/2">
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden h-full flex flex-col">
              
              {/* Main Image - FULL HEIGHT */}
              <div className="relative w-full bg-gradient-to-br from-gray-800 to-gray-900 flex-1 min-h-[500px]">
                {mainImage ? (
                  <img 
                    src={mainImage} 
                    alt={property?.title || 'Property'} 
                    className="w-full h-full object-cover absolute inset-0" 
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
                <div className="absolute top-4 left-4 flex gap-2 z-10">
                  <span className={`px-3 py-1.5 text-sm font-semibold rounded-xl shadow-lg text-white ${property?.listing_type === 'sale' ? 'bg-gradient-to-r from-green-500 to-green-600' : 'bg-gradient-to-r from-blue-500 to-blue-600'}`}>
                    {property?.listing_type === 'sale' ? 'For Sale' : 'For Rent'}
                  </span>
                  {property?.featured && (
                    <span className="px-3 py-1.5 text-sm font-semibold rounded-xl shadow-lg bg-gradient-to-r from-yellow-500 to-orange-500 text-white flex items-center gap-1">
                      <Star className="w-4 h-4" /> Featured
                    </span>
                  )}
                  {isSold && (
                    <span className="px-3 py-1.5 text-sm font-semibold rounded-xl shadow-lg bg-red-600 text-white">
                      SOLD
                    </span>
                  )}
                  {isRented && (
                    <span className="px-3 py-1.5 text-sm font-semibold rounded-xl shadow-lg bg-purple-600 text-white">
                      RENTED
                    </span>
                  )}
                </div>
                
                {/* Navigation Arrows for images */}
                {images.length > 1 && (
                  <>
                    <button 
                      onClick={() => setSelectedImage((prev) => (prev - 1 + images.length) % images.length)} 
                      className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-black/60 hover:bg-black/80 rounded-full text-white transition z-10"
                    >
                      <ChevronLeft className="w-6 h-6" />
                    </button>
                    <button 
                      onClick={() => setSelectedImage((prev) => (prev + 1) % images.length)} 
                      className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-black/60 hover:bg-black/80 rounded-full text-white transition z-10"
                    >
                      <ChevronRight className="w-6 h-6" />
                    </button>
                  </>
                )}
                
                {/* Image Counter and View All Button */}
                {images.length > 0 && (
                  <div className="absolute bottom-4 right-4 flex gap-2 z-10">
                    <div className="px-3 py-1.5 bg-black/60 backdrop-blur-sm rounded-full text-white text-xs">
                      {selectedImage + 1} / {images.length}
                    </div>
                    {images.length > 1 && (
                      <button 
                        onClick={() => setShowAllImages(true)}
                        className="px-3 py-1.5 bg-black/60 backdrop-blur-sm rounded-full text-white text-xs hover:bg-black/80 transition flex items-center gap-1"
                      >
                        <Grid className="w-3 h-3" /> View All
                      </button>
                    )}
                  </div>
                )}
              </div>
              
              {/* Thumbnails */}
              {images.length > 1 && (
                <div className="flex gap-2 p-3 overflow-x-auto bg-gray-100 border-t scrollbar-thin scrollbar-thumb-gray-400">
                  {images.map((img, idx) => (
                    <button 
                      key={idx} 
                      onClick={() => setSelectedImage(idx)} 
                      className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                        selectedImage === idx ? 'border-blue-500 shadow-md ring-2 ring-blue-200' : 'border-transparent opacity-70 hover:opacity-100'
                      }`}
                    >
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
          </div>

          {/* RIGHT COLUMN - Property Info (50% width, matching height) */}
          <div className="w-full lg:w-1/2">
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden h-full flex flex-col">
              <div className="p-5 space-y-4 flex-1 overflow-y-auto">
                
                {/* Title */}
                <h1 className="text-2xl font-bold text-gray-900">{property?.title || 'Loading...'}</h1>
                
                {/* Location */}
                <div className="flex items-center gap-1 text-gray-500">
                  <MapPin className="w-4 h-4 text-red-500" />
                  <span className="text-sm">{property?.address || 'Loading...'}, {property?.city || ''}</span>
                </div>
                
                {/* Price */}
                <div className="flex items-baseline gap-2">
                  <p className="text-2xl font-bold text-blue-600">{formatPrice(property?.price, property?.listing_type)}</p>
                  {property?.listing_type === 'rent' && (
                    <span className="text-sm text-gray-500">/month</span>
                  )}
                </div>

                {/* Property Type Badge */}
                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-full">
                  <Building2 className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-600 capitalize">{property?.property_type || 'Property'}</span>
                </div>

                {/* Key Features Grid - 4 columns */}
                <div className="grid grid-cols-4 gap-2">
                  <div className="text-center p-2 bg-blue-50 rounded-lg">
                    <Bed className="w-4 h-4 text-blue-600 mx-auto mb-1" />
                    <p className="text-lg font-bold text-gray-900">{property?.bedrooms || 0}</p>
                    <p className="text-[10px] text-gray-500">Beds</p>
                  </div>
                  <div className="text-center p-2 bg-green-50 rounded-lg">
                    <Bath className="w-4 h-4 text-green-600 mx-auto mb-1" />
                    <p className="text-lg font-bold text-gray-900">{property?.bathrooms || 0}</p>
                    <p className="text-[10px] text-gray-500">Baths</p>
                  </div>
                  <div className="text-center p-2 bg-purple-50 rounded-lg">
                    <Square className="w-4 h-4 text-purple-600 mx-auto mb-1" />
                    <p className="text-lg font-bold text-gray-900">{property?.sqft?.toLocaleString() || 0}</p>
                    <p className="text-[10px] text-gray-500">Sq Ft</p>
                  </div>
                  <div className="text-center p-2 bg-orange-50 rounded-lg">
                    <Calendar className="w-4 h-4 text-orange-600 mx-auto mb-1" />
                    <p className="text-lg font-bold text-gray-900">{property?.year_built || 'N/A'}</p>
                    <p className="text-[10px] text-gray-500">Year</p>
                  </div>
                </div>

                {/* Description - Compact */}
                <div className="border-t pt-3">
                  <h3 className="font-semibold text-gray-900 text-sm mb-1 flex items-center gap-2">
                    <FileText className="w-3.5 h-3.5 text-blue-600" />
                    Description
                  </h3>
                  <p className="text-gray-600 text-xs leading-relaxed">
                    {displayedDescription}
                    {shouldTruncate && !showFullDescription && '...'}
                  </p>
                  {shouldTruncate && (
                    <button 
                      onClick={() => setShowFullDescription(!showFullDescription)}
                      className="text-blue-600 text-[10px] mt-1 hover:underline"
                    >
                      {showFullDescription ? 'Show less' : 'Read more'}
                    </button>
                  )}
                </div>

                {/* Amenities - Compact */}
                {property?.amenities && property.amenities.length > 0 && (
                  <div className="border-t pt-3">
                    <h3 className="font-semibold text-gray-900 text-sm mb-2 flex items-center gap-2">
                      <CheckCircle className="w-3.5 h-3.5 text-green-600" />
                      Amenities
                    </h3>
                    <div className="flex flex-wrap gap-1.5">
                      {property.amenities.map((feature, idx) => {
                        const Icon = amenityIcons[feature] || Home;
                        return (
                          <span key={idx} className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-700 rounded-lg text-[11px]">
                            <Icon className="w-3 h-3" />
                            {feature}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Location Details - Compact */}
                <div className="border-t pt-3">
                  <h3 className="font-semibold text-gray-900 text-sm mb-1 flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-red-500" />
                    Location Details
                  </h3>
                  <div className="bg-gray-50 rounded-lg p-2 space-y-1">
                    <p className="text-xs text-gray-700"><strong>Address:</strong> {property?.address || 'N/A'}</p>
                    <p className="text-xs text-gray-700"><strong>City:</strong> {property?.city || 'N/A'}</p>
                    {property?.sub_city && (
                      <p className="text-xs text-gray-700"><strong>Sub City:</strong> {property.sub_city}</p>
                    )}
                  </div>
                </div>

                {/* Contact Information - Compact */}
                {property?.phone_number && (
                  <div className="border-t pt-3">
                    <h3 className="font-semibold text-gray-900 text-sm mb-1 flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-green-600" />
                      Contact
                    </h3>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                        <Phone className="w-3.5 h-3.5 text-gray-400" />
                        <span className="text-xs text-gray-700">{property.phone_number}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Contact Owner Button */}
                {!isSold && !isRented && (
                  <div className="pt-2">
                    <button 
                      onClick={handleContactClick} 
                      disabled={openingChat}
                      className="w-full py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold text-sm hover:shadow-lg transition flex items-center justify-center gap-2"
                    >
                      {openingChat ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                          Opening...
                        </>
                      ) : (
                        <>
                          <MessageCircle className="w-4 h-4" />
                          Contact Owner
                        </>
                      )}
                    </button>
                  </div>
                )}

                {/* Sold/Rented Message */}
                {(isSold || isRented) && (
                  <div className="pt-2 text-center p-3 bg-red-50 rounded-xl">
                    <p className="text-red-600 font-semibold text-sm">
                      {isSold ? 'Property SOLD' : 'Property RENTED'}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PropertyDetailPage;