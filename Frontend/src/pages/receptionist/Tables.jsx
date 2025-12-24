import React, { useState, useEffect } from 'react'
import api from '../../lib/api'

const STATUS_COLORS = {
  VACANT: 'bg-green-100 text-green-800 border-green-200',
  OCCUPIED: 'bg-red-100 text-red-800 border-red-200',
  RESERVED: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  MAINTENANCE: 'bg-gray-100 text-gray-800 border-gray-200'
}

const STATUS_OPTIONS = [
  { value: 'VACANT', label: 'Vacant', color: 'text-green-600' },
  { value: 'OCCUPIED', label: 'Occupied', color: 'text-red-600' },
  { value: 'RESERVED', label: 'Reserved', color: 'text-yellow-600' },
  { value: 'MAINTENANCE', label: 'Maintenance', color: 'text-gray-600' }
]

export default function TablesPage() {
  const [tablesData, setTablesData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [updatingTable, setUpdatingTable] = useState(null)
  const [filter, setFilter] = useState('ALL')
  const [capacityFilter, setCapacityFilter] = useState('ALL')
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
        setError('Failed to load tables')
      }
    } catch (err) {
      console.error('Error fetching tables:', err)
      setError('Failed to connect to server')
    } finally {
      setLoading(false)
    }
  }

  const updateTableStatus = async (tableId, newStatus) => {
    try {
      setUpdatingTable(tableId)
      setError(null)
      
      const response = await api.put(`/tables/${tableId}/status`, {
        status: newStatus
      })
      
      if (response && response.success) {
        // Update the local state
        setTablesData(prev => ({
          ...prev,
          tables: prev.tables.map(table => 
            table.tableId === tableId 
              ? { ...table, status: newStatus, updatedAt: response.data.updatedAt }
              : table
          ),
          stats: {
            ...prev.stats,
            [prev.tables.find(t => t.tableId === tableId).status.toLowerCase()]: prev.stats[prev.tables.find(t => t.tableId === tableId).status.toLowerCase()] - 1,
            [newStatus.toLowerCase()]: prev.stats[newStatus.toLowerCase()] + 1
          }
        }))
      } else {
        setError(response?.message || 'Failed to update table status')
      }
    } catch (err) {
      console.error('Error updating table status:', err)
      setError('Failed to update table status')
    } finally {
      setUpdatingTable(null)
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
        // Add the new table to local state
        setTablesData(prev => ({
          ...prev,
          tables: [...prev.tables, response.data.table],
          stats: response.data.stats
        }))
        
        // Reset form and close
        setAddFormData({ tableId: '', capacity: 2, status: 'VACANT' })
        setShowAddForm(false)
        
        // Show success message briefly
        setTimeout(() => setError(null), 3000)
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

  const getFilteredTables = () => {
    if (!tablesData) return []
    
    let filtered = tablesData.tables.filter(table => table.isActive)
    
    if (filter !== 'ALL') {
      filtered = filtered.filter(table => table.status === filter)
    }
    
    if (capacityFilter !== 'ALL') {
      const capacity = parseInt(capacityFilter)
      filtered = filtered.filter(table => table.capacity === capacity)
    }
    
    return filtered
  }

  const uniqueCapacities = tablesData ? [...new Set(tablesData.tables.filter(t => t.isActive).map(t => t.capacity))].sort((a, b) => a - b) : []

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading tables...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-4">
        <h1 className="text-xl font-semibold text-slate-800">Table Management</h1>
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
          <div className="flex items-center justify-between">
            <span>{error}</span>
            <button 
              onClick={fetchTables}
              className="ml-4 px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    )
  }

  const filteredTables = getFilteredTables()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-800">Table Management</h1>
        <div className="flex space-x-3">
          <button 
            onClick={() => setShowAddForm(true)}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors flex items-center"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Table
          </button>
          <button 
            onClick={fetchTables}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      {tablesData && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <h3 className="text-sm font-medium text-gray-500">Total Tables</h3>
            <p className="text-2xl font-bold text-gray-900">{tablesData.stats.total}</p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <h3 className="text-sm font-medium text-green-600">Vacant</h3>
            <p className="text-2xl font-bold text-green-700">{tablesData.stats.vacant}</p>
          </div>
          <div className="bg-red-50 p-4 rounded-lg border border-red-200">
            <h3 className="text-sm font-medium text-red-600">Occupied</h3>
            <p className="text-2xl font-bold text-red-700">{tablesData.stats.occupied}</p>
          </div>
          <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
            <h3 className="text-sm font-medium text-yellow-600">Reserved</h3>
            <p className="text-2xl font-bold text-yellow-700">{tablesData.stats.reserved}</p>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <h3 className="text-sm font-medium text-gray-600">Maintenance</h3>
            <p className="text-2xl font-bold text-gray-700">{tablesData.stats.maintenance}</p>
          </div>
        </div>
      )}

      {/* Add Table Modal/Form */}
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
                  placeholder="e.g., T25, Table-01"
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

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-3 py-2 rounded-md text-sm">
                  {error}
                </div>
              )}

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
                    'Create Table'
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

      {/* Filters */}
      <div className="flex flex-wrap gap-4 items-center bg-white p-4 rounded-lg border">
        <div className="flex items-center space-x-2">
          <label className="text-sm font-medium text-gray-700">Status:</label>
          <select 
            value={filter} 
            onChange={(e) => setFilter(e.target.value)}
            className="border border-gray-300 rounded px-2 py-1 text-sm"
          >
            <option value="ALL">All Statuses</option>
            {STATUS_OPTIONS.map(status => (
              <option key={status.value} value={status.value}>{status.label}</option>
            ))}
          </select>
        </div>
        
        <div className="flex items-center space-x-2">
          <label className="text-sm font-medium text-gray-700">Capacity:</label>
          <select 
            value={capacityFilter} 
            onChange={(e) => setCapacityFilter(e.target.value)}
            className="border border-gray-300 rounded px-2 py-1 text-sm"
          >
            <option value="ALL">All Capacities</option>
            {uniqueCapacities.map(capacity => (
              <option key={capacity} value={capacity}>{capacity} seats</option>
            ))}
          </select>
        </div>
        
        <div className="text-sm text-gray-600">
          Showing {filteredTables.length} of {tablesData?.stats.total || 0} tables
        </div>
      </div>

      {/* Tables Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
        {filteredTables.map((table) => (
          <div key={table.tableId} className={`bg-white border-2 rounded-lg p-4 transition-all hover:shadow-md ${
            STATUS_COLORS[table.status] || 'border-gray-200'
          }`}>
            <div className="flex justify-between items-start mb-3">
              <h3 className="font-bold text-lg">{table.tableId}</h3>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                STATUS_COLORS[table.status] || 'bg-gray-100 text-gray-800'
              }`}>
                {table.status}
              </span>
            </div>
            
            <div className="mb-3">
              <p className="text-sm text-gray-600">
                Capacity: <span className="font-medium">{table.capacity} seats</span>
              </p>
              <p className="text-xs text-gray-500">
                Updated: {new Date(table.updatedAt).toLocaleString()}
              </p>
            </div>
            
            <div className="space-y-2">
              <label className="block text-xs font-medium text-gray-700">Change Status:</label>
              <select 
                value={table.status}
                onChange={(e) => updateTableStatus(table.tableId, e.target.value)}
                disabled={updatingTable === table.tableId}
                className="w-full text-sm border border-gray-300 rounded px-2 py-1 disabled:opacity-50"
              >
                {STATUS_OPTIONS.map(status => (
                  <option key={status.value} value={status.value} className={status.color}>
                    {status.label}
                  </option>
                ))}
              </select>
              {updatingTable === table.tableId && (
                <div className="text-xs text-blue-600 flex items-center">
                  <div className="animate-spin rounded-full h-3 w-3 border border-blue-600 border-t-transparent mr-1"></div>
                  Updating...
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {filteredTables.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No tables found matching the current filters.</p>
        </div>
      )}
    </div>
  )
}
