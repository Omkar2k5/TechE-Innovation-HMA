import React, { useState, useEffect } from 'react'
import api from '../../lib/api'

const STATUS_OPTIONS = [
  { value: 'VACANT', label: 'Vacant' },
  { value: 'OCCUPIED', label: 'Occupied' },
  { value: 'RESERVED', label: 'Reserved' },
  { value: 'MAINTENANCE', label: 'Maintenance' }
]

export default function TablesDashboard() {
  const [tablesData, setTablesData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [addingTable, setAddingTable] = useState(false)
  const [addFormData, setAddFormData] = useState({
    tableId: '',
    capacity: 2,
    status: 'VACANT'
  })

  // Fetch tables on component mount
  useEffect(() => {
    fetchTables()
  }, [])

  const fetchTables = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await api.get('/tables')
      
      if (response && response.success) {
        setTablesData(response.data)
      } else {
        setError('Failed to load table information')
      }
    } catch (err) {
      console.error('Error fetching tables:', err)
      setError('Failed to connect to server')
    } finally {
      setLoading(false)
    }
  }

  const addNewTable = async (e) => {
    e.preventDefault()
    
    if (!addFormData.tableId.trim()) {
      setError('Table ID is required')
      return
    }
    
    if (addFormData.capacity < 1) {
      setError('Capacity must be at least 1')
      return
    }
    
    try {
      setAddingTable(true)
      setError(null)
      
      const response = await api.post('/tables', {
        tableId: addFormData.tableId.trim(),
        capacity: parseInt(addFormData.capacity),
        status: addFormData.status
      })
      
      if (response && response.success) {
        // Update the local state with new table data
        setTablesData(prev => ({
          ...prev,
          tables: [...prev.tables, response.data.table],
          stats: response.data.stats
        }))
        
        // Reset form and close
        setAddFormData({ tableId: '', capacity: 2, status: 'VACANT' })
        setShowAddForm(false)
        
        // Refresh data to ensure consistency
        fetchTables()
      } else {
        setError(response?.message || 'Failed to create table')
      }
    } catch (err) {
      console.error('Error creating table:', err)
      setError('Failed to create table')
    } finally {
      setAddingTable(false)
    }
  }

  const handleAddFormChange = (e) => {
    const { name, value } = e.target
    setAddFormData(prev => ({
      ...prev,
      [name]: name === 'capacity' ? parseInt(value) || 1 : value
    }))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading table information...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-800">Table Management</h1>
        <button 
          onClick={() => setShowAddForm(true)}
          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors flex items-center"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add New Table
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
          <div className="flex items-center justify-between">
            <span>{error}</span>
            <button 
              onClick={() => setError(null)}
              className="ml-4 text-red-400 hover:text-red-600"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Hotel Information */}
      {tablesData && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              {tablesData.hotelName}
            </h2>
            <div className="text-6xl font-bold text-blue-600 mb-4">
              {tablesData.stats.total}
            </div>
            <p className="text-lg text-gray-600 mb-6">
              Total Tables in Restaurant
            </p>
            
            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-green-50 p-3 rounded-lg">
                <div className="text-2xl font-bold text-green-700">
                  {tablesData.stats.vacant}
                </div>
                <div className="text-sm text-green-600">Vacant</div>
              </div>
              <div className="bg-red-50 p-3 rounded-lg">
                <div className="text-2xl font-bold text-red-700">
                  {tablesData.stats.occupied}
                </div>
                <div className="text-sm text-red-600">Occupied</div>
              </div>
              <div className="bg-yellow-50 p-3 rounded-lg">
                <div className="text-2xl font-bold text-yellow-700">
                  {tablesData.stats.reserved}
                </div>
                <div className="text-sm text-yellow-600">Reserved</div>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="text-2xl font-bold text-gray-700">
                  {tablesData.stats.maintenance}
                </div>
                <div className="text-sm text-gray-600">Maintenance</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Table Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">Add New Table</h2>
              <button 
                onClick={() => {
                  setShowAddForm(false)
                  setAddFormData({ tableId: '', capacity: 2, status: 'VACANT' })
                  setError(null)
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={addNewTable} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Table ID *
                </label>
                <input
                  type="text"
                  name="tableId"
                  value={addFormData.tableId}
                  onChange={handleAddFormChange}
                  placeholder="e.g., T01, Table-A1"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Capacity (seats) *
                </label>
                <input
                  type="number"
                  name="capacity"
                  value={addFormData.capacity}
                  onChange={handleAddFormChange}
                  min="1"
                  max="20"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Initial Status
                </label>
                <select
                  name="status"
                  value={addFormData.status}
                  onChange={handleAddFormChange}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                >
                  {STATUS_OPTIONS.map(status => (
                    <option key={status.value} value={status.value}>
                      {status.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="submit"
                  disabled={addingTable}
                  className="flex-1 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {addingTable ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                      Creating...
                    </>
                  ) : (
                    'Add Table'
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddForm(false)
                    setAddFormData({ tableId: '', capacity: 2, status: 'VACANT' })
                    setError(null)
                  }}
                  className="flex-1 bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button 
            onClick={fetchTables}
            className="flex items-center justify-center p-4 border-2 border-blue-300 rounded-lg hover:bg-blue-50 transition-colors"
          >
            <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span className="text-blue-600 font-medium">Refresh Data</span>
          </button>
          
          <button 
            onClick={() => setShowAddForm(true)}
            className="flex items-center justify-center p-4 border-2 border-green-300 rounded-lg hover:bg-green-50 transition-colors"
          >
            <svg className="w-5 h-5 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span className="text-green-600 font-medium">Add New Table</span>
          </button>
        </div>
      </div>

      {/* Footer Info */}
      {tablesData && (
        <div className="text-center text-sm text-gray-500">
          Last updated: {new Date(tablesData.lastUpdated).toLocaleString()}
        </div>
      )}
    </div>
  )
}