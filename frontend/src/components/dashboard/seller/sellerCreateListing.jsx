// src/components/dashboard/seller/sellerCreateListing.jsx
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import {
  Home, MapPin, DollarSign, Bed, Bath, Square, Upload,
  ChevronRight, ChevronLeft, Sparkles, Eye, X, Star, CheckCircle,
  Wifi, Wind, Thermometer, Coffee, Dumbbell, Tv,
  Microwave, Refrigerator, Car, Activity, Lock,
  TreePine, Heart, Zap, Sofa, Loader, Droplet,
  Phone, Mail, Calendar, Trash2, Image, Shield, CreditCard
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

const API_URL = 'http://localhost:8000';

// Test users that bypass activation and subscription
const TEST_USERS = ['reduss@gmail.com', 'dani@gmail.com', 'test@example.com', 'reduss'];

const SellerCreateListing = () => {
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();
  const [step, setStep] = useState(1);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [listingType, setListingType] = useState(null);
  const [needsActivation, setNeedsActivation] = useState(false);
  const fileInputRef = useRef(null);
  const hasChecked = useRef(false);

  const [formData, setFormData] = useState({
    title: '',
    property_type: 'house',
    price: '',
    bedrooms: '',
    bathrooms: '',
    sqft: '',
    year_built: '',
    address: '',
    city: '',
    region: '',
    sub_city: '',
    kebele: '',
    description: '',
    amenities: [],
    phone_number: '',
    email: ''
  });

  const [uploadedImages, setUploadedImages] = useState([]);
  const [coverImageIndex, setCoverImageIndex] = useState(0);
  const [imageErrors, setImageErrors] = useState({});

  const propertyTypes = [
    { value: 'house', label: 'House' },
    { value: 'apartment', label: 'Apartment' },
    { value: 'villa', label: 'Villa' },
    { value: 'condo', label: 'Condo' },
    { value: 'townhouse', label: 'Townhouse' },
    { value: 'commercial', label: 'Commercial' }
  ];

  const amenitiesList = [
    { icon: Wifi, name: 'WiFi' },
    { icon: Wind, name: 'Air Conditioning' },
    { icon: Thermometer, name: 'Heating' },
    { icon: Tv, name: 'Cable TV' },
    { icon: Refrigerator, name: 'Refrigerator' },
    { icon: Microwave, name: 'Microwave' },
    { icon: Droplet, name: 'Washing Machine' },
    { icon: Coffee, name: 'Coffee Maker' },
    { icon: Car, name: 'Parking' },
    { icon: Activity, name: 'Swimming Pool' },
    { icon: Dumbbell, name: 'Gym' },
    { icon: Lock, name: 'Security System' },
    { icon: TreePine, name: 'Garden' },
    { icon: Heart, name: 'Pet Friendly' },
    { icon: Sofa, name: 'Furnished' },
    { icon: Zap, name: 'Backup Power' }
  ];

  const isTestUser = () => {
    if (!user) return false;
    return TEST_USERS.includes(user.email) || TEST_USERS.includes(user.username);
  };

  // Check activation status - NO SPINNER, immediate check
  useEffect(() => {
    if (!hasChecked.current) {
      hasChecked.current = true;
      
      const storedUser = localStorage.getItem('user');
      let currentUser = user;
      if (storedUser && !currentUser) {
        try {
          currentUser = JSON.parse(storedUser);
        } catch (e) {}
      }
      
      const isTest = isTestUser();
      if (isTest || currentUser?.is_activated === true) {
        setNeedsActivation(false);
      } else {
        setNeedsActivation(true);
      }
      
      if (refreshUser) {
        refreshUser().catch(() => {});
      }
    }
  }, [user]);

  // Show activation required message
  if (needsActivation) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] p-6">
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center max-w-md">
          <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield className="w-10 h-10 text-yellow-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Account Not Activated</h2>
          <p className="text-gray-600 mb-6">
            Your account is pending admin approval. Please complete the activation process to start listing properties.
          </p>
          <button
            onClick={() => navigate('/activation')}
            className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg transition"
          >
            Go to Activation
          </button>
        </div>
      </div>
    );
  }

  // If no listing type selected
  if (!listingType) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Create New Listing</h1>
          <p className="text-gray-500 text-sm mt-1">Choose listing type</p>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => setListingType('sale')}
            className="bg-white border-2 border-gray-200 rounded-xl py-8 text-center hover:border-green-500 hover:bg-green-50 transition-all duration-300"
          >
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
            <span className="text-lg font-semibold text-gray-900">For Sale</span>
          </button>

          <button
            onClick={() => setListingType('rent')}
            className="bg-white border-2 border-gray-200 rounded-xl py-8 text-center hover:border-blue-500 hover:bg-blue-50 transition-all duration-300"
          >
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <Calendar className="w-6 h-6 text-blue-600" />
            </div>
            <span className="text-lg font-semibold text-gray-900">For Rent</span>
          </button>
        </div>
      </div>
    );
  }

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleAmenityToggle = (amenity) => {
    setFormData(prev => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter(a => a !== amenity)
        : [...prev.amenities, amenity]
    }));
  };

  const handleImageError = (id) => {
    setImageErrors(prev => ({ ...prev, [id]: true }));
  };

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (uploadedImages.length + files.length > 20) {
      toast.error('Maximum 20 photos allowed');
      return;
    }
    
    setUploadingImages(true);
    
    for (const file of files) {
      if (!file.type.startsWith('image/')) {
        toast.error(`${file.name} is not an image`);
        continue;
      }
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`${file.name} is too large. Max 10MB`);
        continue;
      }
      
      const previewUrl = URL.createObjectURL(file);
      setUploadedImages(prev => [...prev, { 
        id: Date.now() + Math.random(), 
        preview: previewUrl, 
        file,
        url: null 
      }]);
    }
    
    setUploadingImages(false);
    e.target.value = '';
    if (files.length > 0) {
      toast.success(`${files.length} image(s) added`);
    }
  };

  const removeImage = (id) => {
    setUploadedImages(prev => prev.filter(p => p.id !== id));
    if (coverImageIndex >= uploadedImages.length - 1 && uploadedImages.length > 1) {
      setCoverImageIndex(Math.max(0, uploadedImages.length - 2));
    }
  };

  const setAsCover = (index) => {
    setCoverImageIndex(index);
    toast.success('Cover photo selected!');
  };

  const uploadImagesToServer = async () => {
    const token = localStorage.getItem('access_token');
    if (!token) return [];
    
    const uploadedImageUrls = [];
    
    for (const img of uploadedImages) {
      if (img.file) {
        const formDataImg = new FormData();
        formDataImg.append('file', img.file);
        
        try {
          const uploadResponse = await fetch(`${API_URL}/api/listings/upload-image`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: formDataImg
          });
          
          if (uploadResponse.ok) {
            const uploadData = await uploadResponse.json();
            if (uploadData.success && uploadData.url) {
              uploadedImageUrls.push(uploadData.url);
            }
          }
        } catch (err) {
          console.error('Upload error:', err);
        }
      }
    }
    return uploadedImageUrls;
  };

  const handleSaveAsDraft = async () => {
    if (!formData.title) {
      toast.error('Please enter a title');
      return;
    }
    
    setIsSavingDraft(true);
    toast.loading('Saving draft...', { id: 'draft-toast' });
    
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        toast.error('Please login again', { id: 'draft-toast' });
        setIsSavingDraft(false);
        return;
      }
      
      let uploadedImageUrls = [];
      if (uploadedImages.length > 0) {
        uploadedImageUrls = await uploadImagesToServer();
      }
      
      const imagesJson = uploadedImageUrls.length > 0 ? JSON.stringify(uploadedImageUrls) : null;
      const amenitiesJson = formData.amenities.length > 0 ? JSON.stringify(formData.amenities) : null;
      
      const listingData = {
        title: formData.title,
        property_type: formData.property_type,
        price: parseFloat(formData.price) || 0,
        listing_type: listingType,
        bedrooms: parseInt(formData.bedrooms) || 0,
        bathrooms: parseInt(formData.bathrooms) || 0,
        sqft: parseFloat(formData.sqft) || 0,
        year_built: formData.year_built ? parseInt(formData.year_built) : null,
        address: formData.address || '',
        city: formData.city || '',
        region: formData.region || '',
        sub_city: formData.sub_city || '',
        kebele: formData.kebele || '',
        description: formData.description || '',
        images: imagesJson,
        cover_image: uploadedImageUrls[coverImageIndex] || (uploadedImageUrls[0] || null),
        amenities: amenitiesJson,
        phone_number: formData.phone_number,
        email: formData.email,
        is_draft: true
      };
      
      const response = await fetch(`${API_URL}/api/listings/create`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(listingData)
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        toast.success('Draft saved successfully!', { id: 'draft-toast' });
        setTimeout(() => navigate('/listings'), 1500);
      } else {
        toast.error(data.detail || 'Failed to save draft', { id: 'draft-toast' });
      }
    } catch (error) {
      console.error('Save draft error:', error);
      toast.error(error.message || 'Failed to save draft', { id: 'draft-toast' });
    } finally {
      setIsSavingDraft(false);
    }
  };

  const handlePublish = async () => {
    const missingFields = [];
    if (!formData.title) missingFields.push('Title');
    if (!formData.price || formData.price <= 0) missingFields.push('Price');
    if (!formData.address) missingFields.push('Address');
    if (!formData.city) missingFields.push('City');
    if (uploadedImages.length === 0) missingFields.push('Photos (at least 1)');
    if (!formData.description) missingFields.push('Description');
    
    if (missingFields.length > 0) {
      toast.error(`Please fill required fields: ${missingFields.join(', ')}`);
      return;
    }
    
    setIsPublishing(true);
    toast.loading('Publishing listing...', { id: 'publish-toast' });
    
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        toast.error('Please login again', { id: 'publish-toast' });
        setIsPublishing(false);
        return;
      }
      
      let uploadedImageUrls = [];
      if (uploadedImages.length > 0) {
        uploadedImageUrls = await uploadImagesToServer();
        if (uploadedImageUrls.length === 0 && uploadedImages.length > 0) {
          toast.error('Failed to upload images. Please try again.', { id: 'publish-toast' });
          setIsPublishing(false);
          return;
        }
      }
      
      const imagesJson = uploadedImageUrls.length > 0 ? JSON.stringify(uploadedImageUrls) : null;
      const amenitiesJson = formData.amenities.length > 0 ? JSON.stringify(formData.amenities) : null;
      
      const listingData = {
        title: formData.title,
        property_type: formData.property_type,
        price: parseFloat(formData.price),
        listing_type: listingType,
        bedrooms: parseInt(formData.bedrooms) || 0,
        bathrooms: parseInt(formData.bathrooms) || 0,
        sqft: parseFloat(formData.sqft) || 0,
        year_built: formData.year_built ? parseInt(formData.year_built) : null,
        address: formData.address,
        city: formData.city,
        region: formData.region || '',
        sub_city: formData.sub_city || '',
        kebele: formData.kebele || '',
        description: formData.description,
        images: imagesJson,
        cover_image: uploadedImageUrls[coverImageIndex] || (uploadedImageUrls[0] || null),
        amenities: amenitiesJson,
        phone_number: formData.phone_number,
        email: formData.email,
        is_draft: false
      };
      
      const response = await fetch(`${API_URL}/api/listings/create`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(listingData)
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        toast.success('Listing published successfully!', { id: 'publish-toast' });
        setTimeout(() => navigate('/listings'), 1500);
      } else {
        const errorMsg = data.detail || data.message || 'Failed to publish listing';
        toast.error(typeof errorMsg === 'string' ? errorMsg : 'Failed to publish', { id: 'publish-toast' });
      }
    } catch (error) {
      console.error('Publish error:', error);
      toast.error(error.message || 'Network error. Please check your connection.', { id: 'publish-toast' });
    } finally {
      setIsPublishing(false);
    }
  };

  const nextStep = () => {
    if (step === 1 && !formData.title) {
      toast.error('Please enter a title');
      return;
    }
    if (step === 1 && (!formData.price || formData.price <= 0)) {
      toast.error('Please enter a valid price');
      return;
    }
    if (step === 2 && !formData.address) {
      toast.error('Please enter an address');
      return;
    }
    if (step === 2 && !formData.city) {
      toast.error('Please enter a city');
      return;
    }
    if (step === 5 && uploadedImages.length === 0) {
      toast.error('Please upload at least one photo');
      return;
    }
    if (step === 5 && !formData.description) {
      toast.error('Please enter a description');
      return;
    }
    setStep(step + 1);
    window.scrollTo(0, 0);
  };

  const prevStep = () => {
    setStep(step - 1);
    window.scrollTo(0, 0);
  };

  const progress = ((step - 1) / 4) * 100;

  const PreviewModal = () => {
    const coverImage = uploadedImages[coverImageIndex];
    const hasImageError = coverImage && imageErrors[coverImage.id];
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4" onClick={() => setShowPreview(false)}>
        <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
          <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center">
            <h2 className="text-xl font-bold">Preview Listing</h2>
            <button onClick={() => setShowPreview(false)} className="p-2 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button>
          </div>
          <div className="p-6">
            <div className="relative h-64 bg-gray-200 rounded-xl mb-4 overflow-hidden">
              {coverImage && !hasImageError ? (
                <img 
                  src={coverImage.preview} 
                  className="w-full h-full object-cover" 
                  alt="Preview"
                  onError={() => handleImageError(coverImage.id)}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-r from-gray-200 to-gray-300">
                  <Image className="w-16 h-16 text-gray-400" />
                  <p className="text-gray-500 ml-2">No image preview</p>
                </div>
              )}
            </div>
            <h2 className="text-2xl font-bold">{formData.title || 'Untitled'}</h2>
            <p className="text-2xl text-blue-600 mt-2">ETB {formData.price ? Number(formData.price).toLocaleString() : '0'}</p>
            <p className="text-gray-500 mt-2">{formData.address || 'Address not set'}, {formData.city || 'City not set'}</p>
            <div className="flex gap-3 mt-3 text-gray-500">
              <div className="flex items-center gap-1"><Bed className="w-4 h-4" /> {formData.bedrooms || 0} beds</div>
              <div className="flex items-center gap-1"><Bath className="w-4 h-4" /> {formData.bathrooms || 0} baths</div>
              <div className="flex items-center gap-1"><Square className="w-4 h-4" /> {formData.sqft || 0} sqft</div>
            </div>
            <p className="mt-4 text-gray-600">{formData.description || 'No description provided'}</p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      {showPreview && <PreviewModal />}

      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {listingType === 'sale' ? 'List Property for Sale' : 'List Property for Rent'}
            </h1>
            <p className="text-gray-500 text-sm mt-1">Fill in the details to {listingType === 'sale' ? 'sell' : 'rent'} your property</p>
          </div>
          <div className="text-right">
            <p className="text-sm font-semibold text-blue-600">{Math.round(progress)}% Complete</p>
            <div className="w-32 h-2 bg-gray-200 rounded-full mt-1 overflow-hidden">
              <div className="h-full bg-gradient-to-r from-blue-600 to-purple-600 rounded-full transition-all" style={{ width: `${progress}%` }} />
            </div>
          </div>
        </div>
        
        <div className="flex gap-2 mt-6">
          {['Basic Info', 'Location', 'Address Details', 'Amenities', 'Photos & Contact'].map((label, idx) => (
            <div key={idx} className="flex-1">
              <div className={`h-1 rounded-full ${step > idx ? 'bg-blue-600' : 'bg-gray-200'}`} />
              <div className="flex items-center gap-2 mt-2">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                  step > idx ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'
                }`}>
                  {idx + 1}
                </div>
                <p className={`text-xs font-medium hidden sm:block ${step > idx ? 'text-blue-600' : 'text-gray-400'}`}>{label}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="bg-white rounded-2xl shadow-lg border p-6">
            <h2 className="text-lg font-bold mb-4">Basic Information</h2>
            <div className="space-y-4">
              <div><label className="block text-sm font-medium mb-1">Property Title *</label><input name="title" value={formData.title} onChange={handleChange} className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="e.g., Luxury Apartment in Bole" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium mb-1">Property Type</label><select name="property_type" value={formData.property_type} onChange={handleChange} className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500">{propertyTypes.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}</select></div>
                <div><label className="block text-sm font-medium mb-1">{listingType === 'sale' ? 'Price (ETB)' : 'Rent (ETB/mo)'} *</label><input name="price" type="number" value={formData.price} onChange={handleChange} className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500" /></div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div><label className="block text-sm font-medium mb-1">Bedrooms</label><input name="bedrooms" type="number" value={formData.bedrooms} onChange={handleChange} className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500" /></div>
                <div><label className="block text-sm font-medium mb-1">Bathrooms</label><input name="bathrooms" type="number" value={formData.bathrooms} onChange={handleChange} className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500" /></div>
                <div><label className="block text-sm font-medium mb-1">Square Feet</label><input name="sqft" type="number" value={formData.sqft} onChange={handleChange} className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500" /></div>
              </div>
              <div><label className="block text-sm font-medium mb-1">Year Built</label><input name="year_built" type="number" value={formData.year_built} onChange={handleChange} className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500" /></div>
            </div>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="bg-white rounded-2xl shadow-lg border p-6">
            <h2 className="text-lg font-bold mb-4">Location</h2>
            <div className="space-y-4">
              <div><label className="block text-sm font-medium mb-1">Address *</label><input name="address" value={formData.address} onChange={handleChange} className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium mb-1">City *</label><input name="city" value={formData.city} onChange={handleChange} className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500" /></div>
                <div><label className="block text-sm font-medium mb-1">Region</label><input name="region" value={formData.region} onChange={handleChange} className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500" /></div>
              </div>
            </div>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="bg-white rounded-2xl shadow-lg border p-6">
            <h2 className="text-lg font-bold mb-4">Address Details</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium mb-1">Sub City</label><input name="sub_city" value={formData.sub_city} onChange={handleChange} className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500" /></div>
                <div><label className="block text-sm font-medium mb-1">Kebele</label><input name="kebele" value={formData.kebele} onChange={handleChange} className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500" /></div>
              </div>
              <div className="bg-blue-50 rounded-lg p-4"><p className="text-sm text-blue-700">Complete Address: {formData.address}, {formData.sub_city && `${formData.sub_city}, `}{formData.kebele && `Kebele ${formData.kebele}, `}{formData.city}, {formData.region}</p></div>
            </div>
          </motion.div>
        )}

        {step === 4 && (
          <motion.div key="step4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="bg-white rounded-2xl shadow-lg border p-6">
            <h2 className="text-lg font-bold mb-4">Amenities</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {amenitiesList.map(a => {
                const Icon = a.icon;
                const isSelected = formData.amenities.includes(a.name);
                return (
                  <button key={a.name} type="button" onClick={() => handleAmenityToggle(a.name)} className={`p-2 border rounded-lg flex items-center gap-2 text-sm transition-all ${isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}>
                    <Icon className={`w-4 h-4 ${isSelected ? 'text-blue-600' : 'text-gray-400'}`} />
                    <span className="truncate">{a.name}</span>
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}

        {step === 5 && (
          <motion.div key="step5" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="bg-white rounded-2xl shadow-lg border p-6">
            <h2 className="text-lg font-bold mb-4">Photos & Contact</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Photos *</label>
                <div onClick={() => fileInputRef.current?.click()} className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-blue-500 transition">
                  <Upload className="w-10 h-10 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-600 text-sm">Click to upload photos</p>
                  <p className="text-gray-400 text-xs mt-1">Max 20 photos, up to 10MB each</p>
                  <input ref={fileInputRef} type="file" multiple accept="image/*" onChange={handleImageUpload} className="hidden" />
                </div>
                
                {uploadingImages && (
                  <div className="text-center py-2">
                    <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin inline-block"></div>
                    <p className="text-xs text-gray-500 mt-1 inline ml-2">Uploading...</p>
                  </div>
                )}
                
                {uploadedImages.length > 0 && (
                  <div className="mt-3">
                    <p className="text-sm font-medium mb-2">{uploadedImages.length} photo(s)</p>
                    <div className="grid grid-cols-4 gap-2">
                      {uploadedImages.map((img, idx) => {
                        const hasError = imageErrors[img.id];
                        return (
                          <div key={img.id} className="relative group">
                            {!hasError && img.preview ? (
                              <img 
                                src={img.preview} 
                                className="w-full h-20 object-cover rounded-lg" 
                                alt={`Upload ${idx + 1}`}
                                onError={() => handleImageError(img.id)}
                              />
                            ) : (
                              <div className="w-full h-20 bg-gray-200 rounded-lg flex items-center justify-center">
                                <Image className="w-6 h-6 text-gray-400" />
                              </div>
                            )}
                            <div className="absolute inset-0 bg-black bg-opacity-50 rounded-lg opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-1">
                              <button onClick={() => setAsCover(idx)} className={`p-1 rounded-full ${coverImageIndex === idx ? 'bg-green-600' : 'bg-blue-600'} text-white`}><Star className="w-3 h-3" /></button>
                              <button onClick={() => removeImage(img.id)} className="p-1 bg-red-600 text-white rounded-full"><Trash2 className="w-3 h-3" /></button>
                            </div>
                            {coverImageIndex === idx && <div className="absolute top-0 left-0 bg-yellow-500 text-white text-[10px] px-1 rounded-tl-lg rounded-br-lg">Cover</div>}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              <div><label className="block text-sm font-medium mb-1">Description *</label><textarea name="description" rows="4" value={formData.description} onChange={handleChange} className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="Describe your property in detail..." /></div>

              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium mb-1">Phone Number</label><input name="phone_number" value={formData.phone_number} onChange={handleChange} className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="+251 911 111 111" /></div>
                <div><label className="block text-sm font-medium mb-1">Email Address</label><input name="email" type="email" value={formData.email} onChange={handleChange} className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="contact@property.com" /></div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex justify-between mt-6">
        {step > 1 && <button onClick={prevStep} className="px-4 py-2 border rounded-lg font-medium flex items-center gap-1 hover:bg-gray-50"><ChevronLeft className="w-4 h-4" /> Back</button>}
        <div className="flex gap-2 ml-auto">
          {step === 5 && (
            <>
              <button 
                onClick={handleSaveAsDraft} 
                disabled={isSavingDraft}
                className="px-4 py-2 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition disabled:opacity-50 flex items-center gap-1"
              >
                {isSavingDraft ? (
                  <>
                    <div className="w-4 h-4 border-2 border-gray-600 border-t-transparent rounded-full animate-spin"></div>
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    <span>Save Draft</span>
                  </>
                )}
              </button>
              <button 
                onClick={() => setShowPreview(true)} 
                className="px-4 py-2 border rounded-lg font-medium hover:bg-gray-50 flex items-center gap-1"
              >
                <Eye className="w-4 h-4" /> Preview
              </button>
            </>
          )}
          {step < 5 ? (
            <button onClick={nextStep} className="px-5 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 flex items-center gap-1">
              Continue <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button 
              onClick={handlePublish} 
              disabled={isPublishing}
              className="px-5 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 flex items-center gap-1 disabled:opacity-50"
            >
              {isPublishing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Publishing...</span>
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  <span>Publish Listing</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default SellerCreateListing;