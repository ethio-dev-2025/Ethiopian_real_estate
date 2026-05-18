import React from 'react'
import MessagesPage from '../../messages/MessagesPage'

const SellerMessages = () => {
  return (
    <div>
      <div className="mb-4"> 
      </div>
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden" style={{ height: 'calc(100vh - 180px)' }}>
        <MessagesPage />
      </div>
    </div>
  )
}

export default SellerMessages