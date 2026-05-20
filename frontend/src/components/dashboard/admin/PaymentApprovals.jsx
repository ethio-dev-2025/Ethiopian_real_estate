// src/components/dashboard/admin/PaymentApprovals.jsx
import React, { useState, useEffect, useRef } from 'react';
import { CheckCircle, XCircle, Clock, Eye, Loader, CreditCard, User, Calendar, Search, RefreshCw, Filter, X } from 'lucide-react';
import toast from 'react-hot-toast';

const API_URL = 'http://localhost:8000';

const PaymentApprovals = () => {
  const [payments, setPayments] = useState([]);
  const [filteredPayments, setFilteredPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const [activeTab, setActiveTab] = useState('pending');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const abortControllerRef = useRef(null);

  useEffect(() => {
    fetchPayments();
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [activeTab]);

  useEffect(() => {
    let filtered = [...payments];
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(p => 
        p.full_name?.toLowerCase().includes(term) ||
        p.email?.toLowerCase().includes(term) ||
        p.phone_number?.includes(term)
      );
    }
    
    setFilteredPayments(filtered);
  }, [payments, searchTerm]);

  const fetchPayments = async () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    const abortController = new AbortController();
    abortControllerRef.current = abortController;
    
    setLoading(true);
    
    try {
      const token = localStorage.getItem('access_token');
      let url = `${API_URL}/api/activation/admin/payments?status=${activeTab}`;
      
      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` },
        signal: abortController.signal
      });
      
      if (!response.ok) throw new Error('Failed to fetch payments');
      
      const data = await response.json();
      setPayments(data);
      setFilteredPayments(data);
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('Error fetching payments:', error);
        toast.error('Failed to load payment requests');
        setPayments([]);
        setFilteredPayments([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleApprovePayment = async (requestId) => {
    setProcessingId(requestId);
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${API_URL}/api/activation/admin/approve-payment/${requestId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast.success('Payment approved! Account activated.');
        fetchPayments();
      } else {
        toast.error(data.detail || 'Failed to approve payment');
      }
    } catch (error) {
      console.error('Error approving payment:', error);
      toast.error('Failed to approve payment');
    } finally {
      setProcessingId(null);
    }
  };

  const handleRejectPayment = async () => {
    if (!rejectionReason.trim()) {
      toast.error('Please provide a reason for rejection');
      return;
    }
    
    setProcessingId(selectedPayment?.id);
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${API_URL}/api/activation/admin/reject-payment/${selectedPayment?.id}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ rejection_reason: rejectionReason })
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast.success('Payment rejected');
        fetchPayments();
        setShowRejectModal(false);
        setRejectionReason('');
        setSelectedPayment(null);
      } else {
        toast.error(data.detail || 'Failed to reject payment');
      }
    } catch (error) {
      console.error('Error rejecting payment:', error);
      toast.error('Failed to reject payment');
    } finally {
      setProcessingId(null);
    }
  };

  const getStatusCounts = () => {
    const pending = payments.filter(p => p.status === 'pending').length;
    const approved = payments.filter(p => p.status === 'approved').length;
    const rejected = payments.filter(p => p.status === 'rejected').length;
    return { pending, approved, rejected, all: payments.length };
  };

  const counts = getStatusCounts();
  
  const tabs = [
    { id: 'pending', label: 'Pending', count: counts.pending, icon: Clock },
    { id: 'approved', label: 'Approved', count: counts.approved, icon: CheckCircle },
    { id: 'rejected', label: 'Rejected', count: counts.rejected, icon: XCircle },
    { id: 'all', label: 'All', count: counts.all, icon: CreditCard },
  ];

  const getStatusBadge = (status) => {
    switch(status) {
      case 'pending':
        return { color: 'bg-yellow-100 text-yellow-700', icon: Clock, label: 'Pending' };
      case 'approved':
        return { color: 'bg-green-100 text-green-700', icon: CheckCircle, label: 'Approved' };
      case 'rejected':
        return { color: 'bg-red-100 text-red-700', icon: XCircle, label: 'Rejected' };
      default:
        return { color: 'bg-gray-100 text-gray-700', icon: Clock, label: status };
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  const DetailsModal = () => {
    if (!selectedPayment) return null;
    const statusBadge = getStatusBadge(selectedPayment.status);
    const StatusIcon = statusBadge.icon;
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center">
            <h2 className="text-xl font-bold">Payment Details</h2>
            <button onClick={() => setShowDetailsModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="p-6 space-y-6">
            {/* User Info */}
            <div className="bg-gray-50 rounded-xl p-4">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <User className="w-5 h-5 text-blue-600" /> User Information
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Full Name</p>
                  <p className="font-medium">{selectedPayment.full_name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="font-medium">{selectedPayment.email}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Phone</p>
                  <p className="font-medium">{selectedPayment.phone_number}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">User ID</p>
                  <p className="font-medium">{selectedPayment.user_id}</p>
                </div>
              </div>
            </div>
            
            {/* Payment Info */}
            <div className="bg-purple-50 rounded-xl p-4">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-purple-600" /> Payment Information
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Plan Type</p>
                  <p className="font-medium capitalize">{selectedPayment.plan_type}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Amount</p>
                  <p className="font-bold text-green-600">ETB {selectedPayment.payment_amount?.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Status</p>
                  <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium ${statusBadge.color}`}>
                    <StatusIcon className="w-3 h-3" /> {statusBadge.label}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Submitted Date</p>
                  <p className="font-medium">{formatDate(selectedPayment.created_at)}</p>
                </div>
              </div>
            </div>
            
            {/* Payment Receipt */}
            {selectedPayment.payment_receipt && (
              <div className="bg-gray-50 rounded-xl p-4">
                <h3 className="font-semibold text-gray-900 mb-3">Payment Receipt</h3>
                <a 
                  href={selectedPayment.payment_receipt} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline flex items-center gap-2"
                >
                  <Eye className="w-4 h-4" /> View Receipt
                </a>
              </div>
            )}
            
            {/* Rejection Reason */}
            {selectedPayment.rejection_reason && (
              <div className="bg-red-50 rounded-xl p-4">
                <h3 className="font-semibold text-red-800 mb-2">Rejection Reason</h3>
                <p className="text-red-700">{selectedPayment.rejection_reason}</p>
              </div>
            )}
            
            {/* Action Buttons */}
            {selectedPayment.status === 'pending' && (
              <div className="flex gap-3 pt-4 border-t">
                <button
                  onClick={() => {
                    setShowDetailsModal(false);
                    handleApprovePayment(selectedPayment.id);
                  }}
                  disabled={processingId === selectedPayment.id}
                  className="flex-1 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition flex items-center justify-center gap-2"
                >
                  {processingId === selectedPayment.id ? <Loader className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                  Approve Payment
                </button>
                <button
                  onClick={() => {
                    setShowDetailsModal(false);
                    setShowRejectModal(true);
                  }}
                  className="flex-1 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition flex items-center justify-center gap-2"
                >
                  <XCircle className="w-4 h-4" /> Reject Payment
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const RejectModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full">
        <div className="border-b p-4 flex justify-between items-center">
          <h3 className="text-xl font-bold">Reject Payment</h3>
          <button onClick={() => { setShowRejectModal(false); setRejectionReason(''); }} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6">
          <p className="text-gray-600 mb-4">Please provide a reason for rejection:</p>
          <textarea 
            value={rejectionReason} 
            onChange={(e) => setRejectionReason(e.target.value)} 
            rows="4" 
            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-red-500" 
            placeholder="Enter rejection reason..."
          />
        </div>
        <div className="border-t p-4 flex gap-3">
          <button onClick={() => { setShowRejectModal(false); setRejectionReason(''); }} className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50 transition">
            Cancel
          </button>
          <button onClick={handleRejectPayment} disabled={!rejectionReason.trim()} className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50">
            Confirm Reject
          </button>
        </div>
      </div>
    </div>
  );

  // Loading skeleton - NO SPINNER, just skeleton
  if (loading && payments.length === 0) {
    return (
      <div className="p-6">
        <div className="mb-6">
          <div className="h-8 bg-gray-200 rounded w-64 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-96"></div>
        </div>
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1 mb-6 w-fit">
          {['Pending', 'Approved', 'Rejected', 'All'].map(tab => (
            <div key={tab} className="px-6 py-2 rounded-lg">
              <div className="h-5 bg-gray-200 rounded w-16"></div>
            </div>
          ))}
        </div>
        <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
          <div className="divide-y">
            {[1, 2, 3].map(i => (
              <div key={i} className="p-6">
                <div className="flex justify-between">
                  <div className="flex-1">
                    <div className="h-6 bg-gray-200 rounded w-48 mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-32"></div>
                  </div>
                  <div className="h-8 bg-gray-200 rounded w-24"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const displayPayments = filteredPayments;

  return (
    <div className="p-6">
      {showDetailsModal && <DetailsModal />}
      {showRejectModal && <RejectModal />}
      
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Payment Approval Queue</h1>
        <p className="text-gray-500">Review and approve subscription payments</p>
      </div>
      
      {/* Search Bar */}
      <div className="flex flex-wrap gap-4 mb-6">
        <div className="flex-1 max-w-md relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search by name, email or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <button
          onClick={fetchPayments}
          className="px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>
      
      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1 mb-6 w-fit flex-wrap">
        {tabs.map((tab) => {
          const TabIcon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-lg font-medium transition flex items-center gap-2 ${
                activeTab === tab.id 
                  ? 'bg-white text-blue-600 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <TabIcon className="w-4 h-4" />
              {tab.label} ({tab.count})
            </button>
          );
        })}
      </div>
      
      {/* Payment List */}
      {displayPayments.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border p-12 text-center">
          <CreditCard className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No {activeTab} payments</h3>
          <p className="text-gray-500">All payment requests have been processed</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
          <div className="divide-y">
            {displayPayments.map((payment) => {
              const statusBadge = getStatusBadge(payment.status);
              const StatusIcon = statusBadge.icon;
              
              return (
                <div key={payment.id} className="p-6 hover:bg-gray-50 transition">
                  <div className="flex flex-wrap justify-between items-start gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2 flex-wrap">
                        <h3 className="font-semibold text-lg">{payment.full_name}</h3>
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium ${statusBadge.color}`}>
                          <StatusIcon className="w-3 h-3" /> {statusBadge.label}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm mb-3">
                        <div>
                          <p className="text-gray-500">Email</p>
                          <p className="font-medium truncate">{payment.email}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Phone</p>
                          <p className="font-medium">{payment.phone_number}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Plan</p>
                          <p className="font-medium capitalize">{payment.plan_type}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Amount</p>
                          <p className="font-bold text-green-600">ETB {payment.payment_amount?.toLocaleString()}</p>
                        </div>
                      </div>
                      
                      {payment.rejection_reason && (
                        <p className="text-sm text-red-600 mt-2">Reason: {payment.rejection_reason}</p>
                      )}
                    </div>
                    
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setSelectedPayment(payment);
                          setShowDetailsModal(true);
                        }}
                        className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition flex items-center gap-1"
                      >
                        <Eye className="w-4 h-4" /> Details
                      </button>
                      
                      {payment.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleApprovePayment(payment.id)}
                            disabled={processingId === payment.id}
                            className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center gap-1 disabled:opacity-50"
                          >
                            {processingId === payment.id ? <Loader className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                            Approve
                          </button>
                          <button
                            onClick={() => {
                              setSelectedPayment(payment);
                              setShowRejectModal(true);
                            }}
                            disabled={processingId === payment.id}
                            className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition flex items-center gap-1"
                          >
                            <XCircle className="w-4 h-4" /> Reject
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentApprovals;