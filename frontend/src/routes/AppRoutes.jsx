// src/routes/AppRoutes.jsx
import React, { lazy, Suspense, useEffect, useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import SellerLayout from '../components/layout/SellerLayout';
import BuyerLayout from '../components/layout/BuyerLayout';

// IMPORTANT: Import ALL buyer components directly (NOT lazy) for instant loading
import BuyerDashboard from '../components/dashboard/buyer/BuyerDashboard';
import BuyerMessages from '../components/dashboard/buyer/BuyerMessages';
import BuyerProperties from '../components/dashboard/buyer/BuyerProperties';
import BuyerSaved from '../components/dashboard/buyer/BuyerSaved';

// Common Settings Component (used for both buyer and seller)
import Settings from '../components/dashboard/common/Settings';

// Admin Component - Import directly for instant loading (NO lazy)
import AdminDashboard from '../components/dashboard/admin/AdminDashboard';

// Payment Success Page
import PaymentSuccessPage from '../pages/PaymentSuccessPage';

// Seller Components (keep lazy - they're less frequently used by buyers)
const SellerDashboard = lazy(() => import('../components/dashboard/seller/sellerDashboard'));
const SellerListings = lazy(() => import('../components/dashboard/seller/SellerListings'));
const SellerMessages = lazy(() => import('../components/dashboard/seller/SellerMessages'));
const SellerProperties = lazy(() => import('../components/dashboard/seller/SellerProperties'));
const SellerSubscription = lazy(() => import('../components/dashboard/seller/SellerSubscription'));
const SellerActivation = lazy(() => import('../components/dashboard/seller/SellerActivation'));
const SellerCreateListing = lazy(() => import('../components/dashboard/seller/sellerCreateListing'));
const SellerDashboardOverview = lazy(() => import('../components/dashboard/seller/sellerDashboardOverview'));
const SellerDocumentVerification = lazy(() => import('../components/dashboard/seller/sellerDocumentVerification'));

// Common Components
const Notifications = lazy(() => import('../components/common/Notifications'));
const RoleSelectionModal = lazy(() => import('../components/common/RoleSelectionModal'));
 
// Auth pages
const LoginPage = lazy(() => import('../pages/auth/LoginPage'));
const RegisterPage = lazy(() => import('../pages/auth/RegisterPage'));
const ForgotPasswordPage = lazy(() => import('../pages/auth/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('../pages/auth/ResetPasswordPage'));

// Buyer Auth pages
const BuyerLoginPage = lazy(() => import('../pages/buyer/BuyerLoginPage'));
const BuyerRegisterPage = lazy(() => import('../pages/buyer/BuyerRegisterPage'));

// Public pages
const HomePage = lazy(() => import('../pages/public/HomePage'));
const AboutPage = lazy(() => import('../pages/public/AboutPage'));
const ContactPage = lazy(() => import('../pages/public/ContactPage'));
const FAQPage = lazy(() => import('../pages/public/FAQPage'));
const PricingPage = lazy(() => import('../pages/public/PricingPage'));
const PropertiesPage = lazy(() => import('../pages/public/PropertiesPage'));
const PropertyDetailPage = lazy(() => import('../pages/public/PropertyDetailPage'));

// Edit Listing Page
const EditListingPage = lazy(() => import('../pages/EditListingPage'));

const AppRoutes = () => {
  const { isAuthenticated, loading, user } = useAuth();
  const [role, setRole] = useState(null);
  const [hasSelectedRole, setHasSelectedRole] = useState(false);
  const [resolved, setResolved] = useState(false);

  useEffect(() => {
    // IMPORTANT: Only check role if authenticated
    if (isAuthenticated && user) {
      let userRole = user.role_type || user.role;
      if (!userRole) {
        userRole = localStorage.getItem('user_role');
      }
      
      let finalRole = userRole;
      if (userRole === 'user') {
        finalRole = 'buyer';
      }
      
      setRole(finalRole);
      setHasSelectedRole(!!finalRole && finalRole !== 'null' && finalRole !== null);
    } else {
      // When not authenticated, clear any stored role
      setRole(null);
      setHasSelectedRole(false);
    }
    setResolved(true);
  }, [user, isAuthenticated]);

  // Show nothing while checking auth
  if (loading || !resolved) {
    return <div style={{ minHeight: '100vh' }}></div>;
  }

  // NOT AUTHENTICATED - PUBLIC ROUTES
  if (!isAuthenticated) {
    return (
      <Suspense fallback={<div style={{ minHeight: '100vh' }}></div>}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/faq" element={<FAQPage />} />
          <Route path="/pricing" element={<PricingPage />} />
          <Route path="/properties" element={<PropertiesPage />} />
          <Route path="/properties/:id" element={<PropertyDetailPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
          <Route path="/buyer/login" element={<BuyerLoginPage />} />
          <Route path="/buyer/register" element={<BuyerRegisterPage />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Suspense>
    );
  }

  // AUTHENTICATED - ROLE SELECTION (only shown if user is authenticated but no role)
  if (!hasSelectedRole) {
    return (
      <Suspense fallback={<div style={{ minHeight: '100vh' }}></div>}>
        <RoleSelectionModal open={true} />
      </Suspense>
    );
  }

  const normalizedRole = String(role).toLowerCase();

  // SELLER ROUTES
  if (normalizedRole === 'seller' || normalizedRole === 'landlord' || normalizedRole === 'dual') {
    return (
      <SellerLayout>
        <Suspense fallback={<div style={{ minHeight: '100vh' }}></div>}>
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" />} />
            <Route path="/dashboard" element={<SellerDashboard />} />
            <Route path="/dashboard-overview" element={<SellerDashboardOverview />} />
            <Route path="/listings" element={<SellerListings />} />
            <Route path="/create-listing" element={<SellerCreateListing />} />
            <Route path="/edit-listing/:id" element={<EditListingPage />} />
            {/* SELLER MESSAGES ROUTES - CORRECTED */}
            <Route path="/messages" element={<SellerMessages />} />
            <Route path="/messages/:conversationId" element={<SellerMessages />} />
            <Route path="/properties" element={<SellerProperties />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/subscription" element={<SellerSubscription />} />
            <Route path="/activation" element={<SellerActivation />} />
            <Route path="/verification" element={<SellerDocumentVerification />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/properties/:id" element={<PropertyDetailPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="*" element={<Navigate to="/dashboard" />} />
          </Routes>
        </Suspense>
      </SellerLayout>
    );
  }

  // ADMIN ROUTES
  if (normalizedRole === 'admin') {
    return (
      <Suspense fallback={<div style={{ minHeight: '100vh' }}></div>}>
        <Routes>
          <Route path="/" element={<Navigate to="/admin" />} />
          <Route path="/admin/*" element={<AdminDashboard />} />
          <Route path="*" element={<Navigate to="/admin" />} />
        </Routes>
      </Suspense>
    );
  }

  // BUYER ROUTES
  if (normalizedRole === 'buyer') {
    return (
      <BuyerLayout>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard/buyer" />} />
          <Route path="/dashboard/buyer/messages/:conversationId" element={<BuyerMessages />} />
          <Route path="/dashboard/buyer/messages" element={<BuyerMessages />} />
          <Route path="/dashboard/buyer/properties" element={<BuyerProperties />} />
          <Route path="/dashboard/buyer/saved" element={<BuyerSaved />} />
          <Route path="/dashboard/buyer/settings" element={<Settings />} />
          <Route path="/dashboard/buyer/notifications" element={<Notifications />} />
          <Route path="/dashboard/buyer" element={<BuyerDashboard />} />
          <Route path="/properties" element={<PropertiesPage />} />
          <Route path="/properties/:id" element={<PropertyDetailPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/payment/success" element={<PaymentSuccessPage />} />
          <Route path="/payment/return" element={<PaymentSuccessPage />} />
          <Route path="*" element={<Navigate to="/dashboard/buyer" />} />
        </Routes>
      </BuyerLayout>
    );
  }

  return <Navigate to="/" />;
};

export default AppRoutes;