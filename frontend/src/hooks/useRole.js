// src/hooks/useRole.js
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';

export const useRole = () => {
  const { user, isAuthenticated } = useAuth();
  const [role, setRole] = useState(null);
  const [hasSelectedRole, setHasSelectedRole] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const determineRole = () => {
      setLoading(true);
      
      if (isAuthenticated && user) {
        const userRole = user.role_type || user.role || user.user_role;
        console.log('📍 Role from user object:', userRole);
        setRole(userRole);
        
        const hasSelected = localStorage.getItem('role_selected') === 'true' || !!userRole;
        setHasSelectedRole(hasSelected);
        
        if (userRole && !localStorage.getItem('role_selected')) {
          localStorage.setItem('role_selected', 'true');
          localStorage.setItem('user_role', userRole);
        }
      } else {
        const storedRole = localStorage.getItem('user_role');
        const storedHasSelected = localStorage.getItem('role_selected') === 'true';
        
        if (storedRole) {
          setRole(storedRole);
          setHasSelectedRole(storedHasSelected);
        } else {
          setRole(null);
          setHasSelectedRole(false);
        }
      }
      
      setLoading(false);
    };
    
    determineRole();
  }, [user, isAuthenticated]);

  const selectRole = useCallback((newRole) => {
    console.log('🎯 Selecting role:', newRole);
    
    const validRoles = ['buyer', 'seller', 'admin', 'agent'];
    if (!validRoles.includes(newRole)) {
      console.error('Invalid role:', newRole);
      return false;
    }
    
    setRole(newRole);
    setHasSelectedRole(true);
    localStorage.setItem('user_role', newRole);
    localStorage.setItem('role_selected', 'true');
    
    if (user) {
      const updatedUser = { ...user, role_type: newRole, role: newRole };
      localStorage.setItem('user', JSON.stringify(updatedUser));
    }
    
    return true;
  }, [user]);

  const clearRole = useCallback(() => {
    setRole(null);
    setHasSelectedRole(false);
    localStorage.removeItem('user_role');
    localStorage.removeItem('role_selected');
  }, []);

  const hasRole = useCallback((roleToCheck) => {
    return role === roleToCheck;
  }, [role]);

  const getDashboardPath = useCallback(() => {
    switch(role) {
      case 'admin': return '/admin/dashboard';
      case 'seller': return '/seller/dashboard';
      case 'buyer': return '/buyer/dashboard';
      default: return '/login';
    }
  }, [role]);

  const getRoleDisplayName = useCallback(() => {
    switch(role) {
      case 'admin': return 'Administrator';
      case 'seller': return 'Seller';
      case 'buyer': return 'Buyer';
      case 'agent': return 'Real Estate Agent';
      default: return 'User';
    }
  }, [role]);

  return {
    role,
    hasSelectedRole,
    loading,
    selectRole,
    clearRole,
    hasRole,
    getDashboardPath,
    getRoleDisplayName,
    isBuyer: role === 'buyer',
    isSeller: role === 'seller',
    isAdmin: role === 'admin',
    isAgent: role === 'agent'
  };
};

export default useRole;