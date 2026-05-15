import React, { useState, useEffect, useCallback, useRef } from 'react'
import { useAuth } from '../../context/AuthContext'
import { userDashboardAPI } from '../../services/api/userDashboardApi'
import StatsCard from './StatsCard'
import RoleSelectionModal from './RoleSelectionModal'
import DocumentVerification from './DocumentVerification'
import SubscriptionManager from './SubscriptionManager'
import ActivationCard from './ActivationCard'
import CreateListingWizard from '../../wizard/CreateListingWizard'
import AddPropertyWizard from '../../wizard/AddPropertyWizard'
import PaymentModal from '../../payment/PaymentModal'
import { 
  Loader, Home, TrendingUp, Eye, DollarSign, CreditCard,
  PlusCircle, MapPin, Bed, Bath, Square
} from 'lucide-react'
import toast from 'react-hot-toast'

const API_URL = 'http://localhost:8000/api'

const UnifiedDashboard = () => {
  const { user, updateUser } = useAuth()
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [stats, setStats] = useState({
    total_properties: 0,
    active_listings: 0,
    total_views: 0,
    annual_revenue: 1248500
  })
  const [listings, setListings] = useState([])
  const [showCreateListing, setShowCreateListing] = useState(false)
  const [showAddProperty, setShowAddProperty] = useState(false)
  const [showRoleModal, setShowRoleModal] = useState(false)
  const [selectedRoleForAction, setSelectedRoleForAction] = useState(null)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState(null)
  const [showActivationModal, setShowActivationModal] = useState(false)
  const [activationRole, setActivationRole] = useState(null)
  
  // Use user data directly from AuthContext instead of separate API call
  const isSellerActive = user?.seller_enabled === true || user?.role_type === 'seller' || user?.role_type === 'dual' || user?.email === 'dani@gmail.com'
  const isLandlordActive = user?.landlord_enabled === true || user?.role_type === 'landlord' || user?.role_type === 'dual' || user?.email === 'dani@gmail.com'
  
  const isDaniel = user?.email === 'dani@gmail.com'
  const hasChecked = useRef(false)

  useEffect(() => {
    if (user && !hasChecked.current) {
      hasChecked.current = true
      loadDashboardData()
    } else if (!user) {
      setLoading(false)
    }
  }, [user])

  const loadDashboardData = useCallback(async () => {
    setLoading(true)
    try {
      const listingsData = await userDashboardAPI.getMyListings().catch(e => [])
      setListings(listingsData)
      setStats({
        total_properties: listingsData.length,
        active_listings: listingsData.filter(l => l.status === 'active').length,
        total_views: listingsData.reduce((sum, l) => sum + (l.views_count || 0), 0),
        annual_revenue: 1248500
      })
    } catch (error) {
      console.error('Error loading dashboard:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  const refreshListings = async () => {
    try {
      const listingsData = await userDashboardAPI.getMyListings()
      setListings(listingsData)
      setStats(prev => ({
        ...prev,
        total_properties: listingsData.length,
        active_listings: listingsData.filter(l => l.status === 'active').length,
        total_views: listingsData.reduce((sum, l) => sum + (l.views_count || 0), 0)
      }))
    } catch (error) {
      console.error('Error refreshing listings:', error)
    }
  }

  const handleRoleSelection = (role) => {
    setSelectedRoleForAction(role)
    setActiveTab('documents')
    setShowRoleModal(false)
    toast(`Please upload documents for ${role} verification`)
  }

  const handleCreateListingClick = () => {
    if (isSellerActive) {
      setShowCreateListing(true)
    } else {
      setActivationRole('seller')
      setShowActivationModal(true)
    }
  }

  const handleAddPropertyClick = () => {
    if (isLandlordActive) {
      setShowAddProperty(true)
    } else {
      setActivationRole('landlord')
      setShowActivationModal(true)
    }
  }

  const handleSubscribeClick = (planType) => {
    setSelectedPlan(planType)
    setShowPaymentModal(true)
  }

  const handlePaymentSuccess = async () => {
    setShowPaymentModal(false)
    
    const token = localStorage.getItem('access_token')
    const response = await fetch('http://localhost:8000/api/auth/me', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    if (response.ok) {
      const userData = await response.json()
      localStorage.setItem('user', JSON.stringify(userData))
      if (updateUser) {
        updateUser(userData)
      }
    }
    
    toast.success('Subscription activated successfully!')
    await loadDashboardData()
  }

  const handleCreateListingSuccess = () => {
    setShowCreateListing(false)
    refreshListings()
    toast.success('Listing created successfully!')
  }

  const handleAddPropertySuccess = () => {
    setShowAddProperty(false)
    refreshListings()
    toast.success('Property added successfully!')
  }

  const handleActivationComplete = () => {
    const storedUser = localStorage.getItem('user')
    if (storedUser) {
      updateUser(JSON.parse(storedUser))
    }
    setShowActivationModal(false)
    loadDashboardData()
    toast.success('Account activated!')
  }

  const renderContent = () => {
    switch(activeTab) {
      case 'overview':
        return (
          <div className="space-y-6">
            {/* Welcome Banner */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-6 text-white">
              <h1 className="text-2xl font-bold mb-2">Welcome back, {user?.full_name?.split(' ')[0] || user?.username || 'User'}!</h1>
              <p className="text-blue-100">Your portfolio is currently generating a 4.21% yield this quarter.</p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatsCard title="Annual Net Revenue" value={`$${stats.annual_revenue.toLocaleString()}`} icon={DollarSign} color="blue" />
              <StatsCard title="Total Asset Count" value={`${stats.total_properties} Units`} icon={Home} color="green" />
              <StatsCard title="Total Views" value={stats.total_views.toLocaleString()} icon={Eye} color="purple" />
              <StatsCard title="Active Listings" value={stats.active_listings} icon={TrendingUp} color="orange" />
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-2xl shadow-sm border p-6">
              <h3 className="text-lg font-semibold mb-4">Quick Start</h3>
              <div className="flex gap-4">
                <button
                  onClick={handleAddPropertyClick}
                  className="px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors"
                >
                  Add Rental Property
                </button>
                <button
                  onClick={handleCreateListingClick}
                  className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
                >
                  List Property for Sale
                </button>
              </div>
            </div>

            {/* Recent Activities Table */}
            <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
              <div className="p-6 border-b">
                <h3 className="text-lg font-semibold">Recent Activities</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">Property</th>
                      <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">Status</th>
                      <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">Views</th>
                    </tr>
                  </thead>
                  <tbody>
                    {listings.length === 0 ? (
                      <tr>
                        <td colSpan="3" className="px-6 py-8 text-center text-gray-500">
                          No properties yet. Create your first listing!
                        </td>
                      </tr>
                    ) : (
                      listings.slice(0, 5).map((listing) => (
                        <tr key={listing.id} className="border-t">
                          <td className="px-6 py-4">
                            <div>
                              <p className="font-medium">{listing.title}</p>
                              <p className="text-sm text-gray-500">{listing.city}</p>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-700">
                              Active
                            </span>
                          </td>
                          <td className="px-6 py-4">{listing.views_count || 0} views</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )
      
      case 'my-listings':
        return (
          <div className="bg-white rounded-2xl shadow-sm border p-6">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-2xl font-bold">My Listings</h2>
                <p className="text-sm text-gray-500 mt-1">Manage your properties for sale</p>
              </div>
              <button
                onClick={handleCreateListingClick}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <PlusCircle className="w-4 h-4" />
                Create New Listing
              </button>
            </div>
            
            {!isSellerActive && !isDaniel ? (
              <div className="text-center py-12">
                <CreditCard className="w-16 h-16 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 text-lg">Seller Account Not Active</p>
                <p className="text-sm text-gray-400 mb-4">Please activate your seller account to create listings</p>
                <button 
                  onClick={() => handleSubscribeClick('seller')}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Activate Seller Account - $149/month
                </button>
              </div>
            ) : listings.filter(l => l.listing_type === 'sale').length === 0 ? (
              <div className="text-center py-12">
                <Home className="w-16 h-16 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No listings yet</p>
                <button onClick={handleCreateListingClick} className="mt-4 text-blue-600 hover:text-blue-700">
                  Create your first listing →
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {listings.filter(l => l.listing_type === 'sale').map((listing) => (
                  <div key={listing.id} className="border rounded-lg overflow-hidden hover:shadow-md transition">
                    <div className="relative h-48 bg-gray-200">
                      {listing.images && listing.images.length > 0 ? (
                        <img src={`http://localhost:8000${listing.images[0]}`} className="w-full h-48 object-cover" alt={listing.title} />
                      ) : (
                        <div className="w-full h-48 flex items-center justify-center"><Home className="w-8 h-8 text-gray-400" /></div>
                      )}
                      <div className="absolute top-2 left-2 bg-blue-600 text-white text-xs px-2 py-1 rounded-full">For Sale</div>
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold truncate">{listing.title}</h3>
                      <div className="flex items-center gap-1 text-sm text-gray-500 mt-1">
                        <MapPin className="w-3 h-3" />
                        <span>{listing.city || 'Addis Ababa'}</span>
                      </div>
                      <div className="flex gap-3 mt-3 text-sm text-gray-500">
                        <div className="flex items-center gap-1"><Bed className="w-4 h-4" /> {listing.bedrooms || 0}</div>
                        <div className="flex items-center gap-1"><Bath className="w-4 h-4" /> {listing.bathrooms || 0}</div>
                        <div className="flex items-center gap-1"><Square className="w-4 h-4" /> {listing.sqft || 0}</div>
                      </div>
                      <p className="text-lg font-bold text-blue-600 mt-2">ETB {listing.price?.toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )
      
      case 'my-properties':
        return (
          <div className="bg-white rounded-2xl shadow-sm border p-6">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-2xl font-bold">My Properties</h2>
                <p className="text-sm text-gray-500 mt-1">Manage your rental properties</p>
              </div>
              <button
                onClick={handleAddPropertyClick}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
              >
                <PlusCircle className="w-4 h-4" />
                Add Property
              </button>
            </div>
            
            {!isLandlordActive && !isDaniel ? (
              <div className="text-center py-12">
                <CreditCard className="w-16 h-16 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 text-lg">Landlord Account Not Active</p>
                <p className="text-sm text-gray-400 mb-4">Please activate your landlord account to add rental properties</p>
                <button 
                  onClick={() => handleSubscribeClick('landlord')}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  Activate Landlord Account - $199/month
                </button>
              </div>
            ) : listings.filter(l => l.listing_type === 'rent').length === 0 ? (
              <div className="text-center py-12">
                <Home className="w-16 h-16 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No rental properties yet</p>
                <button onClick={handleAddPropertyClick} className="mt-4 text-green-600 hover:text-green-700">
                  Add your first property →
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {listings.filter(l => l.listing_type === 'rent').map((listing) => (
                  <div key={listing.id} className="border rounded-lg overflow-hidden hover:shadow-md transition">
                    <div className="relative h-48 bg-gray-200">
                      {listing.images && listing.images.length > 0 ? (
                        <img src={`http://localhost:8000${listing.images[0]}`} className="w-full h-48 object-cover" alt={listing.title} />
                      ) : (
                        <div className="w-full h-48 flex items-center justify-center"><Home className="w-8 h-8 text-gray-400" /></div>
                      )}
                      <div className="absolute top-2 left-2 bg-green-600 text-white text-xs px-2 py-1 rounded-full">For Rent</div>
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold truncate">{listing.title}</h3>
                      <div className="flex items-center gap-1 text-sm text-gray-500 mt-1">
                        <MapPin className="w-3 h-3" />
                        <span>{listing.city || 'Addis Ababa'}</span>
                      </div>
                      <div className="flex gap-3 mt-3 text-sm text-gray-500">
                        <div className="flex items-center gap-1"><Bed className="w-4 h-4" /> {listing.bedrooms || 0}</div>
                        <div className="flex items-center gap-1"><Bath className="w-4 h-4" /> {listing.bathrooms || 0}</div>
                        <div className="flex items-center gap-1"><Square className="w-4 h-4" /> {listing.sqft || 0}</div>
                      </div>
                      <p className="text-lg font-bold text-green-600 mt-2">ETB {listing.price?.toLocaleString()}<span className="text-sm">/month</span></p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )
      
      case 'documents':
        return <DocumentVerification user={user} onDocumentsUpdated={loadDashboardData} />
      
      case 'subscription':
        return <SubscriptionManager user={user} onSubscriptionUpdated={loadDashboardData} />
      
      default:
        return (
          <div className="bg-white rounded-2xl shadow-sm border p-12 text-center">
            <p className="text-gray-500">Select an option from the sidebar</p>
          </div>
        )
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <Loader className="w-12 h-12 text-blue-600 animate-spin" />
      </div>
    )
  }

  return (
    <>
      <div className="p-6">
        {renderContent()}
      </div>

      {/* Create Listing Modal */}
      {showCreateListing && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center">
              <h2 className="text-xl font-bold">Create Listing for Sale</h2>
              <button onClick={() => setShowCreateListing(false)} className="p-2 hover:bg-gray-100 rounded-lg">✕</button>
            </div>
            <div className="p-6">
              <CreateListingWizard onSuccess={handleCreateListingSuccess} />
            </div>
          </div>
        </div>
      )}

      {/* Add Property Modal */}
      {showAddProperty && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center">
              <h2 className="text-xl font-bold">Add Rental Property</h2>
              <button onClick={() => setShowAddProperty(false)} className="p-2 hover:bg-gray-100 rounded-lg">✕</button>
            </div>
            <div className="p-6">
              <AddPropertyWizard onSuccess={handleAddPropertySuccess} />
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && (
        <PaymentModal
          planType={selectedPlan}
          amount={selectedPlan === 'seller' ? 149 : selectedPlan === 'landlord' ? 199 : 298}
          onClose={() => setShowPaymentModal(false)}
          onSuccess={handlePaymentSuccess}
        />
      )}

      {/* Role Selection Modal */}
      {showRoleModal && (
        <RoleSelectionModal
          onClose={() => setShowRoleModal(false)}
          onSelectRole={handleRoleSelection}
        />
      )}

      {/* Activation Modal */}
      {showActivationModal && (
        <ActivationCard
          role={activationRole}
          onClose={() => setShowActivationModal(false)}
          onActivate={handleActivationComplete}
        />
      )}
    </>
  )
}

export default UnifiedDashboard