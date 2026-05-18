// src/components/common/RoleSelectionModal.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

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
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 9999
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '16px',
        padding: '32px',
        maxWidth: '400px',
        width: '90%'
      }}>
        <h2 style={{ textAlign: 'center' }}>Choose Your Role</h2>
        <div style={{ display: 'flex', gap: '16px', margin: '24px 0' }}>
          <button
            onClick={() => setSelectedRole('buyer')}
            style={{
              flex: 1,
              padding: '16px',
              border: selectedRole === 'buyer' ? '2px solid #2196f3' : '1px solid #ddd',
              borderRadius: '8px',
              background: selectedRole === 'buyer' ? '#e3f2fd' : 'white',
              cursor: 'pointer'
            }}
          >
            <h3>Buyer</h3>
            <small>Browse properties</small>
          </button>
          <button
            onClick={() => setSelectedRole('seller')}
            style={{
              flex: 1,
              padding: '16px',
              border: selectedRole === 'seller' ? '2px solid #4caf50' : '1px solid #ddd',
              borderRadius: '8px',
              background: selectedRole === 'seller' ? '#e8f5e9' : 'white',
              cursor: 'pointer'
            }}
          >
            <h3>Seller</h3>
            <small>List properties</small>
          </button>
        </div>
        <button
          onClick={handleConfirm}
          disabled={loading}
          style={{
            width: '100%',
            padding: '12px',
            backgroundColor: '#2196f3',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontSize: '16px'
          }}
        >
          {loading ? 'Loading...' : 'Continue'}
        </button>
      </div>
    </div>
  );
};

export default RoleSelectionModal;