// src/pages/EditListingPage.jsx
import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import EditListingWizard from '../components/wizard/EditListingWizard';

const EditListingPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const handleSuccess = () => {
    navigate('/listings');
  };

  const handleCancel = () => {
    navigate('/listings');
  };

  // No spinner - content loads immediately
  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <EditListingWizard 
          listingId={id} 
          onSuccess={handleSuccess}
          onCancel={handleCancel}
        />
      </div>
    </div>
  );
};

export default EditListingPage;