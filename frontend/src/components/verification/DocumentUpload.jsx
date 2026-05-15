import React, { useState } from 'react'
import { Upload, FileText, Shield, Home, CheckCircle, X, Loader, AlertCircle } from 'lucide-react'
import toast from 'react-hot-toast'

const DocumentUpload = ({ onSuccess, onCancel }) => {
  const [uploadedFiles, setUploadedFiles] = useState({
    business_license: null,
    tax_certificate: null,
    government_id: null,
    property_documents: null
  })
  const [uploading, setUploading] = useState(false)

  const handleFileUpload = (type, file) => {
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`${file.name} is too large. Max 10MB`)
        return
      }
      
      const validTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg']
      if (!validTypes.includes(file.type)) {
        toast.error('Please upload PDF, JPG, or PNG files only')
        return
      }
      
      setUploadedFiles(prev => ({ ...prev, [type]: file }))
      toast.success(`${file.name} uploaded successfully`)
    }
  }

  const removeFile = (type) => {
    setUploadedFiles(prev => ({ ...prev, [type]: null }))
  }

  const handleSubmit = async () => {
    const missingDocs = []
    if (!uploadedFiles.business_license) missingDocs.push('Business License')
    if (!uploadedFiles.tax_certificate) missingDocs.push('Tax Clearance Certificate')
    if (!uploadedFiles.government_id) missingDocs.push('Government ID')
    if (!uploadedFiles.property_documents) missingDocs.push('Property Documents')
    
    if (missingDocs.length > 0) {
      toast.error(`Please upload: ${missingDocs.join(', ')}`)
      return
    }
    
    setUploading(true)
    try {
      await new Promise(resolve => setTimeout(resolve, 2000))
      toast.success('Documents submitted successfully! Awaiting admin approval.')
      if (onSuccess) onSuccess()
    } catch (error) {
      toast.error('Failed to submit documents. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  const allUploaded = uploadedFiles.business_license && 
                      uploadedFiles.tax_certificate && 
                      uploadedFiles.government_id && 
                      uploadedFiles.property_documents

  return (
    <div className="bg-white rounded-2xl shadow-xl border overflow-hidden">
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white">
        <div className="flex items-center gap-3">
          <Upload className="w-8 h-8" />
          <div>
            <h2 className="text-2xl font-bold">Upload Required Documents</h2>
            <p className="text-blue-100 mt-1">Please submit all required documents to activate your account</p>
          </div>
        </div>
      </div>
      
      <div className="p-6 space-y-6">
        {/* Business License */}
        <div className={`border-2 rounded-xl p-4 transition-all ${uploadedFiles.business_license ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-blue-300'}`}>
          <div className="flex items-start gap-4">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${uploadedFiles.business_license ? 'bg-green-100' : 'bg-blue-100'}`}>
              <FileText className={`w-6 h-6 ${uploadedFiles.business_license ? 'text-green-600' : 'text-blue-600'}`} />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-lg">Business License</h3>
                {uploadedFiles.business_license && <CheckCircle className="w-5 h-5 text-green-600" />}
              </div>
              <p className="text-sm text-gray-500 mb-3">Valid business license or trade registration</p>
              {!uploadedFiles.business_license ? (
                <label className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg cursor-pointer hover:bg-blue-700 transition-colors">
                  <Upload className="w-4 h-4" />
                  Upload File
                  <input 
                    type="file" 
                    className="hidden" 
                    onChange={(e) => handleFileUpload('business_license', e.target.files[0])}
                    accept=".pdf,.jpg,.jpeg,.png"
                  />
                </label>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-green-600">{uploadedFiles.business_license.name}</span>
                  <button onClick={() => removeFile('business_license')} className="p-1 hover:bg-gray-200 rounded">
                    <X className="w-4 h-4 text-red-500" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Tax Clearance Certificate */}
        <div className={`border-2 rounded-xl p-4 transition-all ${uploadedFiles.tax_certificate ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-blue-300'}`}>
          <div className="flex items-start gap-4">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${uploadedFiles.tax_certificate ? 'bg-green-100' : 'bg-green-100'}`}>
              <FileText className={`w-6 h-6 ${uploadedFiles.tax_certificate ? 'text-green-600' : 'text-green-600'}`} />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-lg">Tax Clearance Certificate</h3>
                {uploadedFiles.tax_certificate && <CheckCircle className="w-5 h-5 text-green-600" />}
              </div>
              <p className="text-sm text-gray-500 mb-3">Recent tax clearance certificate</p>
              {!uploadedFiles.tax_certificate ? (
                <label className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg cursor-pointer hover:bg-green-700 transition-colors">
                  <Upload className="w-4 h-4" />
                  Upload File
                  <input 
                    type="file" 
                    className="hidden" 
                    onChange={(e) => handleFileUpload('tax_certificate', e.target.files[0])}
                    accept=".pdf,.jpg,.jpeg,.png"
                  />
                </label>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-green-600">{uploadedFiles.tax_certificate.name}</span>
                  <button onClick={() => removeFile('tax_certificate')} className="p-1 hover:bg-gray-200 rounded">
                    <X className="w-4 h-4 text-red-500" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Government ID */}
        <div className={`border-2 rounded-xl p-4 transition-all ${uploadedFiles.government_id ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-blue-300'}`}>
          <div className="flex items-start gap-4">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${uploadedFiles.government_id ? 'bg-green-100' : 'bg-purple-100'}`}>
              <Shield className={`w-6 h-6 ${uploadedFiles.government_id ? 'text-green-600' : 'text-purple-600'}`} />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-lg">Government ID</h3>
                {uploadedFiles.government_id && <CheckCircle className="w-5 h-5 text-green-600" />}
              </div>
              <p className="text-sm text-gray-500 mb-3">Passport or national ID card</p>
              {!uploadedFiles.government_id ? (
                <label className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg cursor-pointer hover:bg-purple-700 transition-colors">
                  <Upload className="w-4 h-4" />
                  Upload File
                  <input 
                    type="file" 
                    className="hidden" 
                    onChange={(e) => handleFileUpload('government_id', e.target.files[0])}
                    accept=".pdf,.jpg,.jpeg,.png"
                  />
                </label>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-green-600">{uploadedFiles.government_id.name}</span>
                  <button onClick={() => removeFile('government_id')} className="p-1 hover:bg-gray-200 rounded">
                    <X className="w-4 h-4 text-red-500" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Property Documents */}
        <div className={`border-2 rounded-xl p-4 transition-all ${uploadedFiles.property_documents ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-blue-300'}`}>
          <div className="flex items-start gap-4">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${uploadedFiles.property_documents ? 'bg-green-100' : 'bg-orange-100'}`}>
              <Home className={`w-6 h-6 ${uploadedFiles.property_documents ? 'text-green-600' : 'text-orange-600'}`} />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-lg">Property Documents</h3>
                {uploadedFiles.property_documents && <CheckCircle className="w-5 h-5 text-green-600" />}
              </div>
              <p className="text-sm text-gray-500 mb-3">Property ownership proof or title deed</p>
              {!uploadedFiles.property_documents ? (
                <label className="inline-flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg cursor-pointer hover:bg-orange-700 transition-colors">
                  <Upload className="w-4 h-4" />
                  Upload File
                  <input 
                    type="file" 
                    className="hidden" 
                    onChange={(e) => handleFileUpload('property_documents', e.target.files[0])}
                    accept=".pdf,.jpg,.jpeg,.png"
                  />
                </label>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-green-600">{uploadedFiles.property_documents.name}</span>
                  <button onClick={() => removeFile('property_documents')} className="p-1 hover:bg-gray-200 rounded">
                    <X className="w-4 h-4 text-red-500" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="p-6 border-t bg-gray-50 flex justify-end gap-3">
        <button 
          onClick={onCancel}
          className="px-6 py-2 border rounded-lg hover:bg-gray-100 transition-colors"
        >
          Cancel
        </button>
        <button 
          onClick={handleSubmit}
          disabled={!allUploaded || uploading}
          className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
        >
          {uploading ? <Loader className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
          {uploading ? 'Submitting...' : 'Submit Documents'}
        </button>
      </div>
    </div>
  )
}

export default DocumentUpload