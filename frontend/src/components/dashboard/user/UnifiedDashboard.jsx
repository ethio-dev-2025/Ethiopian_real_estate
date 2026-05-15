import React, { useState, useEffect, useCallback, useRef } from 'react'
import { useAuth } from '../../../context/AuthContext'
import { listingsAPI } from '../../../services/api/listingsApi'
import AppSidebar from '../../layout/AppSidebar'
import StatsCard from './StatsCard'
import CreateListingWizard from '../../wizard/CreateListingWizard'
import AddPropertyWizard from '../../wizard/AddPropertyWizard'
import EditListingWizard from '../../wizard/EditListingWizard'
import { 
  Loader, Home, TrendingUp, Eye, DollarSign, 
  MapPin, Bed, Bath, Square, Edit, Trash2, PlusCircle, X,
  Building2, BarChart3, MessageCircle, Heart, Bookmark, Settings,
  LayoutDashboard, Search, Shield, CreditCard, List, Menu
} from 'lucide-react'
import toast from 'react-hot-toast'

const API_URL = 'http://localhost:8000/api'

// Demo stats for instant display
const DEMO_STATS = {
  total_listings: 0,
  active_listings: 0,
  total_views: 0,
  total_rentals: 0
}

const UnifiedDashboard = () => {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false) // Start with false - NO SPINNER
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [showCreateListing, setShowCreateListing] = useState(false)
  const [showAddProperty, setShowAddProperty] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingListing, setEditingListing] = useState(null)
  const dataLoadedRef = useRef(false)
  const abortControllerRef = useRef(null)

  const [stats, setStats] = useState(DEMO_STATS)

  useEffect(() => {
    // If user is admin, don't load anything (redirect happens in router)
    if (user?.role_type === 'admin') {
      return
    }
    
    if (user && !dataLoadedRef.current) {
      dataLoadedRef.current = true
      loadStats()
    }
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [user])

  const loadStats = async () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    
    const abortController = new AbortController()
    abortControllerRef.current = abortController
    
    try {
      const allListings = await listingsAPI.getMyListings()
      
      const saleListings = (allListings || []).filter(item => item.listing_type === 'sale')
      const rentProperties = (allListings || []).filter(item => item.listing_type === 'rent')
      
      setStats({
        total_listings: saleListings.length,
        active_listings: saleListings.filter(l => l.status === 'active').length + rentProperties.filter(p => p.status === 'active').length,
        total_views: [...saleListings, ...rentProperties].reduce((sum, item) => sum + (item.views_count || 0), 0),
        total_rentals: rentProperties.length
      })
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('Error loading stats:', error)
      }
    }
  }

  const handleCreateListingSuccess = () => {
    setShowCreateListing(false)
    loadStats()
    toast.success('Listing created successfully!')
  }

  const handleAddPropertySuccess = () => {
    setShowAddProperty(false)
    loadStats()
    toast.success('Property added successfully!')
  }

  const statCards = [
    { title: 'Total Listings', value: stats.total_listings, icon: Home, color: 'blue' },
    { title: 'Active Properties', value: stats.active_listings, icon: TrendingUp, color: 'green' },
    { title: 'Total Views', value: stats.total_views.toLocaleString(), icon: Eye, color: 'purple' },
    { title: 'Rental Units', value: stats.total_rentals, icon: Building2, color: 'orange' },
  ]

  // If admin, don't render anything (redirect will happen)
  if (user?.role_type === 'admin') {
    return null
  }

  // Show content immediately - NO SPINNER
  return (
    <div className="min-h-screen bg-gray-100">
      <AppSidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      
      <main className={`transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-20'}`}>
        <div className="p-6">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900">Seller & Landlord Dashboard</h1>
            <p className="text-gray-500 mt-1">Overview of your real estate business</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {statCards.map((stat, index) => (
              <StatsCard key={index} title={stat.title} value={stat.value} icon={stat.icon} color={stat.color} />
            ))}
          </div>

          <div className="bg-white rounded-2xl shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="flex flex-wrap gap-4">
              <button
                onClick={() => setShowCreateListing(true)}
                className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition flex items-center gap-2"
              >
                <PlusCircle className="w-5 h-5" />
                Create Listing for Sale
              </button>
              <button
                onClick={() => setShowAddProperty(true)}
                className="px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition flex items-center gap-2"
              >
                <PlusCircle className="w-5 h-5" />
                Add Rental Property
              </button>
            </div>
          </div>
        </div>
      </main>

      {showCreateListing && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center">
              <h2 className="text-xl font-bold">Create Listing for Sale</h2>
              <button onClick={() => setShowCreateListing(false)} className="p-2 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6"><CreateListingWizard onSuccess={handleCreateListingSuccess} /></div>
          </div>
        </div>
      )}

      {showAddProperty && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center">
              <h2 className="text-xl font-bold">Add Rental Property</h2>
              <button onClick={() => setShowAddProperty(false)} className="p-2 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6"><AddPropertyWizard onSuccess={handleAddPropertySuccess} /></div>
          </div>
        </div>
      )}
    </div>
  )
}

export default UnifiedDashboard