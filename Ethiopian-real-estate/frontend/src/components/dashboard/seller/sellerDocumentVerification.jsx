// src/components/dashboard/seller/sellerDocumentVerification.jsx
import React, { useState, useEffect } from 'react'
import {
  Upload,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  Trash2,
  ShieldCheck
} from 'lucide-react'

const documentTypes = [
  {
    id: 'id_proof',
    name: 'Government ID Proof',
    description: 'Passport, Driver License, or National ID',
    required: true
  },
  {
    id: 'business_license',
    name: 'Business License',
    description: 'Business registration certificate',
    required: true
  },
  {
    id: 'tax_id',
    name: 'Tax ID Certificate',
    description: 'Official tax registration document',
    required: true
  },
  {
    id: 'bank_details',
    name: 'Bank Details',
    description: 'Bank statement or account proof',
    required: true
  }
]

const SellerDocumentVerification = () => {
  const [documents, setDocuments] = useState(documentTypes)
  const [uploadedFiles, setUploadedFiles] = useState({})
  const [verificationStatus, setVerificationStatus] = useState('pending')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem('sellerDocuments')) || {}
    setUploadedFiles(saved)
    const updated = documents.map((doc) => ({
      ...doc,
      status: saved[doc.id] ? 'uploaded' : 'pending'
    }))
    setDocuments(updated)
  }, [])

  const handleFileUpload = (e, documentId) => {
    const file = e.target.files[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      alert('Max file size is 5MB')
      return
    }
    const fileData = {
      name: file.name,
      size: file.size,
      type: file.type,
      preview: URL.createObjectURL(file),
      uploadedAt: new Date().toISOString()
    }
    const updatedFiles = { ...uploadedFiles, [documentId]: fileData }
    setUploadedFiles(updatedFiles)
    localStorage.setItem('sellerDocuments', JSON.stringify(updatedFiles))
    const updatedDocs = documents.map((doc) =>
      doc.id === documentId ? { ...doc, status: 'uploaded' } : doc
    )
    setDocuments(updatedDocs)
  }

  const removeDocument = (documentId) => {
    const updatedFiles = { ...uploadedFiles }
    delete updatedFiles[documentId]
    setUploadedFiles(updatedFiles)
    localStorage.setItem('sellerDocuments', JSON.stringify(updatedFiles))
    const updatedDocs = documents.map((doc) =>
      doc.id === documentId ? { ...doc, status: 'pending' } : doc
    )
    setDocuments(updatedDocs)
  }

  const submitVerification = async () => {
    const allRequiredUploaded = documents
      .filter((doc) => doc.required)
      .every((doc) => uploadedFiles[doc.id])
    if (!allRequiredUploaded) {
      alert('Upload all required documents')
      return
    }
    setLoading(true)
    setTimeout(() => {
      setVerificationStatus('in_review')
      setLoading(false)
      alert('Documents submitted successfully!')
    }, 1500)
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'uploaded':
        return <CheckCircle size={18} className="text-success" />
      case 'pending':
      default:
        return <Clock size={18} className="text-warning" />
    }
  }

  const buttonStyle = {
    border: 'none',
    background: 'linear-gradient(135deg, #1e3a8a 0%, #1d4ed8 100%)',
    color: '#fff',
    padding: '10px 14px',
    borderRadius: 10,
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    cursor: 'pointer',
    fontSize: 14,
    transition: 'all 0.3s ease'
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-800 to-primary-900 text-white p-6 rounded-2xl mb-6 shadow-md">
        <h1 className="text-2xl font-bold mb-2">Seller Verification</h1>
        <p className="text-primary-100 opacity-90">Upload required documents to verify your seller account.</p>
      </div>

      {/* Status */}
      <div className="bg-white border border-border-light rounded-2xl p-6 mb-6 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <ShieldCheck className="w-6 h-6 text-primary-600" />
          <h2 className="text-xl font-bold text-text-primary">Verification Status</h2>
        </div>
        <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500 bg-gradient-to-r from-primary-600 to-primary-700"
            style={{ width: verificationStatus === 'in_review' ? '70%' : '25%' }}
          />
        </div>
        <p className="mt-3 text-text-secondary">
          {verificationStatus === 'in_review'
            ? 'Documents are under review'
            : 'Pending document upload'}
        </p>
      </div>

      {/* Documents */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {documents.map((doc) => (
          <div key={doc.id} className="bg-white border border-border-light rounded-2xl p-5 shadow-sm hover:shadow-md transition">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="font-semibold text-text-primary mb-1">{doc.name}</h3>
                <p className="text-text-muted text-sm">{doc.description}</p>
              </div>
              {getStatusIcon(doc.status)}
            </div>

            {uploadedFiles[doc.id] ? (
              <>
                <div className="bg-surface-muted p-3 rounded-xl mb-4">
                  <p className="text-sm font-medium text-text-primary mb-1">{uploadedFiles[doc.id].name}</p>
                  <p className="text-text-muted text-xs">Uploaded successfully</p>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => window.open(uploadedFiles[doc.id].preview, '_blank')}
                    className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-xl text-sm font-medium hover:bg-primary-700 transition flex items-center justify-center gap-2"
                  >
                    <Eye size={16} /> View
                  </button>
                  <button
                    onClick={() => removeDocument(doc.id)}
                    className="flex-1 px-4 py-2 bg-error text-white rounded-xl text-sm font-medium hover:bg-red-700 transition flex items-center justify-center gap-2"
                  >
                    <Trash2 size={16} /> Remove
                  </button>
                </div>
              </>
            ) : (
              <label className="flex items-center justify-center gap-2 w-full py-3 px-4 bg-primary-600 text-white rounded-xl text-sm font-medium hover:bg-primary-700 transition cursor-pointer">
                <Upload size={16} /> Upload
                <input
                  type="file"
                  hidden
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => handleFileUpload(e, doc.id)}
                />
              </label>
            )}
          </div>
        ))}
      </div>

      {/* Submit */}
      <div className="mt-8 text-center">
        <button
          onClick={submitVerification}
          disabled={loading}
          className="px-8 py-3 bg-gradient-to-r from-primary-700 to-primary-800 text-white rounded-xl font-semibold hover:shadow-lg transition disabled:opacity-50 text-base"
        >
          {loading ? 'Submitting...' : 'Submit Verification'}
        </button>
      </div>
    </div>
  )
}

export default SellerDocumentVerification