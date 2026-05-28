// src/components/dashboard/admin/PaymentApprovals.jsx
import React, { useState, useEffect, useRef } from 'react';
import { 
  CheckCircle, XCircle, Clock, Eye, Loader, CreditCard, 
  User, Search, RefreshCw, X, DollarSign, AlertCircle,
  FileText, Download
} from 'lucide-react';
import toast from 'react-hot-toast';

const API_URL = 'http://localhost:8000';

const PaymentApprovals = () => {
  const [payments, setPayments] = useState([]);
  const [filteredPayments, setFilteredPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [processingId, setProcessingId] = useState(null);
  const [activeTab, setActiveTab] = useState('pending');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [stats, setStats] = useState({ pending: 0, approved: 0, rejected: 0 });
  const abortControllerRef = useRef(null);

  useEffect(() => {
    fetchPayments();
    const interval = setInterval(() => fetchPayments(), 15000);
    return () => {
      clearInterval(interval);
      if (abortControllerRef.current) abortControllerRef.current.abort();
    };
  }, [activeTab]);

  useEffect(() => {
    let filtered = [...payments];
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(p => 
        p.user_name?.toLowerCase().includes(term) ||
        p.user_email?.toLowerCase().includes(term) ||
        p.phone_number?.includes(term) ||
        p.transaction_id?.toLowerCase().includes(term)
      );
    }
    setFilteredPayments(filtered);
  }, [payments, searchTerm]);

  const fetchPayments = async () => {
    if (abortControllerRef.current) abortControllerRef.current.abort();
    const abortController = new AbortController();
    abortControllerRef.current = abortController;
    setLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        throw new Error('No authentication token found');
      }
      
      // FIXED: Changed from /api/admin/real-payments to /api/payment/admin/payments
      const url = `${API_URL}/api/payment/admin/payments?status=${activeTab}`;
      console.log('Fetching payments from:', url);
      
      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` },
        signal: abortController.signal
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error:', response.status, errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }
      
      const data = await response.json();
      console.log('📊 Payments received:', data);
      
      setPayments(Array.isArray(data) ? data : []);
      
      const pending = (Array.isArray(data) ? data : []).filter(p => p.status === 'pending').length;
      const approved = (Array.isArray(data) ? data : []).filter(p => p.status === 'approved').length;
      const rejected = (Array.isArray(data) ? data : []).filter(p => p.status === 'rejected').length;
      setStats({ pending, approved, rejected });
      
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('Error fetching payments:', error);
        setError(error.message);
        toast.error('Failed to load payment requests: ' + error.message);
        setPayments([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleApprovePayment = async (paymentId) => {
    setProcessingId(paymentId);
    try {
      const token = localStorage.getItem('access_token');
      // FIXED: Changed from /api/admin/approve-payment to /api/payment/admin/approve-payment
      const response = await fetch(`${API_URL}/api/payment/admin/approve-payment/${paymentId}`, {
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
        toast.error(data.message || 'Failed to approve payment');
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
      // FIXED: Changed from /api/admin/reject-payment to /api/payment/admin/reject-payment
      const response = await fetch(`${API_URL}/api/payment/admin/reject-payment/${selectedPayment?.id}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ reason: rejectionReason })
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast.success('Payment rejected');
        fetchPayments();
        setShowRejectModal(false);
        setRejectionReason('');
        setSelectedPayment(null);
      } else {
        toast.error(data.message || 'Failed to reject payment');
      }
    } catch (error) {
      console.error('Error rejecting payment:', error);
      toast.error('Failed to reject payment');
    } finally {
      setProcessingId(null);
    }
  };

  const handleDownloadReceipt = async (paymentId) => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${API_URL}/api/payment/receipt/${paymentId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        const receipt = data.receipt;
        
        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
          <head>
            <title>Payment Receipt - ${receipt.transaction_id}</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 40px; }
              .receipt { max-width: 600px; margin: 0 auto; border: 1px solid #ddd; padding: 20px; border-radius: 10px; }
              .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 20px; }
              .title { font-size: 24px; font-weight: bold; color: #2563EB; }
              .details { margin: 20px 0; }
              .row { display: flex; justify-content: space-between; margin: 10px 0; }
              .label { font-weight: bold; }
              .footer { text-align: center; margin-top: 30px; padding-top: 10px; border-top: 1px solid #ddd; font-size: 12px; color: #666; }
            </style>
          </head>
          <body>
            <div class="receipt">
              <div class="header">
                <div class="title">EstateHub</div>
                <div>Payment Receipt</div>
              </div>
              <div class="details">
                <div class="row"><span class="label">Transaction ID:</span><span>${receipt.transaction_id}</span></div>
                <div class="row"><span class="label">Date:</span><span>${new Date(receipt.date).toLocaleString()}</span></div>
                <div class="row"><span class="label">Plan:</span><span>${receipt.plan_type.toUpperCase()}</span></div>
                <div class="row"><span class="label">Amount:</span><span>ETB ${receipt.amount.toLocaleString()}</span></div>
                <div class="row"><span class="label">Status:</span><span>${receipt.status}</span></div>
                <div class="row"><span class="label">Customer:</span><span>${receipt.user_name}</span></div>
                <div class="row"><span class="label">Email:</span><span>${receipt.user_email}</span></div>
              </div>
              <div class="footer">
                <p>Thank you for choosing EstateHub!</p>
                <p>support@estatehub.com</p>
              </div>
            </div>
          </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.print();
        toast.success('Receipt ready for printing');
      } else {
        toast.error('Failed to get receipt');
      }
    } catch (error) {
      console.error('Error getting receipt:', error);
      toast.error('Failed to get receipt');
    }
  };

  const getStatusBadge = (status) => {
    switch(status) {
      case 'pending': return { color: 'bg-yellow-100 text-yellow-700', icon: Clock, label: 'Pending' };
      case 'approved': return { color: 'bg-green-100 text-green-700', icon: CheckCircle, label: 'Approved' };
      case 'rejected': return { color: 'bg-red-100 text-red-700', icon: XCircle, label: 'Rejected' };
      default: return { color: 'bg-gray-100 text-gray-700', icon: Clock, label: status };
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  };

  const formatAmount = (amount) => `ETB ${amount?.toLocaleString() || 0}`;

  const DetailsModal = () => {
    if (!selectedPayment) return null;
    const statusBadge = getStatusBadge(selectedPayment.status);
    const StatusIcon = statusBadge.icon;
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-blue-600" />
              Payment Details
            </h2>
            <button onClick={() => setShowDetailsModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="p-6 space-y-6">
            <div className="bg-gray-50 rounded-xl p-4">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <User className="w-5 h-5 text-blue-600" /> User Information
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div><p className="text-sm text-gray-500">Full Name</p><p className="font-medium">{selectedPayment.user_name}</p></div>
                <div><p className="text-sm text-gray-500">Email</p><p className="font-medium">{selectedPayment.user_email}</p></div>
                <div><p className="text-sm text-gray-500">Phone</p><p className="font-medium">{selectedPayment.phone_number || 'N/A'}</p></div>
                <div><p className="text-sm text-gray-500">User ID</p><p className="font-medium">{selectedPayment.user_id}</p></div>
              </div>
            </div>
            
            <div className="bg-purple-50 rounded-xl p-4">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-purple-600" /> Payment Information
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div><p className="text-sm text-gray-500">Plan Type</p><p className="font-medium capitalize">{selectedPayment.plan_type}</p></div>
                <div><p className="text-sm text-gray-500">Amount</p><p className="font-bold text-green-600">{formatAmount(selectedPayment.amount)}</p></div>
                <div><p className="text-sm text-gray-500">Status</p><span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium ${statusBadge.color}`}><StatusIcon className="w-3 h-3" /> {statusBadge.label}</span></div>
                <div><p className="text-sm text-gray-500">Submitted</p><p className="font-medium">{formatDate(selectedPayment.created_at)}</p></div>
              </div>
            </div>
            
            <div className="bg-blue-50 rounded-xl p-4">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" /> Payment Receipt
              </h3>
              <button onClick={() => handleDownloadReceipt(selectedPayment.id)} className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                <Download className="w-4 h-4" /> Print Receipt
              </button>
            </div>
            
            {selectedPayment.rejection_reason && (
              <div className="bg-red-50 rounded-xl p-4">
                <h3 className="font-semibold text-red-800 mb-2">Rejection Reason</h3>
                <p className="text-red-700">{selectedPayment.rejection_reason}</p>
              </div>
            )}
            
            {selectedPayment.status === 'pending' && (
              <div className="flex gap-3 pt-4 border-t">
                <button onClick={() => { setShowDetailsModal(false); handleApprovePayment(selectedPayment.id); }} disabled={processingId === selectedPayment.id} className="flex-1 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 flex items-center justify-center gap-2">
                  {processingId === selectedPayment.id ? <Loader className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />} Approve
                </button>
                <button onClick={() => { setShowDetailsModal(false); setShowRejectModal(true); }} className="flex-1 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 flex items-center justify-center gap-2">
                  <XCircle className="w-4 h-4" /> Reject
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
          <h3 className="text-xl font-bold flex items-center gap-2"><XCircle className="w-5 h-5 text-red-600" /> Reject Payment</h3>
          <button onClick={() => { setShowRejectModal(false); setRejectionReason(''); }} className="p-2 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-6">
          <p className="text-gray-600 mb-4">Provide a reason for rejection:</p>
          <textarea value={rejectionReason} onChange={(e) => setRejectionReason(e.target.value)} rows="4" className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-red-500" placeholder="Enter rejection reason..." />
        </div>
        <div className="border-t p-4 flex gap-3">
          <button onClick={() => { setShowRejectModal(false); setRejectionReason(''); }} className="flex-1 px-4 py-2 border rounded-lg">Cancel</button>
          <button onClick={handleRejectPayment} disabled={!rejectionReason.trim()} className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg">Confirm</button>
        </div>
      </div>
    </div>
  );

  const tabs = [
    { id: 'pending', label: 'Pending', count: stats.pending, icon: Clock },
    { id: 'approved', label: 'Approved', count: stats.approved, icon: CheckCircle },
    { id: 'rejected', label: 'Rejected', count: stats.rejected, icon: XCircle },
    { id: 'all', label: 'All', count: payments.length, icon: CreditCard },
  ];

  if (loading && payments.length === 0) {
    return (
      <div className="p-6">
        <div className="mb-6"><div className="h-8 bg-gray-200 rounded w-64 mb-2 animate-pulse"></div><div className="h-4 bg-gray-200 rounded w-96 animate-pulse"></div></div>
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1 mb-6 w-fit">
          {[1,2,3,4].map(i => <div key={i} className="px-6 py-2 rounded-lg"><div className="h-5 bg-gray-200 rounded w-16 animate-pulse"></div></div>)}
        </div>
        <div className="bg-white rounded-2xl shadow-sm border overflow-hidden"><div className="divide-y">{[1,2,3].map(i => <div key={i} className="p-6"><div className="flex justify-between"><div className="flex-1"><div className="h-6 bg-gray-200 rounded w-48 mb-2 animate-pulse"></div><div className="h-4 bg-gray-200 rounded w-32 animate-pulse"></div></div><div className="h-8 bg-gray-200 rounded w-24 animate-pulse"></div></div></div>)}</div></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {showDetailsModal && <DetailsModal />}
      {showRejectModal && <RejectModal />}
      
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Payment Approval Queue</h1>
        <p className="text-gray-500">Review and approve subscription payments</p>
      </div>
      
      <div className="flex flex-wrap gap-4 mb-6">
        <div className="flex-1 max-w-md relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input type="text" placeholder="Search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" />
        </div>
        <button onClick={fetchPayments} className="px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 flex items-center gap-2"><RefreshCw className="w-4 h-4" /> Refresh</button>
      </div>
      
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1 mb-6 w-fit flex-wrap">
        {tabs.map((tab) => {
          const TabIcon = tab.icon;
          return (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition ${activeTab === tab.id ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}>
              <TabIcon className="w-4 h-4" /> {tab.label} ({tab.count})
            </button>
          );
        })}
      </div>
      
      <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
        {filteredPayments.length === 0 ? (
          <div className="p-12 text-center">
            <CreditCard className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No {activeTab} payments</h3>
            <p className="text-gray-500">All payment requests have been processed</p>
          </div>
        ) : (
          <div className="divide-y">
            {filteredPayments.map((payment) => {
              const statusBadge = getStatusBadge(payment.status);
              const StatusIcon = statusBadge.icon;
              
              return (
                <div key={payment.id} className="p-6 hover:bg-gray-50 transition">
                  <div className="flex flex-wrap justify-between items-start gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2 flex-wrap">
                        <h3 className="font-semibold text-lg">{payment.user_name}</h3>
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium ${statusBadge.color}`}>
                          <StatusIcon className="w-3 h-3" /> {statusBadge.label}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-sm mb-3">
                        <div><p className="text-gray-500">Email</p><p className="font-medium truncate">{payment.user_email}</p></div>
                        <div><p className="text-gray-500">Phone</p><p className="font-medium">{payment.phone_number || 'N/A'}</p></div>
                        <div><p className="text-gray-500">Plan</p><p className="font-medium capitalize">{payment.plan_type}</p></div>
                        <div><p className="text-gray-500">Amount</p><p className="font-bold text-green-600">{formatAmount(payment.amount)}</p></div>
                      </div>
                      
                      <div className="flex items-center gap-4 text-xs text-gray-400">
                        <span>TX: {payment.transaction_id?.slice(-8) || 'N/A'}</span>
                        <span>📅 {formatDate(payment.created_at)}</span>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <button onClick={() => { setSelectedPayment(payment); setShowDetailsModal(true); }} className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">
                        <Eye className="w-4 h-4" /> Details
                      </button>
                      {payment.status === 'pending' && (
                        <>
                          <button onClick={() => handleApprovePayment(payment.id)} disabled={processingId === payment.id} className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50">
                            {processingId === payment.id ? <Loader className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />} Approve
                          </button>
                          <button onClick={() => { setSelectedPayment(payment); setShowRejectModal(true); }} className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
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
        )}
      </div>
    </div>
  );
};

export default PaymentApprovals;