// src/components/dashboard/seller/SellerDashboard.jsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { RefreshCw, Home, Eye, ShoppingBag, List, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const API_URL = 'http://localhost:8000';

const SellerDashboard = () => {
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();
  const [stats, setStats] = useState({
    totalListings: 0,
    activeProperties: 0,
    totalViews: 0,
    rentalUnits: 0
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [listings, setListings] = useState([]);
  const hasFetchedRef = useRef(false);
  const isMountedRef = useRef(true);
  const fetchInProgressRef = useRef(false);

  const fetchStats = useCallback(async (force = false) => {
    // Prevent multiple simultaneous fetches
    if (fetchInProgressRef.current && !force) {
      console.log('⏳ Fetch already in progress, skipping...');
      return;
    }
    
    if (hasFetchedRef.current && !force) {
      console.log('✅ Already fetched my-listings, skipping...');
      return;
    }
    
    const token = localStorage.getItem('access_token');
    if (!token) {
      console.log('No token found');
      setLoading(false);
      return;
    }
    
    fetchInProgressRef.current = true;
    
    if (!force) {
      hasFetchedRef.current = true;
    }
    
    try {
      console.log('📊 Fetching my-listings...');
      const response = await fetch(`${API_URL}/api/listings/my-listings`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok && isMountedRef.current) {
        const data = await response.json();
        const listingsData = data.listings || [];
        
        console.log('📊 Listings fetched:', listingsData.length);
        setListings(listingsData);
        
        const activeListings = listingsData.filter(l => l.status === 'active' && !l.is_draft);
        const rentalListings = listingsData.filter(l => l.listing_type === 'rent');
        const totalViewsCount = listingsData.reduce((sum, l) => sum + (l.views_count || 0), 0);
        
        setStats({
          totalListings: listingsData.length,
          activeProperties: activeListings.length,
          totalViews: totalViewsCount,
          rentalUnits: rentalListings.length
        });
        
        console.log('📊 Stats updated:', {
          total: listingsData.length,
          active: activeListings.length,
          views: totalViewsCount,
          rentals: rentalListings.length
        });
      } else {
        console.error('Failed to fetch listings:', response.status);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
      fetchInProgressRef.current = false;
    }
  }, []);

  // Force refresh all data
  const handleRefresh = async () => {
    setRefreshing(true);
    hasFetchedRef.current = false;
    try {
      await refreshUser();
      await fetchStats(true);
      toast.success('Dashboard refreshed!');
    } catch (error) {
      console.error('Refresh error:', error);
      toast.error('Failed to refresh');
    } finally {
      setRefreshing(false);
    }
  };

  // FIXED: Only fetch once on mount
  useEffect(() => {
    isMountedRef.current = true;
    
    // Initial fetch after a short delay
    const timer = setTimeout(() => {
      if (!hasFetchedRef.current) {
        fetchStats();
      }
    }, 500);
    
    return () => {
      clearTimeout(timer);
      isMountedRef.current = false;
      hasFetchedRef.current = false;
    };
  }, [fetchStats]); // fetchStats is stable, won't cause re-runs

  const StatCard = ({ title, value, icon, color, gradient, onClick, subtitle }) => (
    <div
      onClick={onClick}
      style={{
        background: gradient || `linear-gradient(135deg, white 0%, ${color}08 100%)`,
        borderRadius: 20,
        padding: '24px 20px',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        border: '1px solid rgba(0,0,0,0.05)',
        position: 'relative',
        overflow: 'hidden'
      }}
      onMouseEnter={(e) => {
        if (onClick) {
          e.currentTarget.style.transform = 'translateY(-4px)';
          e.currentTarget.style.boxShadow = '0 20px 25px -12px rgba(0,0,0,0.15)';
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ 
            fontSize: 36, 
            fontWeight: 'bold', 
            color: '#1a1a1a', 
            marginBottom: 8,
            letterSpacing: '-0.02em'
          }}>
            {typeof value === 'number' ? value.toLocaleString() : value}
          </div>
          <div style={{ fontSize: 14, color: '#666', fontWeight: 500 }}>{title}</div>
          {subtitle && <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>{subtitle}</div>}
        </div>
        <div style={{
          width: 52,
          height: 52,
          borderRadius: 16,
          background: `linear-gradient(135deg, ${color}20 0%, ${color}40 100%)`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: color,
          fontSize: 28
        }}>
          {icon}
        </div>
      </div>
      <div style={{
        position: 'absolute',
        bottom: -20,
        right: -20,
        width: 100,
        height: 100,
        borderRadius: '50%',
        background: `radial-gradient(circle, ${color}10 0%, transparent 70%)`,
        pointerEvents: 'none'
      }} />
    </div>
  );

  // Get user display name
  const getUserName = () => {
    if (!user) return 'Seller';
    if (user.full_name && user.full_name !== 'vvvvv' && user.full_name !== 'vvvvvvv') {
      return user.full_name;
    }
    if (user.username && user.username !== 'vvvvv' && user.username !== 'vvvvvvv') {
      return user.username;
    }
    if (user.email) {
      return user.email.split('@')[0];
    }
    return 'Seller';
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="h-8 w-48 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-4 w-64 bg-gray-200 rounded mt-2 animate-pulse"></div>
          </div>
          <div className="h-10 w-10 bg-gray-200 rounded-full animate-pulse"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-white rounded-2xl p-6 animate-pulse">
              <div className="h-10 w-24 bg-gray-200 rounded mb-2"></div>
              <div className="h-4 w-32 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header with Refresh Button */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 text-sm mt-1">
            Welcome back, {getUserName()}
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Listings"
          value={stats.totalListings}
          icon={<List className="w-6 h-6" />}
          color="#3b82f6"
          gradient="linear-gradient(135deg, #fff 0%, #eff6ff 100%)"
          onClick={() => navigate('/dashboard/listings')}
          subtitle={`${stats.activeProperties} active`}
        />
        <StatCard
          title="Active Properties"
          value={stats.activeProperties}
          icon={<Home className="w-6 h-6" />}
          color="#10b981"
          gradient="linear-gradient(135deg, #fff 0%, #ecfdf5 100%)"
          onClick={() => navigate('/dashboard/listings?status=active')}
        />
        <StatCard
          title="Total Views"
          value={stats.totalViews}
          icon={<Eye className="w-6 h-6" />}
          color="#8b5cf6"
          gradient="linear-gradient(135deg, #fff 0%, #f5f3ff 100%)"
        />
        <StatCard
          title="Rental Units"
          value={stats.rentalUnits}
          icon={<ShoppingBag className="w-6 h-6" />}
          color="#f59e0b"
          gradient="linear-gradient(135deg, #fff 0%, #fffbeb 100%)"
          onClick={() => navigate('/dashboard/listings?type=rent')}
        />
      </div>

      {/* Recent Listings Preview */}
      {listings.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Recent Listings</h2>
            <p className="text-sm text-gray-500">Your latest property listings</p>
          </div>
          <div className="divide-y divide-gray-100">
            {listings.slice(0, 5).map((listing) => (
              <div key={listing.id} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition">
                <div>
                  <h3 className="font-medium text-gray-900">{listing.title}</h3>
                  <div className="flex items-center gap-3 mt-1">
                    <p className="text-sm text-green-600 font-medium">
                      ETB {listing.price?.toLocaleString()}
                    </p>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      listing.status === 'active' && !listing.is_draft
                        ? 'bg-green-100 text-green-700'
                        : listing.is_draft
                          ? 'bg-gray-100 text-gray-600'
                          : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {listing.is_draft ? 'Draft' : listing.status || 'Active'}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => navigate(`/dashboard/listings/${listing.id}`)}
                  className="px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition"
                >
                  View
                </button>
              </div>
            ))}
          </div>
          {listings.length > 5 && (
            <div className="px-6 py-3 bg-gray-50 border-t border-gray-100">
              <button
                onClick={() => navigate('/dashboard/listings')}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                View All {listings.length} Listings →
              </button>
            </div>
          )}
        </div>
      )}

      {/* No Listings State */}
      {listings.length === 0 && !loading && (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Home className="w-10 h-10 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Listings Yet</h3>
          <p className="text-gray-500 mb-4">Create your first property listing to get started.</p>
          <button
            onClick={() => navigate('/dashboard/create-listing')}
            className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium hover:shadow-lg transition"
          >
            Create Listing
          </button>
        </div>
      )}
    </div>
  );
};

export default SellerDashboard;