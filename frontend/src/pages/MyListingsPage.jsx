// src/pages/MyListingsPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Home, Eye, Trash2, Edit, MapPin, Bed, Bath, Square,
  DollarSign, RefreshCw, CheckCircle, Clock,
  AlertCircle, Send, Star, Plus, Loader
} from 'lucide-react';
import toast from 'react-hot-toast';

const API_URL = 'http://localhost:8000';

const MyListingsPage = () => {
  const navigate = useNavigate();
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');

  const getToken = () => localStorage.getItem('access_token');

  const fetchListings = useCallback(async () => {
    setLoading(true);
    try {
      const token = getToken();
      const response = await fetch(`${API_URL}/api/listings/my-listings?include_drafts=true`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      
      if (response.ok) {
        let listingsData = data.listings || [];
        
        if (statusFilter === 'published') {
          listingsData = listingsData.filter(l => !l.is_draft && l.status === 'active');
        } else if (statusFilter === 'drafts') {
          listingsData = listingsData.filter(l => l.is_draft === true);
        }
        
        setListings(listingsData);
      } else {
        toast.error('Failed to load listings');
      }
    } catch (error) {
      console.error('Error fetching listings:', error);
      toast.error('Failed to load listings');
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchListings();
  }, [fetchListings]);

  const handleDelete = async (listingId) => {
    if (!window.confirm('Are you sure you want to delete this listing?')) return;
    
    try {
      const token = getToken();
      const response = await fetch(`${API_URL}/api/listings/${listingId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      
      if (response.ok && data.success) {
        toast.success('Listing deleted successfully');
        fetchListings();
      } else {
        toast.error(data.detail || 'Failed to delete listing');
      }
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Failed to delete listing');
    }
  };

  const handlePublish = async (listingId) => {
    try {
      const token = getToken();
      const response = await fetch(`${API_URL}/api/listings/publish/${listingId}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      
      if (response.ok && data.success) {
        toast.success('Listing published successfully!');
        fetchListings();
      } else {
        toast.error(data.detail || 'Failed to publish listing');
      }
    } catch (error) {
      console.error('Publish error:', error);
      toast.error('Failed to publish listing');
    }
  };

  // CORRECTED: Navigate to edit-listing without /seller prefix
  const handleEdit = (listingId) => {
    navigate(`/edit-listing/${listingId}`);
  };

  const handleView = (listingId) => {
    window.open(`/properties/${listingId}`, '_blank');
  };

  const getStatusBadge = (listing) => {
    if (listing.is_draft) {
      return { color: 'bg-yellow-100 text-yellow-700', icon: Clock, label: 'Draft' };
    }
    if (listing.status === 'active') {
      return { color: 'bg-green-100 text-green-700', icon: CheckCircle, label: 'Published' };
    }
    return { color: 'bg-gray-100 text-gray-700', icon: AlertCircle, label: listing.status || 'Unknown' };
  };

  const totalCount = listings.length;
  const publishedCount = listings.filter(l => !l.is_draft && l.status === 'active').length;
  const draftsCount = listings.filter(l => l.is_draft).length;

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border">
        <div className="border-b px-6 py-4">
          <div className="flex justify-between items-center flex-wrap gap-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">My Listings</h2>
              <p className="text-sm text-gray-500 mt-0.5">Manage your property listings</p>
            </div>
            <div className="flex gap-3">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All ({totalCount})</option>
                <option value="published">Published ({publishedCount})</option>
                <option value="drafts">Drafts ({draftsCount})</option>
              </select>
              <button 
                onClick={() => navigate('/create-listing')}
                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold hover:shadow-lg transition flex items-center gap-2 text-sm"
              >
                <Plus className="w-4 h-4" /> Create Listing
              </button>
              <button 
                onClick={fetchListings} 
                className="px-4 py-2 border rounded-lg hover:bg-gray-50 transition"
                title="Refresh"
              >
                <RefreshCw className="w-4 h-4 text-gray-600" />
              </button>
            </div>
          </div>
        </div>

        <div className="p-6">
          {listings.length === 0 ? (
            <div className="text-center py-12">
              <Home className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-700 mb-2">
                {statusFilter === 'drafts' ? 'No draft listings' : 
                 statusFilter === 'published' ? 'No published listings' : 
                 'No listings yet'}
              </h3>
              <p className="text-gray-500 mb-6">
                {statusFilter === 'drafts' ? 'You have no saved drafts.' : 
                 statusFilter === 'published' ? 'Your published listings will appear here.' : 
                 'Start by creating your first property listing'}
              </p>
              <button 
                onClick={() => navigate('/create-listing')}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg flex items-center gap-2 mx-auto"
              >
                <Plus className="w-5 h-5" /> Create Your First Listing
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {listings.map((listing) => {
                const StatusBadge = getStatusBadge(listing);
                const StatusIcon = StatusBadge.icon;
                const coverImage = listing.cover_image || (listing.images && listing.images[0]) || null;
                
                return (
                  <div key={listing.id} className="border rounded-xl overflow-hidden hover:shadow-lg transition-all duration-300 group bg-white">
                    <div className="relative h-48 bg-gray-200">
                      {coverImage ? (
                        <img
                          src={coverImage.startsWith('http') ? coverImage : `${API_URL}${coverImage}`}
                          className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                          alt={listing.title}
                          onError={(e) => { e.target.src = 'https://via.placeholder.com/400x300?text=No+Image'; }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-300">
                          <Home className="w-12 h-12 text-gray-400" />
                        </div>
                      )}
                      
                      <div className="absolute top-3 right-3 px-2 py-1 rounded-lg text-xs font-semibold bg-black/70 text-white backdrop-blur-sm">
                        {listing.listing_type === 'sale' ? 'For Sale' : 'For Rent'}
                      </div>
                      
                      <div className={`absolute bottom-3 left-3 px-2 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 ${StatusBadge.color} backdrop-blur-sm`}>
                        <StatusIcon className="w-3 h-3" />
                        <span>{StatusBadge.label}</span>
                      </div>
                      
                      {listing.cover_image && (
                        <div className="absolute top-3 left-3 px-1.5 py-0.5 rounded bg-yellow-500 text-white text-[10px] font-semibold flex items-center gap-1">
                          <Star className="w-3 h-3 fill-white" /> Cover
                        </div>
                      )}
                    </div>
                    
                    <div className="p-4">
                      <h3 className="font-bold text-lg text-gray-900 mb-1 line-clamp-1">{listing.title}</h3>
                      
                      <div className="flex items-center gap-1 text-gray-500 text-sm mb-2">
                        <MapPin className="w-3 h-3" />
                        <span className="truncate">{listing.city || 'Location not set'}</span>
                      </div>
                      
                      <div className="flex gap-3 text-sm text-gray-500 mb-3">
                        <div className="flex items-center gap-1"><Bed className="w-3 h-3" /> {listing.bedrooms || 0}</div>
                        <div className="flex items-center gap-1"><Bath className="w-3 h-3" /> {listing.bathrooms || 0}</div>
                        <div className="flex items-center gap-1"><Square className="w-3 h-3" /> {listing.sqft || 0}</div>
                      </div>
                      
                      <p className="text-xl font-bold text-blue-600 mb-4">
                        ETB {listing.price?.toLocaleString() || 0}
                        {listing.listing_type === 'rent' && <span className="text-sm text-gray-500">/month</span>}
                      </p>
                      
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleView(listing.id)}
                          className="flex-1 px-3 py-2 border rounded-lg text-sm font-medium hover:bg-gray-50 transition flex items-center justify-center gap-1"
                        >
                          <Eye className="w-4 h-4" /> View
                        </button>
                        <button
                          onClick={() => handleEdit(listing.id)}
                          className="flex-1 px-3 py-2 border border-blue-200 bg-blue-50 text-blue-600 rounded-lg text-sm font-medium hover:bg-blue-100 transition flex items-center justify-center gap-1"
                        >
                          <Edit className="w-4 h-4" /> Edit
                        </button>
                        {listing.is_draft && (
                          <button
                            onClick={() => handlePublish(listing.id)}
                            className="flex-1 px-3 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition flex items-center justify-center gap-1"
                          >
                            <Send className="w-4 h-4" /> Publish
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(listing.id)}
                          className="px-3 py-2 border border-red-200 text-red-600 rounded-lg text-sm font-medium hover:bg-red-50 transition flex items-center justify-center gap-1"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MyListingsPage;