import React from 'react'

const TestSidebar = ({ activeTab, setActiveTab }) => {
  return (
    <div className="fixed left-0 top-0 h-full w-48 bg-gray-800 text-white p-4 z-50">
      <h3 className="font-bold mb-4">Test Menu</h3>
      <button
        onClick={() => {
          console.log('Clicking - My Listings')
          setActiveTab('my-listings')
        }}
        className={`w-full text-left p-2 mb-2 rounded ${activeTab === 'my-listings' ? 'bg-blue-600' : 'bg-gray-700'}`}
      >
        My Listings
      </button>
      <button
        onClick={() => {
          console.log('Clicking - My Properties')
          setActiveTab('my-properties')
        }}
        className={`w-full text-left p-2 rounded ${activeTab === 'my-properties' ? 'bg-green-600' : 'bg-gray-700'}`}
      >
        My Properties
      </button>
      <div className="mt-4 p-2 bg-gray-700 rounded">
        Current: {activeTab}
      </div>
    </div>
  )
}

export default TestSidebar