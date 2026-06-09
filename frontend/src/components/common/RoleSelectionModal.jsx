// src/components/common/RoleSelectionModal.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Home, Building2, UserPlus, Shield } from 'lucide-react';

const RoleSelectionModal = ({ open }) => {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const [selectedRole, setSelectedRole] = useState('buyer');
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  const handleConfirm = async () => {
    setLoading(true);
    
    try {
      localStorage.setItem('user_role', selectedRole);
      localStorage.setItem('role_selected', 'true');
      
      if (user && updateUser) {
        const updatedUser = { ...user, role_type: selectedRole, role: selectedRole };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        updateUser(updatedUser);
      }
      
      navigate(`/${selectedRole}/dashboard`);
    } catch (error) {
      console.error('Error selecting role:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-gradient-to-r from-primary-700 to-primary-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-text-primary">Choose Your Role</h2>
          <p className="text-text-secondary text-sm mt-1">Select how you want to use BetFinder</p>
        </div>
        
        <div className="grid grid-cols-2 gap-4 mb-6">
          <button
            onClick={() => setSelectedRole('buyer')}
            className={`p-4 rounded-xl border-2 transition-all text-center ${
              selectedRole === 'buyer' 
                ? 'border-primary-600 bg-primary-50' 
                : 'border-border-light hover:border-primary-300'
            }`}
          >
            <Home className={`w-8 h-8 mx-auto mb-2 ${selectedRole === 'buyer' ? 'text-primary-600' : 'text-text-muted'}`} />
            <h3 className="font-semibold text-text-primary">Buyer</h3>
            <p className="text-xs text-text-muted mt-1">Browse properties</p>
          </button>
          
          <button
            onClick={() => setSelectedRole('seller')}
            className={`p-4 rounded-xl border-2 transition-all text-center ${
              selectedRole === 'seller' 
                ? 'border-secondary-500 bg-secondary-50' 
                : 'border-border-light hover:border-secondary-300'
            }`}
          >
            <Building2 className={`w-8 h-8 mx-auto mb-2 ${selectedRole === 'seller' ? 'text-secondary-500' : 'text-text-muted'}`} />
            <h3 className="font-semibold text-text-primary">Seller</h3>
            <p className="text-xs text-text-muted mt-1">List properties</p>
          </button>
        </div>
        
        <button
          onClick={handleConfirm}
          disabled={loading}
          className="w-full py-3 bg-gradient-to-r from-primary-700 to-primary-800 text-white rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Loading...
            </>
          ) : (
            <>
              <UserPlus className="w-5 h-5" />
              Continue
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default RoleSelectionModal;