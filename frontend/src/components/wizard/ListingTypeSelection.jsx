import React from 'react'
import { Home, Building2, Briefcase, ArrowRight, X } from 'lucide-react'

const ListingTypeSelection = ({ onSelect, onClose }) => {
  const listingTypes = [
    {
      id: 'sale',
      title: 'For Sale',
      description: 'List your property for sale',
      icon: Home,
      color: 'blue',
      features: [
        'Sell property to buyers',
        'Set your asking price',
        'Professional property photos',
        'Virtual tours for serious buyers'
      ]
    },
    {
      id: 'rent',
      title: 'For Rent',
      description: 'List your property for rent',
      icon: Building2,
      color: 'green',
      features: [
        'Find qualified tenants',
        'Set monthly rent amount',
        'Lease agreement templates',
        'Tenant management tools'
      ]
    }
  ]

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full">
        <div className="p-6 border-b flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Choose Listing Type</h2>
            <p className="text-sm text-gray-500 mt-1">Select what type of listing you want to create</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {listingTypes.map((type) => {
              const Icon = type.icon
              const colorClasses = {
                blue: 'from-blue-600 to-blue-700',
                green: 'from-green-600 to-green-700'
              }
              
              return (
                <button
                  key={type.id}
                  onClick={() => onSelect(type.id)}
                  className="group relative bg-white border-2 rounded-xl p-6 text-left hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                >
                  <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${colorClasses[type.color]} rounded-t-xl`}></div>
                  <div className={`w-12 h-12 bg-gradient-to-r ${colorClasses[type.color]} rounded-xl flex items-center justify-center mb-4`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{type.title}</h3>
                  <p className="text-gray-500 text-sm mb-4">{type.description}</p>
                  <ul className="space-y-2 mb-6">
                    {type.features.map((feature, idx) => (
                      <li key={idx} className="flex items-center gap-2 text-sm text-gray-600">
                        <div className={`w-1.5 h-1.5 rounded-full bg-${type.color === 'blue' ? 'blue' : 'green'}-500`}></div>
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <div className={`flex items-center gap-2 text-${type.color}-600 font-semibold group-hover:gap-3 transition-all`}>
                    Continue <ArrowRight className="w-4 h-4" />
                  </div>
                </button>
              )
            })}
          </div>
        </div>
        
        <div className="p-6 border-t bg-gray-50 rounded-b-2xl">
          <p className="text-xs text-center text-gray-500">
            You can create both sale and rent listings. Choose the appropriate type for your property.
          </p>
        </div>
      </div>
    </div>
  )
}

export default ListingTypeSelection