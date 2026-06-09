// src/components/dashboard/common/AccountActivation.jsx
import React, { useState } from 'react'
import { Shield, Upload, FileText, CheckCircle, AlertCircle, ArrowRight, Clock, Loader, X } from 'lucide-react'
import DocumentUpload from '../verification/DocumentUpload'

const AccountActivation = ({ role, onActivate, userStatus }) => {
  const [showUpload, setShowUpload] = useState(false)

  const requiredDocs = [
    { name: 'Business License', description: 'Valid business license or trade registration' },
    { name: 'Tax Clearance Certificate', description: 'Recent tax clearance certificate' },
    { name: 'Government ID', description: 'Passport or national ID card' },
    { name: 'Property Documents', description: 'Property ownership proof or title deed' }
  ]

  // FOR AWAITING APPROVAL USERS - Show wait message
  if (userStatus === 'awaiting_approval') {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl border border-border-light overflow-hidden">
          <div className="bg-gradient-to-r from-primary-700 to-primary-800 p-8 text-white text-center">
            <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Loader className="w-12 h-12 text-white animate-spin" />
            </div>
            <h2 className="text-2xl font-bold">Please Wait for Admin Approval</h2>
            <p className="text-primary-100 mt-2">Your documents are being reviewed by our admin team.</p>
          </div>
          <div className="p-8">
            <button 
              onClick={() => window.location.href = '/dashboard'} 
              className="w-full py-3 bg-gradient-to-r from-primary-700 to-primary-800 text-white rounded-xl font-semibold hover:shadow-lg transition-all"
            >
              Return to Dashboard
            </button>
          </div>
        </div>
      </div>
    )
  }

  // FOR PENDING USERS - Show activate button and upload form
  if (userStatus === 'pending') {
    if (showUpload) {
      return (
        <DocumentUpload 
          onSuccess={() => {
            setShowUpload(false)
            if (onActivate) onActivate()
          }}
          onCancel={() => setShowUpload(false)}
        />
      )
    }

    return (
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl border border-border-light overflow-hidden">
          <div className="bg-gradient-to-r from-secondary-500 to-secondary-600 p-8 text-white text-center">
            <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield className="w-12 h-12 text-white" />
            </div>
            <h2 className="text-2xl font-bold">Account Not Activated</h2>
            <p className="text-secondary-100 mt-2">
              You need to complete the verification process before you can {role === 'seller' ? 'create listings' : 'add properties'}.
            </p>
          </div>
          
          <div className="p-8">
            <div className="bg-primary-50 rounded-xl p-6 mb-8">
              <h3 className="font-semibold text-primary-800 mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Required Documents
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {requiredDocs.map((doc, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-primary-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-text-primary">{doc.name}</p>
                      <p className="text-sm text-text-secondary">{doc.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="bg-secondary-50 rounded-xl p-4 mb-8">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-secondary-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-secondary-800">Important Notes:</p>
                  <ul className="text-sm text-secondary-700 mt-2 space-y-1">
                    <li>• All documents must be clear and readable</li>
                    <li>• Accepted formats: PDF, JPG, PNG (Max 10MB each)</li>
                    <li>• Verification typically takes 2-3 business days</li>
                    <li>• You'll receive email notification once approved</li>
                  </ul>
                </div>
              </div>
            </div>
            
            <button
              onClick={() => setShowUpload(true)}
              className="w-full py-4 bg-gradient-to-r from-primary-700 to-primary-800 text-white rounded-xl font-semibold hover:shadow-lg transition-all flex items-center justify-center gap-2"
            >
              <Upload className="w-5 h-5" />
              Activate Your Account
              <ArrowRight className="w-5 h-5" />
            </button>
            
            <p className="text-center text-sm text-text-muted mt-4">
              After submitting documents, our admin team will review and activate your account.
            </p>
          </div>
        </div>
      </div>
    )
  }

  // Fallback for active users (should not reach here)
  return null
}

export default AccountActivation