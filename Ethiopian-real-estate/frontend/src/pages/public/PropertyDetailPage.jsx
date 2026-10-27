import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
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
  const [imageErrors, setImageErrors] = useState({});
  const autoOpenProcessedRef = useRef(false);
  const fetchAttemptedRef = useRef(false);
  const [isOwner, setIsOwner] = useState(false);

  useEffect(() => {
    if (id && !fetchAttemptedRef.current) {
      fetchAttemptedRef.current = true;
      fetchProperty();
    }
  }, [id]);

  // Get current user ID from localStorage
  const getCurrentUserId = () => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        return user.id;
      } catch (e) {
        return null;
      }
    }
    return null;
  };

  const fetchProperty = async () => {
    const token = localStorage.getItem('access_token');
    const currentUserId = getCurrentUserId();
    let response = null;
    let data = null;
    
    console.log(`🔍 Fetching property ID: ${id}`);
    
    // Try multiple endpoints in order
    const endpoints = [
      { url: `${API_URL}/api/listings/public/${id}`, requiresAuth: false, name: 'public' },
      { url: `${API_URL}/api/buyer/properties/${id}`, requiresAuth: false, name: 'buyer' },
      { url: `${API_URL}/api/listings/${id}`, requiresAuth: true, name: 'seller' },
    ];
    
    for (const endpoint of endpoints) {
      try {
        const headers = { 'Content-Type': 'application/json' };
        if (endpoint.requiresAuth && token) {
          headers['Authorization'] = `Bearer ${token}`;
        }
        
        console.log(`📡 Trying ${endpoint.name} endpoint: ${endpoint.url}`);
        response = await fetch(endpoint.url, { headers });
        
        if (response.ok) {
          data = await response.json();
          console.log(`✅ Success from ${endpoint.name} endpoint`);
          
          let propertyData = data;
          if (data.listing) propertyData = data.listing;
          if (data.property) propertyData = data.property;
          
          setProperty(propertyData);
          
          if (propertyData.user_id && currentUserId && propertyData.user_id === currentUserId) {
            setIsOwner(true);
            console.log('👤 User is the owner of this property');
          }
          
          setError(null);
          return;
        } else if (response.status === 404) {
          console.log(`❌ ${endpoint.name} endpoint returned 404`);
        } else {
          console.log(`❌ ${endpoint.name} endpoint returned ${response.status}`);
        }
      } catch (err) {
        console.log(`❌ Error on ${endpoint.name} endpoint:`, err);
      }
    }
    
    console.log('❌ All endpoints failed');
    setError('Property not found or you do not have permission to view it.');
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
    if (isOwner) {
      toast.info('This is your own property');
      return;
    }
    
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
    if (type === 'rent') return `ETB ${price.toLocaleString('en-US')}/month`;
    return `ETB ${price.toLocaleString('en-US')}`;
  };

  const getImageUrl = (imagePath) => {
    if (!imagePath) return null;
    if (imagePath.startsWith('http')) return imagePath;
    if (imagePath.startsWith('/uploads')) return `${API_URL}${imagePath}`;
    return `${API_URL}/uploads/listings/${imagePath}`;
  };

  const handleImageError = (imageIndex) => {
    setImageErrors(prev => ({ ...prev, [imageIndex]: true }));
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
          <button onClick={() => handleAuthChoice('register')} className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-700 text-white rounded-xl font-semibold flex items-center justify-center gap-2">
            <UserPlus className="w-5 h-5" /> Create Buyer Account
          </button>
          <button onClick={() => handleAuthChoice('login')} className="w-full py-3 border-2 border-blue-600 text-blue-600 rounded-xl font-semibold flex items-center justify-center gap-2">
            <LogIn className="w-5 h-5" /> Login to Buyer Account
          </button>
        </div>
      </div>
    </div>
  );

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
            {allImages.map((img, idx) => {
              const imageUrl = getImageUrl(img);
              const hasError = imageErrors[idx];
              return (
                <div 
                  key={idx} 
                  className="relative aspect-video bg-gray-800 rounded-lg overflow-hidden cursor-pointer hover:scale-105 transition-transform"
                  onClick={() => {
                    setSelectedImage(idx);
                    setShowAllImages(false);
                  }}
                >
                  {!hasError && imageUrl ? (
                    <img 
                      src={imageUrl} 
                      alt={`Property image ${idx + 1}`}
                      className="w-full h-full object-cover"
                      onError={() => handleImageError(idx)}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-700">
                      <ImageOff className="w-8 h-8 text-gray-400" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="flex flex-col items-center justify-center h-96">
          <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
          <p className="text-gray-500 text-lg">{error}</p>
          <button onClick={() => navigate('/')} className="mt-4 px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-700 text-white rounded-lg hover:shadow-lg transition">
            Go Home
          </button>
        </div>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const images = property?.images || [];
  const mainImageUrl = !imageErrors[selectedImage] ? getImageUrl(images[selectedImage]) : null;
  const fallbackImageUrl = getImageUrl(property?.cover_image);
  const finalImageUrl = mainImageUrl || fallbackImageUrl;
  const description = property?.description || '';
  const shouldTruncate = description.length > 200;
  const displayedDescription = showFullDescription ? description : description.slice(0, 200);
  const isSold = property?.listing_status === 'sold';
  const isRented = property?.listing_status === 'rented';
  const isDraft = property?.is_draft === true;
  const isAvailable = !isSold && !isRented && !isDraft;
  const locationText = property?.sub_city ? `${property.sub_city}, ${property.city}` : (property?.city || 'Location not set');

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {showAuthModal && <AuthModal />}
      <ImageGalleryModal />

      <div className="max-w-7xl mx-auto px-4 pt-8 pb-8">
        
        <button 
          onClick={() => navigate(-1)} 
          className="mb-6 flex items-center gap-2 text-gray-600 hover:text-blue-600 transition"
        >
          <ArrowLeft className="w-5 h-5" /> Back
        </button>

        {isDraft && isOwner && (
          <div className="mb-4 p-3 bg-yellow-100 border border-yellow-400 rounded-lg text-yellow-800 text-center">
            ⚠️ This property is a DRAFT and is not visible to buyers. <button onClick={() => navigate('/dashboard/my-listings')} className="underline font-semibold">Go to My Listings to publish it</button>
          </div>
        )}

        {isDraft && !isOwner && (
          <div className="mb-4 p-3 bg-yellow-100 border border-yellow-400 rounded-lg text-yellow-800 text-center">
            ⚠️ This property is not yet published.
          </div>
        )}

        {/* Equal Height Columns */}
        <div className="flex flex-col lg:flex-row gap-6 items-stretch">
          
          {/* LEFT COLUMN - Image Gallery */}
          <div className="w-full lg:w-1/2 flex">
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col w-full">
              <div className="relative bg-gray-200 flex-1 min-h-[400px]">
                {finalImageUrl && !imageErrors[selectedImage] ? (
                  <img 
                    src={finalImageUrl} 
                    alt={property?.title || 'Property'} 
                    className="w-full h-full object-cover absolute inset-0" 
                    onError={() => handleImageError(selectedImage)} 
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center absolute inset-0">
                    <div className="text-center">
                      <ImageOff className="w-16 h-16 text-gray-400 mx-auto mb-3" />
                      <p className="text-gray-500">No image available</p>
                    </div>
                  </div>
                )}
                
                <div className="absolute top-4 left-4 flex gap-2 z-10 flex-wrap">
                  <span className={`px-3 py-1.5 text-sm font-semibold rounded-xl shadow-lg text-white ${property?.listing_type === 'sale' ? 'bg-gradient-to-r from-green-600 to-green-700' : 'bg-gradient-to-r from-blue-600 to-purple-700'}`}>
                    {property?.listing_type === 'sale' ? 'For Sale' : 'For Rent'}
                  </span>
                  {property?.featured && (
                    <span className="px-3 py-1.5 text-sm font-semibold rounded-xl shadow-lg bg-gradient-to-r from-yellow-500 to-orange-600 text-white flex items-center gap-1">
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
                  {isDraft && (
                    <span className="px-3 py-1.5 text-sm font-semibold rounded-xl shadow-lg bg-yellow-500 text-white">
                      DRAFT
                    </span>
                  )}
                </div>
                
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
              
              {images.length > 1 && (
                <div className="flex gap-2 p-3 overflow-x-auto bg-gray-100 border-t scrollbar-thin scrollbar-thumb-gray-400 flex-shrink-0">
                  {images.map((img, idx) => {
                    const thumbUrl = getImageUrl(img);
                    const isActive = selectedImage === idx;
                    return (
                      <button 
                        key={idx} 
                        onClick={() => setSelectedImage(idx)} 
                        className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                          isActive ? 'border-blue-600 shadow-md ring-2 ring-blue-200' : 'border-transparent opacity-70 hover:opacity-100'
                        }`}
                      >
                        <img 
                          src={thumbUrl} 
                          alt={`Thumbnail ${idx + 1}`} 
                          className="w-full h-full object-cover" 
                          onError={(e) => { e.target.src = 'https://via.placeholder.com/80x80?text=No+Image'; }} 
                        />
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* RIGHT COLUMN - Property Info */}
          <div className="w-full lg:w-1/2 flex">
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col w-full">
              <div className="p-6 space-y-5 flex-1 overflow-y-auto">
                
                <h1 className="text-2xl font-bold text-gray-900">{property?.title}</h1>
                
                <div className="flex items-center gap-2 text-gray-500">
                  <MapPin className="w-4 h-4 text-red-500 flex-shrink-0" />
                  <span className="text-sm">{property?.address}, {locationText}</span>
                </div>
                
                <div className="flex items-baseline gap-2">
                  <p className="text-2xl font-bold text-blue-600">{formatPrice(property?.price, property?.listing_type)}</p>
                  {property?.listing_type === 'rent' && (
                    <span className="text-sm text-gray-500">/month</span>
                  )}
                </div>

                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-full">
                  <Building2 className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-600 capitalize">{property?.property_type || 'Property'}</span>
                </div>

                {/* Key Features Grid */}
                <div className="grid grid-cols-4 gap-3">
                  <div className="text-center p-3 bg-blue-50 rounded-xl">
                    <Bed className="w-5 h-5 text-blue-600 mx-auto mb-1" />
                    <p className="text-xl font-bold text-gray-900">{property?.bedrooms || 0}</p>
                    <p className="text-xs text-gray-500">Beds</p>
                  </div>
                  <div className="text-center p-3 bg-green-50 rounded-xl">
                    <Bath className="w-5 h-5 text-green-600 mx-auto mb-1" />
                    <p className="text-xl font-bold text-gray-900">{property?.bathrooms || 0}</p>
                    <p className="text-xs text-gray-500">Baths</p>
                  </div>
                  <div className="text-center p-3 bg-purple-50 rounded-xl">
                    <Square className="w-5 h-5 text-purple-600 mx-auto mb-1" />
                    <p className="text-xl font-bold text-gray-900">{property?.sqft?.toLocaleString() || 0}</p>
                    <p className="text-xs text-gray-500">Sq Ft</p>
                  </div>
                  <div className="text-center p-3 bg-yellow-50 rounded-xl">
                    <Calendar className="w-5 h-5 text-yellow-600 mx-auto mb-1" />
                    <p className="text-xl font-bold text-gray-900">{property?.year_built || 'N/A'}</p>
                    <p className="text-xs text-gray-500">Year</p>
                  </div>
                </div>

                {/* Description */}
                <div className="border-t pt-4">
                  <h3 className="font-semibold text-gray-900 text-base mb-2 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-blue-600" />
                    Description
                  </h3>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    {displayedDescription}
                    {shouldTruncate && !showFullDescription && '...'}
                  </p>
                  {shouldTruncate && (
                    <button 
                      onClick={() => setShowFullDescription(!showFullDescription)}
                      className="text-blue-600 text-sm mt-2 hover:underline"
                    >
                      {showFullDescription ? 'Show less' : 'Read more'}
                    </button>
                  )}
                </div>

                {/* Amenities */}
                {property?.amenities && property.amenities.length > 0 && (
                  <div className="border-t pt-4">
                    <h3 className="font-semibold text-gray-900 text-base mb-3 flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      Amenities
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {property.amenities.slice(0, 8).map((feature, idx) => {
                        const Icon = amenityIcons[feature] || Home;
                        return (
                          <span key={idx} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-full text-xs">
                            <Icon className="w-3.5 h-3.5" />
                            {feature}
                          </span>
                        );
                      })}
                      {property.amenities.length > 8 && (
                        <span className="inline-flex items-center px-3 py-1.5 bg-gray-100 text-gray-700 rounded-full text-xs">
                          +{property.amenities.length - 8} more
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Location Details */}
                <div className="border-t pt-4">
                  <h3 className="font-semibold text-gray-900 text-base mb-2 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-red-500" />
                    Location Details
                  </h3>
                  <div className="bg-gray-50 rounded-xl p-3 space-y-1">
                    <p className="text-sm text-gray-700"><strong>Address:</strong> {property?.address || 'N/A'}</p>
                    <p className="text-sm text-gray-700"><strong>City:</strong> {property?.city || 'N/A'}</p>
                    {property?.sub_city && (
                      <p className="text-sm text-gray-700"><strong>Sub City:</strong> {property.sub_city}</p>
                    )}
                    {property?.region && (
                      <p className="text-sm text-gray-700"><strong>Region:</strong> {property.region}</p>
                    )}
                  </div>
                </div>

                {/* Contact Information - Only show if not owner */}
                {!isOwner && property?.phone_number && (
                  <div className="border-t pt-4">
                    <h3 className="font-semibold text-gray-900 text-base mb-2 flex items-center gap-2">
                      <Phone className="w-4 h-4 text-green-600" />
                      Contact
                    </h3>
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                      <Phone className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-700">{property.phone_number}</span>
                    </div>
                  </div>
                )}

                {/* Contact Owner Button */}
                {!isOwner && isAvailable && (
                  <div className="pt-2">
                    <button 
                      onClick={handleContactClick} 
                      disabled={openingChat}
                      className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-700 text-white rounded-xl font-semibold text-base hover:shadow-lg transition flex items-center justify-center gap-2"
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
                  </div>
                )}

                {/* Owner Edit Button - Only show to owner */}
                {isOwner && (
                  <div className="pt-2">
                    <button 
                      onClick={() => navigate(`/dashboard/edit-listing/${id}`)} 
                      className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-700 text-white rounded-xl font-semibold text-base hover:shadow-lg transition flex items-center justify-center gap-2"
                    >
                      <Edit className="w-5 h-5" />
                      Edit Listing
                    </button>
                  </div>
                )}

                {/* Sold/Rented Message */}
                {(isSold || isRented) && (
                  <div className="pt-2 text-center p-4 bg-red-50 rounded-xl">
                    <p className="text-red-600 font-semibold text-base">
                      {isSold ? '❌ This property has been SOLD' : '📋 This property has been RENTED'}
                    </p>
                    <p className="text-gray-500 text-sm mt-1">
                      {isSold ? 'It is no longer available for sale.' : 'It is no longer available for rent.'}
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