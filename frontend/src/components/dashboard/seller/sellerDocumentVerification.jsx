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

  const [verificationStatus, setVerificationStatus] =
    useState('pending')

  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const saved =
      JSON.parse(
        localStorage.getItem('sellerDocuments')
      ) || {}

    setUploadedFiles(saved)

    const updated = documents.map((doc) => ({
      ...doc,
      status: saved[doc.id]
        ? 'uploaded'
        : 'pending'
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

    const updatedFiles = {
      ...uploadedFiles,
      [documentId]: fileData
    }

    setUploadedFiles(updatedFiles)

    localStorage.setItem(
      'sellerDocuments',
      JSON.stringify(updatedFiles)
    )

    const updatedDocs = documents.map((doc) =>
      doc.id === documentId
        ? { ...doc, status: 'uploaded' }
        : doc
    )

    setDocuments(updatedDocs)
  }

  const removeDocument = (documentId) => {
    const updatedFiles = { ...uploadedFiles }

    delete updatedFiles[documentId]

    setUploadedFiles(updatedFiles)

    localStorage.setItem(
      'sellerDocuments',
      JSON.stringify(updatedFiles)
    )

    const updatedDocs = documents.map((doc) =>
      doc.id === documentId
        ? { ...doc, status: 'pending' }
        : doc
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

      alert(
        'Documents submitted successfully!'
      )
    }, 1500)
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'uploaded':
        return (
          <CheckCircle
            size={18}
            color="#10b981"
          />
        )

      case 'pending':
      default:
        return (
          <Clock
            size={18}
            color="#f59e0b"
          />
        )
    }
  }

  return (
    <div
      style={{
        padding: 24,
        maxWidth: 1100,
        margin: '0 auto'
      }}
    >
      {/* Header */}

      <div
        style={{
          background: '#2563eb',
          color: '#fff',
          padding: 24,
          borderRadius: 16,
          marginBottom: 24
        }}
      >
        <h1
          style={{
            marginBottom: 10,
            fontSize: 28
          }}
        >
          Seller Verification
        </h1>

        <p style={{ opacity: 0.9 }}>
          Upload required documents to verify
          your seller account.
        </p>
      </div>

      {/* Status */}

      <div
        style={{
          background: '#fff',
          border: '1px solid #eee',
          borderRadius: 16,
          padding: 24,
          marginBottom: 24
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            marginBottom: 16
          }}
        >
          <ShieldCheck color="#2563eb" />

          <h2
            style={{
              fontSize: 20,
              margin: 0
            }}
          >
            Verification Status
          </h2>
        </div>

        <div
          style={{
            height: 10,
            background: '#eee',
            borderRadius: 20,
            overflow: 'hidden'
          }}
        >
          <div
            style={{
              width:
                verificationStatus ===
                'in_review'
                  ? '70%'
                  : '25%',
              height: '100%',
              background: '#2563eb'
            }}
          />
        </div>

        <p
          style={{
            marginTop: 12,
            color: '#666'
          }}
        >
          {verificationStatus ===
          'in_review'
            ? 'Documents are under review'
            : 'Pending document upload'}
        </p>
      </div>

      {/* Documents */}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns:
            'repeat(auto-fit, minmax(320px, 1fr))',
          gap: 20
        }}
      >
        {documents.map((doc) => (
          <div
            key={doc.id}
            style={{
              background: '#fff',
              border: '1px solid #eee',
              borderRadius: 16,
              padding: 20
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent:
                  'space-between',
                marginBottom: 14
              }}
            >
              <div>
                <h3
                  style={{
                    marginBottom: 6
                  }}
                >
                  {doc.name}
                </h3>

                <p
                  style={{
                    color: '#666',
                    fontSize: 14
                  }}
                >
                  {doc.description}
                </p>
              </div>

              {getStatusIcon(doc.status)}
            </div>

            {uploadedFiles[doc.id] ? (
              <>
                <div
                  style={{
                    background: '#f9fafb',
                    padding: 12,
                    borderRadius: 10,
                    marginBottom: 14
                  }}
                >
                  <div
                    style={{
                      fontSize: 14,
                      marginBottom: 4
                    }}
                  >
                    {
                      uploadedFiles[doc.id]
                        .name
                    }
                  </div>

                  <div
                    style={{
                      color: '#666',
                      fontSize: 12
                    }}
                  >
                    Uploaded successfully
                  </div>
                </div>

                <div
                  style={{
                    display: 'flex',
                    gap: 10
                  }}
                >
                  <button
                    onClick={() =>
                      window.open(
                        uploadedFiles[doc.id]
                          .preview,
                        '_blank'
                      )
                    }
                    style={buttonStyle}
                  >
                    <Eye size={16} />
                    View
                  </button>

                  <button
                    onClick={() =>
                      removeDocument(doc.id)
                    }
                    style={{
                      ...buttonStyle,
                      background: '#ef4444'
                    }}
                  >
                    <Trash2 size={16} />
                    Remove
                  </button>
                </div>
              </>
            ) : (
              <label
                style={{
                  ...buttonStyle,
                  display: 'inline-flex',
                  cursor: 'pointer'
                }}
              >
                <Upload size={16} />

                Upload

                <input
                  type="file"
                  hidden
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) =>
                    handleFileUpload(
                      e,
                      doc.id
                    )
                  }
                />
              </label>
            )}
          </div>
        ))}
      </div>

      {/* Submit */}

      <div
        style={{
          marginTop: 30,
          textAlign: 'center'
        }}
      >
        <button
          onClick={submitVerification}
          disabled={loading}
          style={{
            background: '#2563eb',
            color: '#fff',
            border: 'none',
            padding: '14px 28px',
            borderRadius: 12,
            fontSize: 16,
            cursor: 'pointer'
          }}
        >
          {loading
            ? 'Submitting...'
            : 'Submit Verification'}
        </button>
      </div>
    </div>
  )
}

const buttonStyle = {
  border: 'none',
  background: '#2563eb',
  color: '#fff',
  padding: '10px 14px',
  borderRadius: 10,
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  cursor: 'pointer',
  fontSize: 14
}

export default SellerDocumentVerification