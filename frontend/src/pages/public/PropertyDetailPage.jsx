// src/pages/public/PropertyDetailPage.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import Header from '../../components/layout/Header';
import { 
  MapPin, Bed, Bath, Square, Calendar, Heart, Share2, MessageCircle, Phone, Mail, 
  ArrowLeft, Star, X, UserPlus, LogIn, AlertCircle, ImageOff, 
  ChevronLeft, ChevronRight
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
  const autoOpenProcessedRef = useRef(false);
  const fetchAttemptedRef = useRef(false);
  // NO loading state - show content immediately

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

  // Auto-open chat after login
  useEffect(() => {
    const shouldOpenChat = localStorage.getItem('openChatAfterLogin') === 'true';
    const propertyId = localStorage.getItem('chatPropertyId');
    const token = localStorage.getItem('access_token');
    
    if (shouldOpenChat && propertyId === id && token && !autoOpenProcessedRef.current && property) {
      console.log('Auto-opening chat now!');
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
    console.log('Direct opening chat for property:', id);
    
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
      console.log('Chat API response:', data);
      
      if (response.ok && data.success) {
        const conversationId = data.conversation_id;
        console.log('✅ Got conversationId:', conversationId);
        
        toast.success(`Start chatting with ${data.owner_name}`);
        setOpeningChat(false);
        
        window.location.href = `/dashboard/buyer/messages/${conversationId}`;
      } else {
        console.error('Chat API error:', data);
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
      console.log('No token, showing auth modal for property:', id);
      localStorage.setItem('chatPropertyId', id);
      localStorage.setItem('openChatAfterLogin', 'true');
      setShowAuthModal(true);
      return;
    }
    
    console.log('Token exists, opening chat directly');
    directOpenChat();
  };

  const handleAuthChoice = (action) => {
    setShowAuthModal(false);
    console.log('Auth choice:', action, 'for property:', id);
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

  // Show content immediately, don't wait for property to load
  // Property data loads in background

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex flex-col items-center justify-center h-96">
          <AlertCircle className="w-16 h-16 text-red-400 mb-4" />
          <p className="text-gray-500 text-lg">{error}</p>
          <button 
            onClick={() => navigate('/')} 
            className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  // Show placeholder while property is loading (NO SPINNER, just empty layout)
  const images = property?.images || [];
  const mainImage = getImageUrl(images[selectedImage]) || getImageUrl(property?.cover_image);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      {showAuthModal && <AuthModal />}

      <div className="max-w-7xl mx-auto px-4 py-6 pt-[100px]">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition mb-6">
          <ArrowLeft className="w-5 h-5" /> Back to Properties
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-[150px]">
          {/* LEFT COLUMN - IMAGE GALLERY */}
          <div className="bg-gray-100 rounded-2xl overflow-hidden">
            <div className="relative h-[450px] w-full bg-gray-200">
              {mainImage ? (
                <img 
                  src={mainImage} 
                  alt={property?.title || 'Property'} 
                  className="w-full h-full object-cover" 
                  onError={(e) => { e.target.src = 'https://via.placeholder.com/800x600?text=No+Image'; }} 
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-200">
                  <div className="text-center">
                    <ImageOff className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-500">Loading image...</p>
                  </div>
                </div>
              )}
              
              <div className="absolute top-4 left-4 flex gap-2">
                <span className={`px-3 py-1 text-sm font-medium rounded-full text-white ${property?.listing_type === 'sale' ? 'bg-green-600' : 'bg-blue-600'}`}>
                  {property?.listing_type === 'sale' ? 'For Sale' : 'For Rent'}
                </span>
                {property?.featured && (
                  <span className="px-3 py-1 text-sm font-medium rounded-full bg-yellow-500 text-white flex items-center gap-1">
                    <Star className="w-3 h-3" /> Featured
                  </span>
                )}
              </div>
              
              <div className="absolute top-4 right-4 flex gap-2">
                <button onClick={handleSaveProperty} className="p-2 bg-white/90 hover:bg-white rounded-full shadow-md transition">
                  <Heart className={`w-5 h-5 ${isSaved ? 'fill-red-500 text-red-500' : 'text-gray-600'}`} />
                </button>
                <button onClick={() => { navigator.clipboard.writeText(window.location.href); toast.success('Link copied!'); }} className="p-2 bg-white/90 hover:bg-white rounded-full shadow-md transition">
                  <Share2 className="w-5 h-5 text-gray-600" />
                </button>
              </div>
              
              {images.length > 1 && (
                <>
                  <button onClick={() => setSelectedImage((prev) => (prev - 1 + images.length) % images.length)} className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-black/50 hover:bg-black/70 rounded-full text-white transition">
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button onClick={() => setSelectedImage((prev) => (prev + 1) % images.length)} className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-black/50 hover:bg-black/70 rounded-full text-white transition">
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </>
              )}
            </div>
            
            {images.length > 1 && (
              <div className="flex gap-2 p-3 overflow-x-auto bg-gray-50">
                {images.map((img, idx) => (
                  <button key={idx} onClick={() => setSelectedImage(idx)} className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition ${selectedImage === idx ? 'border-blue-600' : 'border-transparent'}`}>
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

          {/* RIGHT COLUMN - PROPERTY DETAILS */}
          <div className="bg-white rounded-2xl shadow-sm border p-6">
            <div className="mb-5">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">{property?.title || 'Loading...'}</h1>
              <div className="flex items-center gap-2 text-gray-500">
                <MapPin className="w-4 h-4 text-red-500" />
                <span className="text-sm">{property?.address || 'Loading...'}, {property?.city || ''}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4 bg-gray-100 rounded-xl mb-5">
              <div className="text-center"><Bed className="w-5 h-5 text-blue-600 mx-auto mb-1" /><p className="text-lg font-bold">{property?.bedrooms || 0}</p><p className="text-xs text-gray-500">Bedrooms</p></div>
              <div className="text-center"><Bath className="w-5 h-5 text-blue-600 mx-auto mb-1" /><p className="text-lg font-bold">{property?.bathrooms || 0}</p><p className="text-xs text-gray-500">Bathrooms</p></div>
              <div className="text-center"><Square className="w-5 h-5 text-blue-600 mx-auto mb-1" /><p className="text-lg font-bold">{property?.sqft?.toLocaleString() || 0}</p><p className="text-xs text-gray-500">Sq Ft</p></div>
              <div className="text-center"><Calendar className="w-5 h-5 text-blue-600 mx-auto mb-1" /><p className="text-lg font-bold">{property?.year_built || 'N/A'}</p><p className="text-xs text-gray-500">Year Built</p></div>
            </div>

            <div className="mb-5">
              <h2 className="text-lg font-bold text-gray-900 mb-2">Description</h2>
              <p className="text-gray-600 leading-relaxed text-sm">{property?.description || 'Loading description...'}</p>
            </div>
            
            <div className="text-right mb-5">
              <p className="text-2xl font-bold text-blue-600">{formatPrice(property?.price, property?.listing_type)}</p>
            </div>

            <button 
              onClick={handleContactClick} 
              disabled={openingChat}
              className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg transition flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
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

            {(property?.phone_number || property?.email) && (
              <div className="mt-4 p-4 bg-gray-50 rounded-xl">
                <h3 className="font-semibold text-gray-900 mb-2 text-sm flex items-center gap-2">
                  <Phone className="w-4 h-4 text-green-600" /> Contact Information
                </h3>
                {property?.phone_number && (
                  <a href={`tel:${property.phone_number}`} className="flex items-center gap-3 p-2 hover:bg-white rounded-lg transition mb-1">
                    <Phone className="w-4 h-4 text-green-600" />
                    <div>
                      <p className="text-xs text-gray-500">Call</p>
                      <p className="text-sm font-medium">{property.phone_number}</p>
                    </div>
                  </a>
                )}
                {property?.email && (
                  <a href={`mailto:${property.email}`} className="flex items-center gap-3 p-2 hover:bg-white rounded-lg transition">
                    <Mail className="w-4 h-4 text-blue-600" />
                    <div>
                      <p className="text-xs text-gray-500">Email</p>
                      <p className="text-sm font-medium truncate">{property.email}</p>
                    </div>
                  </a>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PropertyDetailPage;