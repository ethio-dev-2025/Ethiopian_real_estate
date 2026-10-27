import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Home, Building2, UserPlus, Shield } from 'lucide-react';

const RoleSelectionModal = ({ open, onClose }) => {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const [selectedRole, setSelectedRole] = useState('buyer');
  const [loading, setLoading] = useState(false);

  // ✅ Do not show for admin, seller, landlord, dual — or any user with an explicit role
  const currentRole = user?.role_type || user?.role;
  const autoHiddenRoles = ['admin', 'seller', 'landlord', 'dual'];
  const shouldHide = autoHiddenRoles.includes(currentRole);
  const isOpen = open && !shouldHide;

  if (!isOpen) return null;

  const handleConfirm = async () => {
    setLoading(true);

    try {
      console.log('🎯 Role selected:', selectedRole);

      localStorage.setItem('user_role', selectedRole);
      localStorage.setItem('role_selected', 'true');

      if (user && updateUser) {
        const updatedUser = { ...user, role_type: selectedRole, role: selectedRole };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        updateUser(updatedUser);
      }

      // Redirect based on selected role
      if (selectedRole === 'buyer') {
        navigate('/dashboard/buyer');
      } else {
        navigate('/dashboard');
      }
    } catch (error) {
      console.error('Error selecting role:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (onClose) {
      onClose();
    } else {
      navigate('/');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-700 rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Choose Your Role</h2>
          <p className="text-gray-500 text-sm mt-1">Select how you want to use EstateHub</p>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <button
            onClick={() => setSelectedRole('buyer')}
            className={`p-4 rounded-xl border-2 transition-all text-center ${
              selectedRole === 'buyer'
                ? 'border-blue-600 bg-blue-50'
                : 'border-gray-200 hover:border-blue-300'
            }`}
          >
            <Home className={`w-8 h-8 mx-auto mb-2 ${selectedRole === 'buyer' ? 'text-blue-600' : 'text-gray-400'}`} />
            <h3 className="font-semibold text-gray-900">Buyer</h3>
            <p className="text-xs text-gray-500 mt-1">Browse properties</p>
          </button>

          <button
            onClick={() => setSelectedRole('seller')}
            className={`p-4 rounded-xl border-2 transition-all text-center ${
              selectedRole === 'seller'
                ? 'border-blue-600 bg-blue-50'
                : 'border-gray-200 hover:border-blue-300'
            }`}
          >
            <Building2 className={`w-8 h-8 mx-auto mb-2 ${selectedRole === 'seller' ? 'text-blue-600' : 'text-gray-400'}`} />
            <h3 className="font-semibold text-gray-900">Seller / Landlord</h3>
            <p className="text-xs text-gray-500 mt-1">List properties</p>
          </button>
        </div>

        <button
          onClick={handleConfirm}
          disabled={loading}
          className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-700 text-white rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
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