import React, { useState } from 'react'
import { Upload, FileText, CheckCircle, AlertCircle, X } from 'lucide-react'
import toast from 'react-hot-toast'

const API_URL = 'http://localhost:8000/api'

const DocumentVerification = ({ user, onDocumentsUpdated }) => {
  const [uploading, setUploading] = useState(false)
  const [documents, setDocuments] = useState({
    business_license: null,
    tax_id: null,
    government_id: null,
    property_title: null
  })

  const handleFileUpload = async (docType, file) => {
    if (!file) return
    
    setUploading(true)
    try {
      const token = localStorage.getItem('access_token')
      const formData = new FormData()
      formData.append('file', file)
      formData.append('document_type', docType)
      
      const response = await fetch(`${API_URL}/users/upload-document`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      })
      
      if (response.ok) {
        setDocuments(prev => ({ ...prev, [docType]: true }))
        toast.success(`${docType} uploaded successfully`)
        if (onDocumentsUpdated) onDocumentsUpdated()
      } else {
        toast.error('Upload failed')
      }
    } catch (error) {
      console.error('Upload error:', error)
      toast.error('Error uploading document')
    } finally {
      setUploading(false)
    }
  }

  const documentTypes = [
    { id: 'business_license', label: 'Business License', required: true, icon: FileText },
    { id: 'tax_id', label: 'Tax ID / TIN', required: true, icon: FileText },
    { id: 'government_id', label: 'Government ID', required: true, icon: FileText },
    { id: 'property_title', label: 'Property Title Deed', required: false, icon: FileText }
  ]

  return (
    <div className="bg-white rounded-2xl shadow-sm border p-6">
      <h2 className="text-2xl font-bold mb-2">Document Verification</h2>
      <p className="text-gray-500 mb-6">Upload the required documents to verify your account</p>
      
      <div className="space-y-4">
        {documentTypes.map((doc) => {
          const Icon = doc.icon
          const isUploaded = documents[doc.id]
          
          return (
            <div key={doc.id} className="border rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${isUploaded ? 'bg-green-100' : 'bg-gray-100'}`}>
                    <Icon className={`w-5 h-5 ${isUploaded ? 'text-green-600' : 'text-gray-600'}`} />
                  </div>
                  <div>
                    <p className="font-medium">{doc.label}</p>
                    <p className="text-xs text-gray-500">
                      {doc.required ? 'Required' : 'Optional'} • PDF, JPG, or PNG
                    </p>
                  </div>
                </div>
                
                {isUploaded ? (
                  <span className="flex items-center gap-1 text-green-600 text-sm">
                    <CheckCircle className="w-4 h-4" /> Uploaded
                  </span>
                ) : (
                  <label className="cursor-pointer">
                    <input
                      type="file"
                      className="hidden"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => {
                        if (e.target.files?.[0]) {
                          handleFileUpload(doc.id, e.target.files[0])
                        }
                      }}
                    />
                    <span className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition flex items-center gap-2">
                      <Upload className="w-4 h-4" /> Upload
                    </span>
                  </label>
                )}
              </div>
            </div>
          )
        })}
      </div>
      
      {uploading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-3"></div>
            <p className="text-gray-600">Uploading document...</p>
          </div>
        </div>
      )}
    </div>
  )
}

export default DocumentVerification