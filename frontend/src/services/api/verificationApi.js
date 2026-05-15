import api from './axiosConfig'

export const verificationApi = {
  // Seller verification
  submitSellerDocuments: (documents) => {
    const formData = new FormData()
    documents.forEach(doc => {
      formData.append('documents', doc.file)
      formData.append('document_types', doc.type)
    })
    return api.post('/verification/seller', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then(res => res.data)
  },
  
  // Landlord verification
  submitLandlordDocuments: (documents) => {
    const formData = new FormData()
    documents.forEach(doc => {
      formData.append('documents', doc.file)
      formData.append('document_types', doc.type)
    })
    return api.post('/verification/landlord', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then(res => res.data)
  },
  
  getVerificationStatus: () => api.get('/verification/status').then(res => res.data),
  
  getDocuments: () => api.get('/verification/documents').then(res => res.data),
  
  deleteDocument: (documentId) => api.delete(`/verification/documents/${documentId}`),
}

export default verificationApi
