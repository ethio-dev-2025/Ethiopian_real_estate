// src/components/wizard/EditListingWizard.jsx
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Home, MapPin, DollarSign, Bed, Bath, Square, Upload,
  ChevronRight, ChevronLeft, Sparkles, Eye, X, Star, CheckCircle,
  Wifi, Wind, Thermometer, Coffee, Dumbbell, Tv,
  Microwave, Refrigerator, Car, Activity, Lock,
  TreePine, Heart, Zap, Sofa, Loader, Droplet,
  Phone, Mail, Calendar, Trash2, Image, Save
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

const API_URL = 'http://localhost:8000';

const EditListingWizard = ({ listingId, onSuccess, onCancel }) => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [originalListing, setOriginalListing] = useState(null);
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    title: '',
    property_type: 'house',
    price: '',
    listing_type: 'sale',
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

  const [existingImages, setExistingImages] = useState([]);
  const [newImages, setNewImages] = useState([]);
  const [coverImageIndex, setCoverImageIndex] = useState(0);
  const [removedImageUrls, setRemovedImageUrls] = useState([]);

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

  // Fetch listing data on mount
  useEffect(() => {
    fetchListing();
  }, [listingId]);

  const fetchListing = async () => {
    setFetchLoading(true);
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${API_URL}/api/listings/${listingId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch listing');
      }
      
      const data = await response.json();
      setOriginalListing(data);
      
      // Parse images
      let imagesList = [];
      if (data.images) {
        try {
          imagesList = typeof data.images === 'string' ? JSON.parse(data.images) : data.images;
        } catch (e) {
          imagesList = [];
        }
      }
      
      // Parse amenities
      let amenitiesList = [];
      if (data.amenities) {
        try {
          amenitiesList = typeof data.amenities === 'string' ? JSON.parse(data.amenities) : data.amenities;
        } catch (e) {
          amenitiesList = [];
        }
      }
      
      // Set existing images with URLs
      const existingImagesList = imagesList.map((url, idx) => ({
        id: `existing-${idx}`,
        url: url,
        preview: url.startsWith('http') ? url : `${API_URL}${url}`,
        isExisting: true
      }));
      
      setExistingImages(existingImagesList);
      
      // Find cover image index
      if (data.cover_image) {
        const coverIdx = imagesList.findIndex(img => img === data.cover_image);
        if (coverIdx !== -1) {
          setCoverImageIndex(coverIdx);
        }
      }
      
      // Set form data
      setFormData({
        title: data.title || '',
        property_type: data.property_type || 'house',
        price: data.price || '',
        listing_type: data.listing_type || 'sale',
        bedrooms: data.bedrooms || '',
        bathrooms: data.bathrooms || '',
        sqft: data.sqft || '',
        year_built: data.year_built || '',
        address: data.address || '',
        city: data.city || '',
        region: data.region || '',
        sub_city: data.sub_city || '',
        kebele: data.kebele || '',
        description: data.description || '',
        amenities: amenitiesList,
        phone_number: data.phone_number || '',
        email: data.email || ''
      });
      
    } catch (error) {
      console.error('Error fetching listing:', error);
      toast.error('Failed to load listing');
      onCancel();
    } finally {
      setFetchLoading(false);
    }
  };

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

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    const totalImages = existingImages.length + newImages.length + files.length;
    if (totalImages > 20) {
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
      setNewImages(prev => [...prev, { 
        id: Date.now() + Math.random(), 
        preview: previewUrl, 
        file: file,
        isExisting: false
      }]);
    }
    
    setUploadingImages(false);
    e.target.value = '';
    if (files.length > 0) {
      toast.success(`${files.length} image(s) added`);
    }
  };

  const removeExistingImage = (index) => {
    const imageToRemove = existingImages[index];
    if (imageToRemove && imageToRemove.url) {
      setRemovedImageUrls(prev => [...prev, imageToRemove.url]);
    }
    setExistingImages(prev => prev.filter((_, i) => i !== index));
    if (coverImageIndex >= index && coverImageIndex > 0) {
      setCoverImageIndex(coverImageIndex - 1);
    }
  };

  const removeNewImage = (id) => {
    setNewImages(prev => prev.filter(img => img.id !== id));
  };

  const setAsCover = (index, isExisting = true) => {
    if (isExisting) {
      setCoverImageIndex(index);
    } else {
      setCoverImageIndex(existingImages.length + index);
    }
    toast.success('Cover photo selected!');
  };

  const uploadNewImagesToServer = async () => {
    const token = localStorage.getItem('access_token');
    if (!token) return [];
    
    const uploadedUrls = [];
    
    for (const img of newImages) {
      if (img.file) {
        const formDataImg = new FormData();
        formDataImg.append('file', img.file);
        
        try {
          const response = await fetch(`${API_URL}/api/listings/upload-image`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: formDataImg
          });
          
          if (response.ok) {
            const data = await response.json();
            if (data.success && data.url) {
              uploadedUrls.push(data.url);
            }
          }
        } catch (err) {
          console.error('Upload error:', err);
        }
      }
    }
    
    return uploadedUrls;
  };

  const handleUpdate = async (publish = false) => {
    setLoading(true);
    const toastId = toast.loading(publish ? 'Updating and publishing...' : 'Saving changes...');
    
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        toast.error('Please login again', { id: toastId });
        setLoading(false);
        return;
      }
      
      // Upload new images
      const newImageUrls = await uploadNewImagesToServer();
      
      // Combine existing images (excluding removed ones)
      const keptExistingImages = existingImages
        .filter(img => !removedImageUrls.includes(img.url))
        .map(img => img.url);
      
      // Combine all images
      const allImages = [...keptExistingImages, ...newImageUrls];
      
      // Get cover image
      let coverImage = null;
      if (coverImageIndex < keptExistingImages.length) {
        coverImage = keptExistingImages[coverImageIndex];
      } else {
        const newImageIndex = coverImageIndex - keptExistingImages.length;
        if (newImageIndex < newImageUrls.length) {
          coverImage = newImageUrls[newImageIndex];
        }
      }
      
      const imagesJson = allImages.length > 0 ? JSON.stringify(allImages) : null;
      const amenitiesJson = formData.amenities.length > 0 ? JSON.stringify(formData.amenities) : null;
      
      const listingData = {
        title: formData.title,
        property_type: formData.property_type,
        price: parseFloat(formData.price),
        listing_type: formData.listing_type,
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
        cover_image: coverImage,
        amenities: amenitiesJson,
        phone_number: formData.phone_number,
        email: formData.email,
        is_draft: !publish,
        status: publish ? 'active' : 'draft'
      };
      
      const response = await fetch(`${API_URL}/api/listings/${listingId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(listingData)
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        toast.success(publish ? 'Listing published successfully!' : 'Changes saved successfully!', { id: toastId });
        if (onSuccess) {
          onSuccess();
        } else {
          setTimeout(() => navigate('/seller/listings'), 1500);
        }
      } else {
        toast.error(data.detail || 'Failed to update listing', { id: toastId });
      }
    } catch (error) {
      console.error('Update error:', error);
      toast.error(error.message || 'Failed to update listing', { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => {
    if (step === 1 && !formData.title) {
      toast.error('Please enter a title');
      return;
    }
    if (step === 1 && !formData.price) {
      toast.error('Please enter a price');
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

  const allImages = [...existingImages, ...newImages];
  const totalImages = allImages.length;
  const isValid = formData.title && formData.price && formData.address && formData.city && formData.description && totalImages > 0;

  const PreviewModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4" onClick={() => setShowPreview(false)}>
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center">
          <h2 className="text-xl font-bold">Preview Listing</h2>
          <button onClick={() => setShowPreview(false)} className="p-2 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-6">
          <div className="relative h-64 bg-gray-200 rounded-xl mb-4 overflow-hidden">
            {allImages[coverImageIndex] && (
              <img 
                src={allImages[coverImageIndex].preview || (allImages[coverImageIndex].url ? `${API_URL}${allImages[coverImageIndex].url}` : allImages[coverImageIndex].preview)} 
                className="w-full h-full object-cover" 
                alt="Preview"
                onError={(e) => { e.target.src = 'https://via.placeholder.com/800x400?text=No+Image'; }}
              />
            )}
          </div>
          <h2 className="text-2xl font-bold">{formData.title}</h2>
          <p className="text-2xl text-blue-600">ETB {Number(formData.price).toLocaleString()}</p>
          <p className="text-gray-500 mt-2">{formData.address}, {formData.city}</p>
          <div className="flex gap-3 mt-3 text-gray-500">
            <div className="flex items-center gap-1"><Bed className="w-4 h-4" /> {formData.bedrooms || 0} beds</div>
            <div className="flex items-center gap-1"><Bath className="w-4 h-4" /> {formData.bathrooms || 0} baths</div>
            <div className="flex items-center gap-1"><Square className="w-4 h-4" /> {formData.sqft || 0} sqft</div>
          </div>
          <p className="mt-4 text-gray-600">{formData.description}</p>
        </div>
      </div>
    </div>
  );

  if (fetchLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      {showPreview && <PreviewModal />}

      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Edit Listing</h1>
            <p className="text-gray-500 text-sm mt-1">Update your property information</p>
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
              <div>
                <label className="block text-sm font-medium mb-1">Property Title *</label>
                <input name="title" value={formData.title} onChange={handleChange} className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="e.g., Luxury Apartment in Bole" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Listing Type</label>
                  <select name="listing_type" value={formData.listing_type} onChange={handleChange} className="w-full p-3 border rounded-lg">
                    <option value="sale">For Sale</option>
                    <option value="rent">For Rent</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Property Type</label>
                  <select name="property_type" value={formData.property_type} onChange={handleChange} className="w-full p-3 border rounded-lg">
                    {propertyTypes.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{formData.listing_type === 'sale' ? 'Price (ETB)' : 'Rent (ETB/mo)'} *</label>
                <input name="price" type="number" value={formData.price} onChange={handleChange} className="w-full p-3 border rounded-lg" placeholder={formData.listing_type === 'sale' ? "e.g., 15000000" : "e.g., 25000"} />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Bedrooms</label>
                  <input name="bedrooms" type="number" value={formData.bedrooms} onChange={handleChange} className="w-full p-3 border rounded-lg" placeholder="e.g., 3" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Bathrooms</label>
                  <input name="bathrooms" type="number" value={formData.bathrooms} onChange={handleChange} className="w-full p-3 border rounded-lg" placeholder="e.g., 2" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Square Feet</label>
                  <input name="sqft" type="number" value={formData.sqft} onChange={handleChange} className="w-full p-3 border rounded-lg" placeholder="e.g., 2200" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Year Built</label>
                <input name="year_built" type="number" value={formData.year_built} onChange={handleChange} className="w-full p-3 border rounded-lg" placeholder="e.g., 2020" />
              </div>
            </div>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="bg-white rounded-2xl shadow-lg border p-6">
            <h2 className="text-lg font-bold mb-4">Location</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Address *</label>
                <input name="address" value={formData.address} onChange={handleChange} className="w-full p-3 border rounded-lg" placeholder="Street name, building number" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">City *</label>
                  <input name="city" value={formData.city} onChange={handleChange} className="w-full p-3 border rounded-lg" placeholder="e.g., Addis Ababa" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Region</label>
                  <input name="region" value={formData.region} onChange={handleChange} className="w-full p-3 border rounded-lg" placeholder="e.g., Addis Ababa" />
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="bg-white rounded-2xl shadow-lg border p-6">
            <h2 className="text-lg font-bold mb-4">Address Details</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Sub City</label>
                  <input name="sub_city" value={formData.sub_city} onChange={handleChange} className="w-full p-3 border rounded-lg" placeholder="e.g., Bole, Kirkos" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Kebele</label>
                  <input name="kebele" value={formData.kebele} onChange={handleChange} className="w-full p-3 border rounded-lg" placeholder="e.g., Kebele 03" />
                </div>
              </div>
              <div className="bg-blue-50 rounded-lg p-4">
                <p className="text-sm text-blue-700">Complete Address: {formData.address}, {formData.sub_city && `${formData.sub_city}, `}{formData.kebele && `Kebele ${formData.kebele}, `}{formData.city}, {formData.region}</p>
              </div>
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
                  <p className="text-gray-600 text-sm">Click to upload new photos</p>
                  <p className="text-gray-400 text-xs mt-1">Max 20 photos total, up to 10MB each</p>
                  <input ref={fileInputRef} type="file" multiple accept="image/*" onChange={handleImageUpload} className="hidden" />
                </div>
                
                {uploadingImages && (
                  <div className="text-center py-2">
                    <Loader className="w-5 h-5 animate-spin text-blue-600 mx-auto" />
                    <p className="text-xs text-gray-500 mt-1">Uploading...</p>
                  </div>
                )}
                
                {allImages.length > 0 && (
                  <div className="mt-3">
                    <p className="text-sm font-medium mb-2">{allImages.length} photo(s) - Click star to set as cover</p>
                    <div className="grid grid-cols-4 gap-2">
                      {allImages.map((img, idx) => (
                        <div key={img.id || idx} className="relative group">
                          <img 
                            src={img.preview || (img.url ? `${API_URL}${img.url}` : '')} 
                            className="w-full h-20 object-cover rounded-lg" 
                            alt={`Photo ${idx + 1}`}
                            onError={(e) => { e.target.src = 'https://via.placeholder.com/100x100?text=Error'; }}
                          />
                          <div className="absolute inset-0 bg-black bg-opacity-50 rounded-lg opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-1">
                            <button onClick={() => setAsCover(idx, img.isExisting)} className={`p-1 rounded-full ${coverImageIndex === idx ? 'bg-green-600' : 'bg-blue-600'} text-white`} title="Set as cover">
                              <Star className="w-3 h-3" />
                            </button>
                            <button onClick={() => img.isExisting ? removeExistingImage(idx) : removeNewImage(img.id)} className="p-1 bg-red-600 text-white rounded-full" title="Remove">
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                          {coverImageIndex === idx && (
                            <div className="absolute top-0 left-0 bg-yellow-500 text-white text-[10px] px-1 rounded-tl-lg rounded-br-lg">Cover</div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Description *</label>
                <textarea name="description" rows="4" value={formData.description} onChange={handleChange} className="w-full p-3 border rounded-lg" placeholder="Describe your property in detail..." />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Phone Number</label>
                  <input name="phone_number" value={formData.phone_number} onChange={handleChange} className="w-full p-3 border rounded-lg" placeholder="+251 911 111 111" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Email Address</label>
                  <input name="email" type="email" value={formData.email} onChange={handleChange} className="w-full p-3 border rounded-lg" placeholder="contact@property.com" />
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Navigation Buttons */}
      <div className="flex justify-between mt-6">
        {step > 1 && (
          <button onClick={prevStep} className="px-4 py-2 border rounded-lg font-medium flex items-center gap-1 hover:bg-gray-50 transition">
            <ChevronLeft className="w-4 h-4" /> Back
          </button>
        )}
        <div className="flex gap-2 ml-auto">
          {step === 5 && (
            <>
              <button onClick={() => setShowPreview(true)} className="px-4 py-2 border rounded-lg font-medium hover:bg-gray-50 transition flex items-center gap-1">
                <Eye className="w-4 h-4" /> Preview
              </button>
              <button onClick={onCancel} className="px-4 py-2 border border-red-300 text-red-600 rounded-lg font-medium hover:bg-red-50 transition">
                Cancel
              </button>
              <button 
                onClick={() => handleUpdate(false)} 
                disabled={loading || !isValid}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-50 flex items-center gap-1"
              >
                {loading ? <Loader className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save Changes
              </button>
            </>
          )}
          {step < 5 ? (
            <button onClick={nextStep} className="px-5 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 flex items-center gap-1 transition">
              Continue <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            originalListing?.is_draft && (
              <button onClick={() => handleUpdate(true)} disabled={loading || !isValid} className="px-5 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 flex items-center gap-1 transition disabled:opacity-50">
                {loading ? <Loader className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                Publish Listing
              </button>
            )
          )}
        </div>
      </div>
    </div>
  );
};

export default EditListingWizard;