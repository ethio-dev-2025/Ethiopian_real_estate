import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { 
  Store, Home, Shield, Upload, CheckCircle, 
  XCircle, AlertCircle, Eye, Trash2, Plus,
  Building2, UserCheck, Clock, Send, FileText,
  Award, BadgeCheck, Loader, CreditCard,
  ArrowRight
} from 'lucide-react';
import toast from 'react-hot-toast';

const API_URL = import.meta.env.VITE_API_URL?.replace('/api','') || import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

const SellerActivation = () => {
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();
  const [activeRole, setActiveRole] = useState('seller');
  const [loading, setLoading] = useState(false);
  const [activationStatus, setActivationStatus] = useState(null);
  const [statusLoaded, setStatusLoaded] = useState(false);
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
  
  const [sellerFiles, setSellerFiles] = useState({});
  const [landlordFiles, setLandlordFiles] = useState({});
  
  const sellerFileInputRefs = {
    business_license: React.useRef(null),
    ownership_document: React.useRef(null),
    government_id: React.useRef(null)
  };
  
  const landlordFileInputRefs = {
    property_title_deed: React.useRef(null),
    property_tax_clearance: React.useRef(null),
    government_id: React.useRef(null)
  };

  const getToken = () => localStorage.getItem('access_token');

  const fetchActivationStatus = async () => {
    try {
      const token = getToken();
      if (!token) return;
      
      const response = await fetch(`${API_URL}/api/activation/status`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      console.log('📊 SellerActivation - Live Status:', data);
      setActivationStatus(data);
      setStatusLoaded(true);
      
      // ✅ If active, refresh the user object
      if (data.is_activated === true || data.status === 'fully_activated' || data.status === 'active') {
        if (refreshUser) refreshUser().catch(() => {});
      }
    } catch (error) {
      console.error('Error fetching status:', error);
      setStatusLoaded(true);
    }
  };

  useEffect(() => {
    fetchActivationStatus();
    const interval = setInterval(fetchActivationStatus, 30000);
    return () => clearInterval(interval);
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
      if (data.success) return data.url;
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
    setSellerFiles(prev => { const n = { ...prev }; delete n[fieldName]; return n; });
    if (sellerFileInputRefs[fieldName]?.current) sellerFileInputRefs[fieldName].current.value = '';
  };

  const removeLandlordFile = (fieldName) => {
    setLandlordForm(prev => ({ ...prev, [fieldName]: null }));
    setLandlordFiles(prev => { const n = { ...prev }; delete n[fieldName]; return n; });
    if (landlordFileInputRefs[fieldName]?.current) landlordFileInputRefs[fieldName].current.value = '';
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
        phone_number: user?.phone || '',
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
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
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
        phone_number: user?.phone || '',
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
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
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
        phone_number: user?.phone || '',
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
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
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
        phone_number: user?.phone || '',
        property_address: landlordForm.property_address,
        property_type: landlordForm.property_type,
        title_deed: titleDeedUrl,
        tax_clearance: taxClearanceUrl,
        government_id: landlordGovernmentIdUrl,
        reason_for_activation: 'Landlord account activation'
      };
      
      const landlordResponse = await fetch(`${API_URL}/api/activation/submit-request`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
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
    navigate('/dashboard/subscription');
  };

  const handleGoToCreateListing = () => {
    navigate('/dashboard/create-listing');
  };

  const roleOptions = [
    { id: 'seller', name: 'Seller', icon: Store, color: 'blue' },
    { id: 'landlord', name: 'Landlord', icon: Home, color: 'green' },
    { id: 'both', name: 'Both', icon: Shield, color: 'purple' }
  ];

  const propertyTypes = [
    { value: 'apartment', label: 'Apartment' },
    { value: 'house', label: 'House' },
    { value: 'villa', label: 'Villa' },
    { value: 'condo', label: 'Condo' },
    { value: 'commercial', label: 'Commercial' },
    { value: 'land', label: 'Land' }
  ];

  // ✅ LOADING STATE
  if (!statusLoaded) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader className="w-12 h-12 text-primary-600 animate-spin mb-4" />
        <p className="text-gray-500">Checking your account status...</p>
      </div>
    );
  }

  // ✅ SUBMITTED CONFIRMATION
  if (submitted) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border p-8 text-center max-w-md mx-auto">
        <div className="w-20 h-20 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-10 h-10 text-success" />
        </div>
        <h2 className="text-2xl font-bold text-text-primary mb-2">Request Submitted!</h2>
        <p className="text-text-secondary">Your activation request has been submitted. Please wait for admin approval.</p>
      </div>
    );
  }

  // ✅ CASE 1: ACTIVE (Accept any of these combinations)
  const isFullyActive = 
    activationStatus?.status === 'fully_activated' ||
    activationStatus?.status === 'active' ||
    activationStatus?.is_activated === true ||
    activationStatus?.has_active_subscription === true ||
    (activationStatus?.days_remaining || 0) > 0;

  if (isFullyActive) {
    const days = activationStatus?.days_remaining || 0;
    return (
      <div className="bg-white rounded-2xl shadow-sm border p-8 text-center max-w-md mx-auto">
        <div className="w-20 h-20 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <BadgeCheck className="w-10 h-10 text-success" />
        </div>
        <h2 className="text-2xl font-bold text-text-primary mb-2">Account Fully Activated!</h2>
        <p className="text-text-secondary mb-2">
          {days > 0 ? `Your account is fully activated with ${days} days remaining.` : 'Your account is fully activated.'}
        </p>
        <p className="text-text-muted mb-6">You can now create listings.</p>
        <button 
          onClick={handleGoToCreateListing} 
          className="w-full px-6 py-3 bg-gradient-to-r from-success to-green-600 text-white rounded-xl font-semibold hover:shadow-lg transition flex items-center justify-center gap-2"
        >
          Create Your First Listing <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    );
  }

  // ✅ CASE 2: SUBSCRIPTION EXPIRED
  if (activationStatus?.status === 'subscription_expired') {
    return (
      <div className="bg-white rounded-2xl shadow-sm border p-8 text-center max-w-md mx-auto">
        <div className="w-20 h-20 bg-error/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-10 h-10 text-error" />
        </div>
        <h2 className="text-2xl font-bold text-text-primary mb-2">Subscription Expired</h2>
        <p className="text-text-secondary mb-4">Your subscription has expired. Please renew to continue.</p>
        <button 
          onClick={handleGoToSubscription} 
          className="w-full px-6 py-3 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-xl font-semibold hover:shadow-lg transition flex items-center justify-center gap-2"
        >
          <CreditCard className="w-5 h-5" /> Renew Subscription
        </button>
      </div>
    );
  }

  // ✅ CASE 3: DOCUMENTS APPROVED - Show Subscribe button
  if (activationStatus?.status === 'documents_approved') {
    return (
      <div className="bg-white rounded-2xl shadow-sm border p-8 text-center max-w-md mx-auto">
        <div className="w-20 h-20 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-10 h-10 text-success" />
        </div>
        <h2 className="text-2xl font-bold text-text-primary mb-2">Documents Approved!</h2>
        <p className="text-text-secondary mb-4">Your documents have been approved by the admin.</p>
        <p className="text-text-secondary mb-6">Please subscribe to activate your account and start listing properties.</p>
        <button 
          onClick={handleGoToSubscription} 
          className="w-full px-6 py-3 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-xl font-semibold hover:shadow-lg transition flex items-center justify-center gap-2"
        >
          <CreditCard className="w-5 h-5" /> Subscribe Now
        </button>
      </div>
    );
  }

  // ✅ CASE 4: PAYMENT PENDING
  if (activationStatus?.status === 'payment_pending') {
    return (
      <div className="bg-white rounded-2xl shadow-sm border p-8 text-center max-w-md mx-auto">
        <div className="w-20 h-20 bg-warning/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <Clock className="w-10 h-10 text-warning" />
        </div>
        <h2 className="text-2xl font-bold text-text-primary mb-2">Payment Under Review</h2>
        <p className="text-text-secondary mb-4">Your payment is being verified by our admin team.</p>
      </div>
    );
  }

  // ✅ CASE 5: DOCUMENTS PENDING
  if (activationStatus?.status === 'documents_pending') {
    return (
      <div className="bg-white rounded-2xl shadow-sm border p-8 text-center max-w-md mx-auto">
        <div className="w-20 h-20 bg-warning/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <Clock className="w-10 h-10 text-warning" />
        </div>
        <h2 className="text-2xl font-bold text-text-primary mb-2">Documents Under Review</h2>
        <p className="text-text-secondary mb-4">Your documents are being reviewed by our admin team.</p>
      </div>
    );
  }

  // ✅ CASE 6: REJECTED
  if (activationStatus?.status === 'rejected') {
    return (
      <div className="bg-white rounded-2xl shadow-sm border p-8 text-center max-w-md mx-auto">
        <div className="w-20 h-20 bg-error/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <XCircle className="w-10 h-10 text-error" />
        </div>
        <h2 className="text-2xl font-bold text-text-primary mb-2">Request Rejected</h2>
        <p className="text-text-secondary mb-4">{activationStatus.message || 'Your activation request was rejected.'}</p>
        <button onClick={() => window.location.reload()} className="w-full px-6 py-3 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-xl font-semibold">
          Try Again
        </button>
      </div>
    );
  }

  // ✅ CASE 7: NOT SUBMITTED — Show form
  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="bg-gradient-to-r from-primary-800 to-primary-900 p-6 text-white">
          <h1 className="text-2xl font-bold">Account Activation</h1>
          <p className="text-primary-100 mt-1">Activate your seller and/or landlord account</p>
        </div>

        <div className="flex border-b">
          {roleOptions.map((option) => {
            const Icon = option.icon;
            const isActive = activeRole === option.id;
            const colorClasses = {
              blue: 'text-primary-600 border-primary-600 bg-primary-50',
              green: 'text-success border-success bg-green-50',
              purple: 'text-purple-600 border-purple-600 bg-purple-50'
            };
            return (
              <button
                key={option.id}
                onClick={() => setActiveRole(option.id)}
                className={`flex-1 px-4 py-4 text-center font-semibold transition flex items-center justify-center gap-2 ${
                  isActive ? `${colorClasses[option.color]} border-b-2` : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <Icon className="w-5 h-5" /> {option.name}
              </button>
            );
          })}
        </div>

        <div className="p-6 space-y-6">
          <div className="bg-primary-50 rounded-lg p-4 border border-primary-200">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-primary-600" />
              <span className="text-primary-800 font-medium">Please fill all required fields and upload documents</span>
            </div>
          </div>

          {(activeRole === 'seller' || activeRole === 'both') && (
            <div className="space-y-5">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Store className="w-5 h-5 text-primary-600" /> Seller Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-1">Business Name <span className="text-error">*</span></label>
                  <input type="text" name="business_name" value={sellerForm.business_name} onChange={handleSellerChange} className="w-full p-3 border rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Tax ID / TIN <span className="text-error">*</span></label>
                  <input type="text" name="tax_id" value={sellerForm.tax_id} onChange={handleSellerChange} className="w-full p-3 border rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Business License <span className="text-error">*</span></label>
                  <div className="flex items-center gap-2">
                    <input type="file" name="business_license" onChange={handleSellerChange} className="hidden" ref={sellerFileInputRefs.business_license} accept=".pdf,.jpg,.jpeg,.png" />
                    <button type="button" onClick={() => sellerFileInputRefs.business_license.current?.click()} className="flex-1 px-4 py-3 border rounded-lg flex items-center justify-center gap-2">
                      <Upload className="w-4 h-4" /> Upload License
                    </button>
                    {sellerFiles.business_license && <span className="text-success text-sm flex items-center gap-1"><CheckCircle className="w-4 h-4" /> {sellerFiles.business_license}</span>}
                  </div>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-1">Business Address <span className="text-error">*</span></label>
                  <textarea name="business_address" value={sellerForm.business_address} onChange={handleSellerChange} rows="2" className="w-full p-3 border rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Ownership Document <span className="text-error">*</span></label>
                  <div className="flex items-center gap-2">
                    <input type="file" name="ownership_document" onChange={handleSellerChange} className="hidden" ref={sellerFileInputRefs.ownership_document} accept=".pdf,.jpg,.jpeg,.png" />
                    <button type="button" onClick={() => sellerFileInputRefs.ownership_document.current?.click()} className="flex-1 px-4 py-3 border rounded-lg flex items-center justify-center gap-2">
                      <Upload className="w-4 h-4" /> Upload Document
                    </button>
                    {sellerFiles.ownership_document && <span className="text-success text-sm flex items-center gap-1"><CheckCircle className="w-4 h-4" /> {sellerFiles.ownership_document}</span>}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Government ID <span className="text-error">*</span></label>
                  <div className="flex items-center gap-2">
                    <input type="file" name="government_id" onChange={handleSellerChange} className="hidden" ref={sellerFileInputRefs.government_id} accept=".pdf,.jpg,.jpeg,.png" />
                    <button type="button" onClick={() => sellerFileInputRefs.government_id.current?.click()} className="flex-1 px-4 py-3 border rounded-lg flex items-center justify-center gap-2">
                      <Upload className="w-4 h-4" /> Upload ID
                    </button>
                    {sellerFiles.government_id && <span className="text-success text-sm flex items-center gap-1"><CheckCircle className="w-4 h-4" /> {sellerFiles.government_id}</span>}
                  </div>
                </div>
              </div>
            </div>
          )}

          {(activeRole === 'landlord' || activeRole === 'both') && (
            <div className="space-y-5">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Home className="w-5 h-5 text-success" /> Landlord Information
              </h3>
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Property Address <span className="text-error">*</span></label>
                  <input type="text" name="property_address" value={landlordForm.property_address} onChange={handleLandlordChange} className="w-full p-3 border rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Property Type</label>
                  <select name="property_type" value={landlordForm.property_type} onChange={handleLandlordChange} className="w-full p-3 border rounded-lg">
                    {propertyTypes.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Title Deed <span className="text-error">*</span></label>
                  <div className="flex items-center gap-2">
                    <input type="file" name="property_title_deed" onChange={handleLandlordChange} className="hidden" ref={landlordFileInputRefs.property_title_deed} accept=".pdf,.jpg,.jpeg,.png" />
                    <button type="button" onClick={() => landlordFileInputRefs.property_title_deed.current?.click()} className="flex-1 px-4 py-3 border rounded-lg flex items-center justify-center gap-2">
                      <Upload className="w-4 h-4" /> Upload Title Deed
                    </button>
                    {landlordFiles.property_title_deed && <span className="text-success text-sm flex items-center gap-1"><CheckCircle className="w-4 h-4" /> {landlordFiles.property_title_deed}</span>}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Tax Clearance <span className="text-error">*</span></label>
                  <div className="flex items-center gap-2">
                    <input type="file" name="property_tax_clearance" onChange={handleLandlordChange} className="hidden" ref={landlordFileInputRefs.property_tax_clearance} accept=".pdf,.jpg,.jpeg,.png" />
                    <button type="button" onClick={() => landlordFileInputRefs.property_tax_clearance.current?.click()} className="flex-1 px-4 py-3 border rounded-lg flex items-center justify-center gap-2">
                      <Upload className="w-4 h-4" /> Upload Tax Clearance
                    </button>
                    {landlordFiles.property_tax_clearance && <span className="text-success text-sm flex items-center gap-1"><CheckCircle className="w-4 h-4" /> {landlordFiles.property_tax_clearance}</span>}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Government ID <span className="text-error">*</span></label>
                  <div className="flex items-center gap-2">
                    <input type="file" name="government_id" onChange={handleLandlordChange} className="hidden" ref={landlordFileInputRefs.government_id} accept=".pdf,.jpg,.jpeg,.png" />
                    <button type="button" onClick={() => landlordFileInputRefs.government_id.current?.click()} className="flex-1 px-4 py-3 border rounded-lg flex items-center justify-center gap-2">
                      <Upload className="w-4 h-4" /> Upload ID
                    </button>
                    {landlordFiles.government_id && <span className="text-success text-sm flex items-center gap-1"><CheckCircle className="w-4 h-4" /> {landlordFiles.government_id}</span>}
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="bg-yellow-50 rounded-lg p-4">
            <p className="text-sm text-yellow-800 flex items-start gap-2">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <span>All documents are required. After submission, our admin team will review your documents. Once approved, you can subscribe to activate your account.</span>
            </p>
          </div>

          <button onClick={handleSubmit} disabled={loading} className="w-full py-3 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-lg font-semibold flex items-center justify-center gap-2">
            {loading ? <><Loader className="w-5 h-5 animate-spin" /> Submitting...</> : <><Send className="w-5 h-5" /> Submit Activation</>}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SellerActivation;
