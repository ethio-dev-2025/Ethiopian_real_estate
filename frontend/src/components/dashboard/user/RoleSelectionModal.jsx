import React, { memo, useCallback } from 'react'
import { X, Store, Home, Building2 } from 'lucide-react'

const RoleSelectionModal = memo(({ onClose, onSelectRole }) => {
  const handleSelect = useCallback((role) => {
    onSelectRole(role)
  }, [onSelectRole])

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
        <div className="p-6 border-b flex justify-between items-center">
          <h2 className="text-2xl font-bold">Select Role to Activate</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-6 space-y-4">
          <button onClick={() => handleSelect('seller')} className="w-full p-4 border-2 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition flex items-center gap-4"><div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center"><Store className="w-6 h-6 text-blue-600" /></div><div className="text-left"><h3 className="font-semibold">Seller Account</h3><p className="text-sm text-gray-500">List properties for sale</p></div></button>
          <button onClick={() => handleSelect('landlord')} className="w-full p-4 border-2 rounded-xl hover:border-green-500 hover:bg-green-50 transition flex items-center gap-4"><div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center"><Home className="w-6 h-6 text-green-600" /></div><div className="text-left"><h3 className="font-semibold">Landlord Account</h3><p className="text-sm text-gray-500">List properties for rent</p></div></button>
          <button onClick={() => handleSelect('both')} className="w-full p-4 border-2 rounded-xl hover:border-purple-500 hover:bg-purple-50 transition flex items-center gap-4"><div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center"><Building2 className="w-6 h-6 text-purple-600" /></div><div className="text-left"><h3 className="font-semibold">Both</h3><p className="text-sm text-gray-500">Get both seller and landlord features</p></div></button>
        </div>
      </div>
    </div>
  )
})

RoleSelectionModal.displayName = 'RoleSelectionModal'

export default RoleSelectionModal