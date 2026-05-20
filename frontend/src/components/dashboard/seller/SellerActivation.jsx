// src/components/dashboard/seller/SellerActivation.jsx
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { 
  Store, Home, Shield, Upload, CheckCircle, 
  XCircle, AlertCircle, Eye, Trash2, Plus,
  Building2, UserCheck, Clock, Send, FileText,
  Award, BadgeCheck, Loader, CreditCard
} from 'lucide-react';
import toast from 'react-hot-toast';

const API_URL = 'http://localhost:8000';

const SellerActivation = () => {
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();
  const [activeRole, setActiveRole] = useState('seller');
  const [loading, setLoading] = useState(false);
  const [activationStatus, setActivationStatus] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  
  // Seller form states
  const [sellerForm, setSellerForm] = useState({
    business_name: '',
    tax_id: '',
    business_address: '',
    business_license: null,
    ownership_document: null,
    government_id: null
  });
  
  // Landlord form states
  const [landlordForm, setLandlordForm] = useState({
    property_address: '',
    property_type: 'apartment',
    property_title_deed: null,
    property_tax_clearance: null,
    government_id: null
  });
  
  // File name display states (green text)
  const [sellerFiles, setSellerFiles] = useState({});
  const [landlordFiles, setLandlordFiles] = useState({});
  
  const sellerFileInputRefs = {
    business_license: useRef(null),
    ownership_document: useRef(null),
    government_id: useRef(null)
  };
  
  const landlordFileInputRefs = {
    property_title_deed: useRef(null),
    property_tax_clearance: useRef(null),
    government_id: useRef(null)
  };

  const getToken = () => localStorage.getItem('access_token');

  const fetchActivationStatus = async () => {
    try {
      const token = getToken();
      const response = await fetch(`${API_URL}/api/activation/status`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      console.log('Activation status:', data);
      setActivationStatus(data);
    } catch (error) {
      console.error('Error fetching status:', error);
    }
  };

  useEffect(() => {
    fetchActivationStatus();
  }, []);

  const uploadFileToServer = async (file, documentType) => {
    if (!file) return null;
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('document_type', documentType);
    
    try {
      const token = getToken();
      const response = await fetch(`${API_URL}/api/activation/upload-document`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });
      
      const data = await response.json();
      if (data.success) {
        return data.url;
      }
      return null;
    } catch (error) {
      console.error('Upload error:', error);
      return null;
    }
  };

  const handleSellerChange = (e) => {
    const { name, value, files } = e.target;
    if (files) {
      const file = files[0];
      setSellerForm(prev => ({ ...prev, [name]: file }));
      setSellerFiles(prev => ({ ...prev, [name]: file?.name }));
    } else {
      setSellerForm(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleLandlordChange = (e) => {
    const { name, value, files } = e.target;
    if (files) {
      const file = files[0];
      setLandlordForm(prev => ({ ...prev, [name]: file }));
      setLandlordFiles(prev => ({ ...prev, [name]: file?.name }));
    } else {
      setLandlordForm(prev => ({ ...prev, [name]: value }));
    }
  };

  const removeSellerFile = (fieldName) => {
    setSellerForm(prev => ({ ...prev, [fieldName]: null }));
    setSellerFiles(prev => {
      const newFiles = { ...prev };
      delete newFiles[fieldName];
      return newFiles;
    });
    if (sellerFileInputRefs[fieldName]?.current) {
      sellerFileInputRefs[fieldName].current.value = '';
    }
  };

  const removeLandlordFile = (fieldName) => {
    setLandlordForm(prev => ({ ...prev, [fieldName]: null }));
    setLandlordFiles(prev => {
      const newFiles = { ...prev };
      delete newFiles[fieldName];
      return newFiles;
    });
    if (landlordFileInputRefs[fieldName]?.current) {
      landlordFileInputRefs[fieldName].current.value = '';
    }
  };

  const submitSellerActivation = async () => {
    setLoading(true);
    const toastId = toast.loading('Submitting seller activation...');
    
    try {
      const businessLicenseUrl = await uploadFileToServer(sellerForm.business_license, 'business_license');
      const ownershipDocumentUrl = await uploadFileToServer(sellerForm.ownership_document, 'ownership_document');
      const governmentIdUrl = await uploadFileToServer(sellerForm.government_id, 'government_id');
      
      const requestData = {
        full_name: user?.full_name || '',
        email: user?.email || '',
        phone_number: sellerForm.phone_number || user?.phone || '',
        property_address: sellerForm.business_address,
        property_type: 'commercial',
        business_name: sellerForm.business_name,
        tax_id: sellerForm.tax_id,
        business_license: businessLicenseUrl,
        ownership_document: ownershipDocumentUrl,
        government_id: governmentIdUrl,
        reason_for_activation: 'Seller account activation'
      };
      
      const token = getToken();
      const response = await fetch(`${API_URL}/api/activation/submit-request`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestData)
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        toast.success('Seller activation submitted successfully!', { id: toastId });
        setSubmitted(true);
        fetchActivationStatus();
        setTimeout(() => setSubmitted(false), 3000);
      } else {
        toast.error(data.detail || 'Failed to submit seller activation', { id: toastId });
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to submit seller activation', { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  const submitLandlordActivation = async () => {
    setLoading(true);
    const toastId = toast.loading('Submitting landlord activation...');
    
    try {
      const titleDeedUrl = await uploadFileToServer(landlordForm.property_title_deed, 'title_deed');
      const taxClearanceUrl = await uploadFileToServer(landlordForm.property_tax_clearance, 'tax_clearance');
      const governmentIdUrl = await uploadFileToServer(landlordForm.government_id, 'government_id');
      
      const requestData = {
        full_name: user?.full_name || '',
        email: user?.email || '',
        phone_number: landlordForm.phone_number || user?.phone || '',
        property_address: landlordForm.property_address,
        property_type: landlordForm.property_type,
        title_deed: titleDeedUrl,
        tax_clearance: taxClearanceUrl,
        government_id: governmentIdUrl,
        reason_for_activation: 'Landlord account activation'
      };
      
      const token = getToken();
      const response = await fetch(`${API_URL}/api/activation/submit-request`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestData)
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        toast.success('Landlord activation submitted successfully!', { id: toastId });
        setSubmitted(true);
        fetchActivationStatus();
        setTimeout(() => setSubmitted(false), 3000);
      } else {
        toast.error(data.detail || 'Failed to submit landlord activation', { id: toastId });
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to submit landlord activation', { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  const submitBothActivation = async () => {
    setLoading(true);
    const toastId = toast.loading('Submitting both seller and landlord activation...');
    
    try {
      const businessLicenseUrl = await uploadFileToServer(sellerForm.business_license, 'business_license');
      const ownershipDocumentUrl = await uploadFileToServer(sellerForm.ownership_document, 'ownership_document');
      const sellerGovernmentIdUrl = await uploadFileToServer(sellerForm.government_id, 'government_id');
      
      const sellerRequestData = {
        full_name: user?.full_name || '',
        email: user?.email || '',
        phone_number: sellerForm.phone_number || user?.phone || '',
        property_address: sellerForm.business_address,
        property_type: 'commercial',
        business_name: sellerForm.business_name,
        tax_id: sellerForm.tax_id,
        business_license: businessLicenseUrl,
        ownership_document: ownershipDocumentUrl,
        government_id: sellerGovernmentIdUrl,
        reason_for_activation: 'Seller account activation'
      };
      
      const token = getToken();
      const sellerResponse = await fetch(`${API_URL}/api/activation/submit-request`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(sellerRequestData)
      });
      
      const sellerData = await sellerResponse.json();
      
      if (!sellerResponse.ok || !sellerData.success) {
        toast.error('Seller activation failed', { id: toastId });
        setLoading(false);
        return;
      }
      
      const titleDeedUrl = await uploadFileToServer(landlordForm.property_title_deed, 'title_deed');
      const taxClearanceUrl = await uploadFileToServer(landlordForm.property_tax_clearance, 'tax_clearance');
      const landlordGovernmentIdUrl = await uploadFileToServer(landlordForm.government_id, 'government_id');
      
      const landlordRequestData = {
        full_name: user?.full_name || '',
        email: user?.email || '',
        phone_number: landlordForm.phone_number || user?.phone || '',
        property_address: landlordForm.property_address,
        property_type: landlordForm.property_type,
        title_deed: titleDeedUrl,
        tax_clearance: taxClearanceUrl,
        government_id: landlordGovernmentIdUrl,
        reason_for_activation: 'Landlord account activation'
      };
      
      const landlordResponse = await fetch(`${API_URL}/api/activation/submit-request`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(landlordRequestData)
      });
      
      const landlordData = await landlordResponse.json();
      
      if (landlordResponse.ok && landlordData.success) {
        toast.success('Both seller and landlord activation submitted successfully!', { id: toastId });
        setSubmitted(true);
        fetchActivationStatus();
        setTimeout(() => setSubmitted(false), 3000);
      } else {
        toast.error('Landlord activation failed', { id: toastId });
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to submit activations', { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = () => {
    if (activeRole === 'seller') {
      if (!sellerForm.business_name || !sellerForm.tax_id || !sellerForm.business_address) {
        toast.error('Please fill all required fields');
        return;
      }
      if (!sellerForm.business_license || !sellerForm.ownership_document || !sellerForm.government_id) {
        toast.error('Please upload all required documents');
        return;
      }
      submitSellerActivation();
    } else if (activeRole === 'landlord') {
      if (!landlordForm.property_address) {
        toast.error('Please fill all required fields');
        return;
      }
      if (!landlordForm.property_title_deed || !landlordForm.property_tax_clearance || !landlordForm.government_id) {
        toast.error('Please upload all required documents');
        return;
      }
      submitLandlordActivation();
    } else if (activeRole === 'both') {
      if (!sellerForm.business_name || !sellerForm.tax_id || !sellerForm.business_address) {
        toast.error('Please fill all seller fields');
        return;
      }
      if (!sellerForm.business_license || !sellerForm.ownership_document || !sellerForm.government_id) {
        toast.error('Please upload all seller documents');
        return;
      }
      if (!landlordForm.property_address) {
        toast.error('Please fill landlord property address');
        return;
      }
      if (!landlordForm.property_title_deed || !landlordForm.property_tax_clearance || !landlordForm.government_id) {
        toast.error('Please upload all landlord documents');
        return;
      }
      submitBothActivation();
    }
  };

  const handleGoToSubscription = () => {
    navigate('/subscription');
  };

  const roleOptions = [
    { id: 'seller', name: 'Seller', icon: Store, color: 'blue', description: 'List properties for sale' },
    { id: 'landlord', name: 'Landlord', icon: Home, color: 'green', description: 'List properties for rent' },
    { id: 'both', name: 'Both', icon: Shield, color: 'purple', description: 'Get both seller and landlord features' }
  ];

  const propertyTypes = [
    { value: 'apartment', label: 'Apartment' },
    { value: 'house', label: 'House' },
    { value: 'villa', label: 'Villa' },
    { value: 'condo', label: 'Condo' },
    { value: 'commercial', label: 'Commercial' },
    { value: 'land', label: 'Land' }
  ];

  if (submitted) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border p-8 text-center max-w-md mx-auto">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-10 h-10 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Request Submitted!</h2>
        <p className="text-gray-600">Your activation request has been submitted. Please wait for admin approval.</p>
        <p className="text-sm text-gray-500 mt-2">You will be notified once approved.</p>
      </div>
    );
  }

  // Show status message based on activation status
  if (activationStatus && activationStatus.status !== 'not_submitted') {
    const getStatusDisplay = () => {
      switch(activationStatus.status) {
        case 'documents_pending':
          return {
            title: 'Documents Under Review',
            message: 'Your documents are being reviewed by our admin team.',
            icon: <Clock className="w-12 h-12 text-yellow-500" />,
            color: 'yellow'
          };
        case 'documents_approved':
          return {
            title: 'Documents Approved!',
            message: 'Your documents have been approved. Please subscribe to activate your account.',
            icon: <CheckCircle className="w-12 h-12 text-green-500" />,
            color: 'green',
            showSubscribeButton: true
          };
        case 'payment_pending':
          return {
            title: 'Payment Under Review',
            message: 'Your payment is being verified by our admin team.',
            icon: <Clock className="w-12 h-12 text-yellow-500" />,
            color: 'yellow'
          };
        case 'fully_activated':
          return {
            title: 'Account Fully Activated!',
            message: 'Your account is now fully activated. You can start creating listings.',
            icon: <BadgeCheck className="w-12 h-12 text-green-500" />,
            color: 'green'
          };
        case 'rejected':
          return {
            title: 'Request Rejected',
            message: activationStatus.message || 'Your activation request was rejected.',
            icon: <XCircle className="w-12 h-12 text-red-500" />,
            color: 'red'
          };
        default:
          return null;
      }
    };

    const statusDisplay = getStatusDisplay();
    
    if (statusDisplay) {
      return (
        <div className="bg-white rounded-2xl shadow-sm border p-8 text-center max-w-md mx-auto">
          <div className="flex justify-center mb-4">{statusDisplay.icon}</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">{statusDisplay.title}</h2>
          <p className="text-gray-600 mb-6">{statusDisplay.message}</p>
          {statusDisplay.showSubscribeButton && (
            <button
              onClick={handleGoToSubscription}
              className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg transition flex items-center justify-center gap-2"
            >
              <CreditCard className="w-5 h-5" /> Subscribe Now
            </button>
          )}
          {activationStatus.status === 'fully_activated' && (
            <button
              onClick={() => navigate('/create-listing')}
              className="w-full px-6 py-3 bg-gradient-to-r from-green-600 to-teal-600 text-white rounded-xl font-semibold hover:shadow-lg transition"
            >
              Create Your First Listing
            </button>
          )}
        </div>
      );
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white">
          <h1 className="text-2xl font-bold">Account Activation</h1>
          <p className="text-blue-100 mt-1">Activate your seller and/or landlord account</p>
        </div>

        {/* Role Selection - 3 Options */}
        <div className="flex border-b">
          {roleOptions.map((option) => {
            const Icon = option.icon;
            const isActive = activeRole === option.id;
            const colorClasses = {
              blue: 'text-blue-600 border-blue-600 bg-blue-50',
              green: 'text-green-600 border-green-600 bg-green-50',
              purple: 'text-purple-600 border-purple-600 bg-purple-50'
            };
            return (
              <button
                key={option.id}
                onClick={() => setActiveRole(option.id)}
                className={`flex-1 px-4 py-4 text-center font-semibold transition flex items-center justify-center gap-2 ${
                  isActive
                    ? `${colorClasses[option.color]} border-b-2`
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <Icon className="w-5 h-5" />
                {option.name}
              </button>
            );
          })}
        </div>

        <div className="p-6 space-y-6">
          {/* Status Banner */}
          {activationStatus && activationStatus.status === 'documents_approved' && (
            <div className="bg-green-50 rounded-lg p-4 border border-green-200">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="text-green-800 font-medium">Documents approved! Please subscribe to activate your account.</span>
              </div>
            </div>
          )}

          {/* Seller Form */}
          {(activeRole === 'seller' || activeRole === 'both') && (
            <div className="space-y-5">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Store className="w-5 h-5 text-blue-600" />
                Seller Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Business Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="business_name"
                    value={sellerForm.business_name}
                    onChange={handleSellerChange}
                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter your business name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tax ID / TIN <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="tax_id"
                    value={sellerForm.tax_id}
                    onChange={handleSellerChange}
                    className="w-full p-3 border rounded-lg"
                    placeholder="Enter your Tax ID"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Business License <span className="text-red-500">*</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="file"
                      name="business_license"
                      onChange={handleSellerChange}
                      className="hidden"
                      ref={sellerFileInputRefs.business_license}
                      accept=".pdf,.jpg,.jpeg,.png"
                    />
                    <button
                      type="button"
                      onClick={() => sellerFileInputRefs.business_license.current?.click()}
                      className="flex-1 px-4 py-3 border rounded-lg text-gray-600 hover:bg-gray-50 flex items-center justify-center gap-2"
                    >
                      <Upload className="w-4 h-4" /> Upload License
                    </button>
                    {sellerFiles.business_license && (
                      <span className="text-green-600 text-sm flex items-center gap-1">
                        <CheckCircle className="w-4 h-4" /> {sellerFiles.business_license}
                      </span>
                    )}
                  </div>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Business Address <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    name="business_address"
                    value={sellerForm.business_address}
                    onChange={handleSellerChange}
                    rows="2"
                    className="w-full p-3 border rounded-lg"
                    placeholder="Enter your business address"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ownership Document <span className="text-red-500">*</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="file"
                      name="ownership_document"
                      onChange={handleSellerChange}
                      className="hidden"
                      ref={sellerFileInputRefs.ownership_document}
                      accept=".pdf,.jpg,.jpeg,.png"
                    />
                    <button
                      type="button"
                      onClick={() => sellerFileInputRefs.ownership_document.current?.click()}
                      className="flex-1 px-4 py-3 border rounded-lg text-gray-600 hover:bg-gray-50 flex items-center justify-center gap-2"
                    >
                      <Upload className="w-4 h-4" /> Upload Document
                    </button>
                    {sellerFiles.ownership_document && (
                      <span className="text-green-600 text-sm flex items-center gap-1">
                        <CheckCircle className="w-4 h-4" /> {sellerFiles.ownership_document}
                      </span>
                    )}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Government ID <span className="text-red-500">*</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="file"
                      name="government_id"
                      onChange={handleSellerChange}
                      className="hidden"
                      ref={sellerFileInputRefs.government_id}
                      accept=".pdf,.jpg,.jpeg,.png"
                    />
                    <button
                      type="button"
                      onClick={() => sellerFileInputRefs.government_id.current?.click()}
                      className="flex-1 px-4 py-3 border rounded-lg text-gray-600 hover:bg-gray-50 flex items-center justify-center gap-2"
                    >
                      <Upload className="w-4 h-4" /> Upload ID
                    </button>
                    {sellerFiles.government_id && (
                      <span className="text-green-600 text-sm flex items-center gap-1">
                        <CheckCircle className="w-4 h-4" /> {sellerFiles.government_id}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Landlord Form */}
          {(activeRole === 'landlord' || activeRole === 'both') && (
            <div className="space-y-5">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Home className="w-5 h-5 text-green-600" />
                Landlord Information
              </h3>
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Property Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="property_address"
                    value={landlordForm.property_address}
                    onChange={handleLandlordChange}
                    className="w-full p-3 border rounded-lg"
                    placeholder="Enter property address"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Property Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="property_type"
                    value={landlordForm.property_type}
                    onChange={handleLandlordChange}
                    className="w-full p-3 border rounded-lg"
                  >
                    {propertyTypes.map(type => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Title Deed <span className="text-red-500">*</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="file"
                      name="property_title_deed"
                      onChange={handleLandlordChange}
                      className="hidden"
                      ref={landlordFileInputRefs.property_title_deed}
                      accept=".pdf,.jpg,.jpeg,.png"
                    />
                    <button
                      type="button"
                      onClick={() => landlordFileInputRefs.property_title_deed.current?.click()}
                      className="flex-1 px-4 py-3 border rounded-lg text-gray-600 hover:bg-gray-50 flex items-center justify-center gap-2"
                    >
                      <Upload className="w-4 h-4" /> Upload Title Deed
                    </button>
                    {landlordFiles.property_title_deed && (
                      <span className="text-green-600 text-sm flex items-center gap-1">
                        <CheckCircle className="w-4 h-4" /> {landlordFiles.property_title_deed}
                      </span>
                    )}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tax Clearance <span className="text-red-500">*</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="file"
                      name="property_tax_clearance"
                      onChange={handleLandlordChange}
                      className="hidden"
                      ref={landlordFileInputRefs.property_tax_clearance}
                      accept=".pdf,.jpg,.jpeg,.png"
                    />
                    <button
                      type="button"
                      onClick={() => landlordFileInputRefs.property_tax_clearance.current?.click()}
                      className="flex-1 px-4 py-3 border rounded-lg text-gray-600 hover:bg-gray-50 flex items-center justify-center gap-2"
                    >
                      <Upload className="w-4 h-4" /> Upload Tax Clearance
                    </button>
                    {landlordFiles.property_tax_clearance && (
                      <span className="text-green-600 text-sm flex items-center gap-1">
                        <CheckCircle className="w-4 h-4" /> {landlordFiles.property_tax_clearance}
                      </span>
                    )}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Government ID <span className="text-red-500">*</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="file"
                      name="government_id"
                      onChange={handleLandlordChange}
                      className="hidden"
                      ref={landlordFileInputRefs.government_id}
                      accept=".pdf,.jpg,.jpeg,.png"
                    />
                    <button
                      type="button"
                      onClick={() => landlordFileInputRefs.government_id.current?.click()}
                      className="flex-1 px-4 py-3 border rounded-lg text-gray-600 hover:bg-gray-50 flex items-center justify-center gap-2"
                    >
                      <Upload className="w-4 h-4" /> Upload ID
                    </button>
                    {landlordFiles.government_id && (
                      <span className="text-green-600 text-sm flex items-center gap-1">
                        <CheckCircle className="w-4 h-4" /> {landlordFiles.government_id}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <div className="bg-yellow-50 rounded-lg p-4">
            <p className="text-sm text-yellow-800 flex items-start gap-2">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <span>All documents are required. After submission, our admin team will review your documents. Once approved, you can subscribe to activate your account.</span>
            </p>
          </div>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold hover:shadow-lg transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader className="w-5 h-5 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <Send className="w-5 h-5" />
                Submit {activeRole === 'both' ? 'Seller & Landlord' : activeRole === 'seller' ? 'Seller' : 'Landlord'} Activation
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SellerActivation;