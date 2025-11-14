import React, { useState, useEffect } from 'react'
import axios from 'axios'

export default function InventoryAnalytics(){
  const [analytics, setAnalytics] = useState({ 
    lowStock: [], 
    totalItems: 0, 
    totalValue: 0, 
    categoryBreakdown: {} 
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchAnalytics = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('authToken')
      const response = await axios.get(
        'http://localhost:5000/api/menu/analytics',
        { headers: { Authorization: `Bearer ${token}` } }
      )
      
      if (response.data.success) {
        setAnalytics(response.data.data)
        setError(null)
      } else {
        setError(response.data.message || 'Failed to load analytics')
      }
    } catch (err) {
      console.error('Failed to fetch analytics:', err)
      setError(err.response?.data?.message || 'Failed to load analytics')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchAnalytics() }, [])

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-slate-600">Loading analytics...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
          <p className="text-red-800">⚠️ {error}</p>
          <button 
            onClick={fetchAnalytics}
            className="mt-2 px-3 py-1 bg-red-600 text-white rounded text-sm"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div>
      <h3 className="text-lg font-medium mb-3">Inventory Analytics</h3>
      
      {/* Summary Cards */}
      <div className="grid md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-4 rounded shadow">
          <h4 className="font-medium text-gray-600">Total Items</h4>
          <p className="text-2xl font-bold text-blue-600">{analytics.totalItems}</p>
        </div>
        <div className="bg-white p-4 rounded shadow">
          <h4 className="font-medium text-gray-600">Total Value</h4>
          <p className="text-2xl font-bold text-green-600">₹{analytics.totalValue}</p>
        </div>
        <div className="bg-white p-4 rounded shadow">
          <h4 className="font-medium text-gray-600">Low Stock Items</h4>
          <p className="text-2xl font-bold text-red-600">{analytics.lowStock.length}</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {/* Low Stock Items */}
        <div className="bg-white p-4 rounded shadow">
          <h4 className="font-medium mb-3">Low Stock Alert</h4>
          {analytics.lowStock.length === 0 ? (
            <p className="text-gray-500 text-sm">All items are well stocked! 🎉</p>
          ) : (
            <div className="space-y-2">
              {analytics.lowStock.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center p-2 bg-red-50 rounded">
                  <span className="text-sm font-medium">{item.name}</span>
                  <span className="text-sm text-red-600">
                    {item.currentStock} {item.unit} (threshold: {item.threshold})
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Category Breakdown */}
        <div className="bg-white p-4 rounded shadow">
          <h4 className="font-medium mb-3">Category Breakdown</h4>
          {Object.keys(analytics.categoryBreakdown).length === 0 ? (
            <p className="text-gray-500 text-sm">No categories found</p>
          ) : (
            <div className="space-y-2">
              {Object.entries(analytics.categoryBreakdown).map(([category, data]) => (
                <div key={category} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                  <div>
                    <span className="text-sm font-medium capitalize">{category}</span>
                    <span className="text-xs text-gray-500 ml-2">({data.count} items)</span>
                  </div>
                  <span className="text-sm text-green-600">₹{data.totalValue.toFixed(2)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
