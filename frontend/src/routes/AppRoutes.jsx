import React, { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import PrivateRoute from './PrivateRoute'
import AdminRoute from './AdminRoute'
import { Loader } from 'lucide-react'

// Buyer Layout Components
import BuyerLayout from '../components/layout/BuyerLayout'

// Buyer Dashboard Components (from components/dashboard/buyer/)
import BuyerDashboard from '../components/dashboard/buyer/BuyerDashboard'
import BuyerProperties from '../components/dashboard/buyer/BuyerProperties'
import BuyerSaved from '../components/dashboard/buyer/BuyerSaved'
import BuyerSettings from '../components/dashboard/buyer/BuyerSettings'
import BuyerMessages from '../components/dashboard/buyer/BuyerMessages'

// Lazy load components for better performance
const HomePage = lazy(() => import('../pages/public/HomePage'))
const PropertiesPage = lazy(() => import('../pages/public/PropertiesPage'))
const PropertyDetailPage = lazy(() => import('../pages/public/PropertyDetailPage'))
const AboutPage = lazy(() => import('../pages/public/AboutPage'))
const ContactPage = lazy(() => import('../pages/public/ContactPage'))
const PricingPage = lazy(() => import('../pages/public/PricingPage'))
const FAQPage = lazy(() => import('../pages/public/FAQPage'))
const LoginPage = lazy(() => import('../pages/auth/LoginPage'))
const RegisterPage = lazy(() => import('../pages/auth/RegisterPage'))
const ForgotPasswordPage = lazy(() => import('../pages/auth/ForgotPasswordPage'))
const ResetPasswordPage = lazy(() => import('../pages/auth/ResetPasswordPage'))

// Buyer Auth
const BuyerRegisterPage = lazy(() => import('../pages/buyer/BuyerRegisterPage'))
const BuyerLoginPage = lazy(() => import('../pages/buyer/BuyerLoginPage'))

// Seller/Landlord Components
const UnifiedDashboard = lazy(() => import('../components/dashboard/user/UnifiedDashboard'))
const AdminDashboard = lazy(() => import('../components/dashboard/admin/AdminDashboard'))
const CreateListingPage = lazy(() => import('../pages/CreateListingPage'))
const LandlordAddProperty = lazy(() => import('../pages/LandlordAddProperty'))
const Notifications = lazy(() => import('../pages/Notifications'))
const Settings = lazy(() => import('../pages/Settings'))
const SubscriptionPage = lazy(() => import('../pages/SubscriptionPage'))
const ActivationPage = lazy(() => import('../pages/ActivationPage'))
const PaymentSuccessPage = lazy(() => import('../pages/PaymentSuccessPage'))
const MyListingsPage = lazy(() => import('../pages/MyListingsPage'))
const EditListingPage = lazy(() => import('../pages/EditListingPage'))

// Messaging component - Real-time chat for seller/landlord
const MessagesPage = lazy(() => import('../components/messages/MessagesPage'))

// Messages Wrapper for seller/landlord dashboard
const MessagesWrapper = lazy(() => import('../pages/MessagesWrapper'))

const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center">
    <Loader className="w-8 h-8 animate-spin text-blue-600" />
  </div>
)

const AppRoutes = () => {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* PUBLIC ROUTES */}
        <Route path="/" element={<HomePage />} />
        <Route path="/properties" element={<PropertiesPage />} />
        <Route path="/properties/:id" element={<PropertyDetailPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/pricing" element={<PricingPage />} />
        <Route path="/faq" element={<FAQPage />} />
        
        {/* AUTH ROUTES */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/buyer/register" element={<BuyerRegisterPage />} />
        <Route path="/buyer/login" element={<BuyerLoginPage />} />
        
        {/* ACTIVATION & SUBSCRIPTION */}
        <Route path="/activation" element={<PrivateRoute><ActivationPage /></PrivateRoute>} />
        <Route path="/subscription" element={<PrivateRoute><SubscriptionPage /></PrivateRoute>} />
        <Route path="/payment/success" element={<PaymentSuccessPage />} />
        
        {/* SELLER / LANDLORD DASHBOARD */}
        <Route path="/dashboard" element={<PrivateRoute><UnifiedDashboard /></PrivateRoute>} />
        <Route path="/dashboard/messages" element={<PrivateRoute><MessagesWrapper /></PrivateRoute>} />
        <Route path="/dashboard/messages/:conversationId" element={<PrivateRoute><MessagesWrapper /></PrivateRoute>} />
        
        {/* BUYER DASHBOARD - Using new components with BuyerLayout (NO BOOKMARKS) */}
        <Route path="/dashboard/buyer" element={
          <PrivateRoute>
            <BuyerLayout>
              <BuyerDashboard />
            </BuyerLayout>
          </PrivateRoute>
        } />
        
        <Route path="/dashboard/buyer/properties" element={
          <PrivateRoute>
            <BuyerLayout>
              <BuyerProperties />
            </BuyerLayout>
          </PrivateRoute>
        } />
        
        <Route path="/dashboard/buyer/saved" element={
          <PrivateRoute>
            <BuyerLayout>
              <BuyerSaved />
            </BuyerLayout>
          </PrivateRoute>
        } />
        
        <Route path="/dashboard/buyer/settings" element={
          <PrivateRoute>
            <BuyerLayout>
              <BuyerSettings />
            </BuyerLayout>
          </PrivateRoute>
        } />
        
        <Route path="/dashboard/buyer/messages" element={
          <PrivateRoute>
            <BuyerLayout>
              <BuyerMessages />
            </BuyerLayout>
          </PrivateRoute>
        } />
        
        <Route path="/dashboard/buyer/messages/:conversationId" element={
          <PrivateRoute>
            <BuyerLayout>
              <BuyerMessages />
            </BuyerLayout>
          </PrivateRoute>
        } />
        
        {/* LISTING MANAGEMENT */}
        <Route path="/create-listing" element={<PrivateRoute><CreateListingPage /></PrivateRoute>} />
        <Route path="/add-property" element={<PrivateRoute><LandlordAddProperty /></PrivateRoute>} />
        <Route path="/my-listings" element={<PrivateRoute><MyListingsPage /></PrivateRoute>} />
        <Route path="/edit-listing/:id" element={<PrivateRoute><EditListingPage /></PrivateRoute>} />
        
        {/* COMMUNICATION */}
        <Route path="/messages" element={<PrivateRoute><MessagesPage /></PrivateRoute>} />
        <Route path="/messages/:userId" element={<PrivateRoute><MessagesPage /></PrivateRoute>} />
        <Route path="/notifications" element={<PrivateRoute><Notifications /></PrivateRoute>} />
        
        {/* ADMIN ROUTES */}
        <Route path="/admin/messages" element={<AdminRoute><MessagesPage /></AdminRoute>} />
        <Route path="/admin/messages/:userId" element={<AdminRoute><MessagesPage /></AdminRoute>} />
        <Route path="/settings" element={<PrivateRoute><Settings /></PrivateRoute>} />
        <Route path="/admin/*" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
        
        {/* CATCH ALL */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  )
}

export default AppRoutes