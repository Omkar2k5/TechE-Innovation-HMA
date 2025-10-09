import React, { useState, useEffect, useMemo } from 'react'
import { useAuth } from '../../auth/AuthContext'
import api from '../../lib/api'

const STATUS_OPTIONS = [
  { value: 'VACANT', label: 'Vacant' },
  { value: 'OCCUPIED', label: 'Occupied' },
  { value: 'RESERVED', label: 'Reserved' },
  { value: 'MAINTENANCE', label: 'Maintenance' }
]

// ---------------- CARD COMPONENT ----------------
const Card = ({ title, value, className }) => (
  <div className={`flex-1 min-w-[180px] rounded-xl border p-4 ${className || ''}`}>
    <div className="text-sm text-slate-600">{title}</div>
    <div className="text-2xl font-semibold">{value}</div>
  </div>
);

// ---------------- GUEST MODAL ----------------
const GuestModal = ({ table, onClose, onSave }) => {
  const [guest, setGuest] = useState(table.guest || { name: '', phone: '', groupSize: 1 });
  const [status, setStatus] = useState(table.status);

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl space-y-4">
        <h3 className="text-lg font-semibold text-slate-800 mb-2">
          {table.tableId ? `Manage Table ${table.tableId}` : 'Add Walk-in Guest'}
        </h3>

        <div className="space-y-3">
          <input
            type="text"
            placeholder="Guest Name"
            value={guest.name}
            onChange={(e) => setGuest({ ...guest, name: e.target.value })}
            className="w-full border rounded-md p-2"
          />

          <input
            type="number"
            min={1}
            placeholder="Group Size"
            value={guest.groupSize}
            onChange={(e) => setGuest({ ...guest, groupSize: +e.target.value })}
            className="w-full border rounded-md p-2"
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm text-slate-600">Table Status</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full border rounded-md p-2"
          >
            <option value="VACANT">Vacant</option>
            <option value="RESERVED">Reserved</option>
            <option value="OCCUPIED">Occupied</option>
            <option value="MAINTENANCE">Maintenance</option>
          </select>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-md border border-slate-300 hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            onClick={() => onSave(guest, status)}
            className="px-4 py-2 rounded-md bg-slate-800 text-white hover:bg-slate-700"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

// ---------------- TABLE CARD ----------------
const TableCard = ({ table, onClick, onRightClick, isUpdating }) => {
  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'vacant': return 'bg-green-100 border-green-300 hover:bg-green-200';
      case 'occupied': return 'bg-blue-100 border-blue-300 hover:bg-blue-200';
      case 'reserved': return 'bg-purple-100 border-purple-300 hover:bg-purple-200';
      case 'maintenance': return 'bg-yellow-100 border-yellow-300 hover:bg-yellow-200';
      default: return 'bg-gray-100 border-gray-300 hover:bg-gray-200';
    }
  };

  const getStatusTextColor = (status) => {
    switch (status.toLowerCase()) {
      case 'vacant': return 'text-green-800';
      case 'occupied': return 'text-blue-800';
      case 'reserved': return 'text-purple-800';
      case 'maintenance': return 'text-yellow-800';
      default: return 'text-gray-800';
    }
  };

  return (
    <button
      onClick={onClick}
      onContextMenu={(e) => {
        e.preventDefault()
        if (onRightClick) onRightClick(table)
      }}
      disabled={isUpdating}
      className={`w-full h-28 rounded-lg p-3 border-2 text-left transition-colors cursor-pointer relative flex flex-col justify-between ${
        isUpdating 
          ? 'opacity-75 cursor-not-allowed bg-gray-100 border-gray-300' 
          : getStatusColor(table.status)
      }`}
    >
      {isUpdating && (
        <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75 rounded-lg">
          <div className="animate-spin rounded-full h-5 w-5 border-2 border-slate-600 border-t-transparent"></div>
        </div>
      )}
      
      <div className="flex-1 flex flex-col justify-start">
        <div className="font-bold text-lg leading-tight">{table.tableId}</div>
        <div className="text-sm text-gray-600 leading-tight mt-1">{table.capacity} seats</div>
      </div>
      
      <div className="flex flex-col h-10 justify-end">
        <div className={`text-xs font-medium uppercase leading-tight mb-1 ${getStatusTextColor(table.status)}`}>
          {isUpdating ? 'Updating...' : table.status}
        </div>
        <div className="text-xs text-slate-700 leading-tight truncate h-4 flex items-center">
          {table.guest ? `${table.guest.name} (${table.guest.groupSize})` : ''}
        </div>
      </div>
    </button>
  );
};

// ---------------- FILTER TAB ----------------
const FilterTab = ({ active, onClick, children, count }) => (
  <button
    onClick={onClick}
    className={`px-3 py-1.5 rounded-md border text-sm transition-colors ${
      active
        ? 'bg-slate-800 border-slate-800 text-white'
        : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
    }`}
  >
    {children} {count !== undefined && `(${count})`}
  </button>
);

export default function ReceptionistDashboard() {
  const { user } = useAuth()
  const [tablesData, setTablesData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [addingTable, setAddingTable] = useState(false)
  const [selectedTable, setSelectedTable] = useState(null)
  const [activeFilter, setActiveFilter] = useState('all')
  const [updatingTable, setUpdatingTable] = useState(null)
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
          tables: [...(prev?.tables || []), response.data.table],
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

  // ---------------- STATS ----------------
  const statusCounts = useMemo(() => {
    if (!tablesData || !tablesData.tables) return { vacant: 0, occupied: 0, reserved: 0, maintenance: 0 }
    
    return {
      vacant: tablesData.stats?.vacant || 0,
      occupied: tablesData.stats?.occupied || 0,
      reserved: tablesData.stats?.reserved || 0,
      maintenance: tablesData.stats?.maintenance || 0
    }
  }, [tablesData])

  // ---------------- STATUS CYCLING LOGIC ----------------
  const getNextStatus = (currentStatus) => {
    const statusFlow = ['VACANT', 'RESERVED', 'OCCUPIED', 'MAINTENANCE']
    const currentIndex = statusFlow.indexOf(currentStatus)
    return statusFlow[(currentIndex + 1) % statusFlow.length]
  }

  // ---------------- HANDLE TABLE CLICK ----------------
  const handleTableClick = async (table) => {
    // Prevent multiple simultaneous updates
    if (updatingTable === table.tableId) return
    
    const nextStatus = getNextStatus(table.status)
    
    try {
      setError(null)
      setUpdatingTable(table.tableId)
      
      // Call API to update table status
      const response = await api.put(`/tables/${table.tableId}/status`, {
        status: nextStatus
      })
      
      if (response && response.success) {
        // Update local state with new status
        setTablesData(prev => ({
          ...prev,
          tables: prev.tables.map(t =>
            t.tableId === table.tableId
              ? { ...t, status: nextStatus, updatedAt: response.data.updatedAt || new Date().toISOString() }
              : t
          ),
          // Update stats to reflect the status change
          stats: {
            ...prev.stats,
            [table.status.toLowerCase()]: Math.max(0, prev.stats[table.status.toLowerCase()] - 1),
            [nextStatus.toLowerCase()]: prev.stats[nextStatus.toLowerCase()] + 1
          }
        }))
        
        // Auto-manage guest info based on status
        if (nextStatus === 'RESERVED' || nextStatus === 'OCCUPIED') {
          // Auto-assign guest for reserved/occupied tables
          const defaultGuest = {
            name: nextStatus === 'RESERVED' ? 'Reserved Guest' : 'Walk-in Guest',
            groupSize: Math.min(table.capacity, 2)
          }
          
          setTablesData(prev => ({
            ...prev,
            tables: prev.tables.map(t =>
              t.tableId === table.tableId
                ? { ...t, guest: defaultGuest }
                : t
            )
          }))
        } else if (nextStatus === 'VACANT' || nextStatus === 'MAINTENANCE') {
          // Clear guest info for vacant/maintenance tables
          setTablesData(prev => ({
            ...prev,
            tables: prev.tables.map(t =>
              t.tableId === table.tableId
                ? { ...t, guest: undefined }
                : t
            )
          }))
        }
      } else {
        setError(response?.message || 'Failed to update table status')
      }
    } catch (err) {
      console.error('Error updating table status:', err)
      setError('Failed to update table status. Please try again.')
    } finally {
      setUpdatingTable(null)
    }
  }

  // ---------------- HANDLE RIGHT CLICK FOR GUEST MANAGEMENT ----------------
  const handleTableRightClick = (table) => {
    setSelectedTable(table)
  }

  const handleSaveTable = async (guest, status) => {
    if (!selectedTable) return
    
    try {
      setError(null)
      // Here you can add API call to update table status and guest info
      // For now, we'll just update the local state
      setTablesData(prev => ({
        ...prev,
        tables: prev.tables.map(t =>
          t.tableId === selectedTable.tableId
            ? { ...t, guest: status === 'VACANT' ? undefined : guest, status }
            : t
        ),
        stats: {
          ...prev.stats,
          // Update stats based on status change - this would ideally be handled by backend
        }
      }))
      setSelectedTable(null)
      
      // Refresh data to ensure consistency
      fetchTables()
    } catch (err) {
      console.error('Error updating table:', err)
      setError('Failed to update table')
    }
  }

  // ---------------- FILTERED TABLES ----------------
  const filteredTables = useMemo(() => {
    if (!tablesData || !tablesData.tables) return []
    
    const tables = tablesData.tables.filter(t => t.isActive)
    
    if (activeFilter === 'all') return tables
    return tables.filter(t =>
      activeFilter === 'vacant' ? t.status === 'VACANT' :
      activeFilter === 'reserved' ? t.status === 'RESERVED' :
      activeFilter === 'maintenance' ? t.status === 'MAINTENANCE' :
      activeFilter === 'occupied' ? t.status === 'OCCUPIED' :
      true
    )
  }, [tablesData, activeFilter])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Reception Dashboard</h1>
          <p className="text-slate-600 mt-1">Welcome back, {user?.email}</p>
          <p className="text-sm text-slate-500 mt-1">
            {tablesData ? tablesData.hotelName : 'Loading...'}
          </p>
        </div>
        <button 
          onClick={() => setShowAddForm(true)}
          className="px-4 py-2 bg-slate-800 text-white rounded-md hover:bg-slate-700 transition-colors flex items-center"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add New Table
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md mb-6">
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

      {/* STATUS CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card title="Vacant Tables" value={statusCounts.vacant} className="bg-green-100 text-green-800" />
        <Card title="Occupied" value={statusCounts.occupied} className="bg-blue-100 text-blue-800" />
        <Card title="Maintenance" value={statusCounts.maintenance} className="bg-yellow-100 text-yellow-800" />
        <Card title="Reserved" value={statusCounts.reserved} className="bg-purple-100 text-purple-800" />
      </div>

      {/* FILTER TABS */}
      <div className="flex flex-wrap gap-2 mb-6">
        {[
          { key: 'all', label: 'All', count: tablesData?.stats?.total || 0 },
          { key: 'vacant', label: 'Vacant', count: statusCounts.vacant },
          { key: 'reserved', label: 'Reserved', count: statusCounts.reserved },
          { key: 'maintenance', label: 'Maintenance', count: statusCounts.maintenance },
          { key: 'occupied', label: 'Occupied', count: statusCounts.occupied }
        ].map(f => (
          <FilterTab
            key={f.key}
            active={activeFilter === f.key}
            onClick={() => setActiveFilter(f.key)}
            count={f.count}
          >
            {f.label}
          </FilterTab>
        ))}
      </div>

      {/* TABLE GRID */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {filteredTables.map(table => (
          <TableCard 
            key={table.tableId} 
            table={table} 
            onClick={() => handleTableClick(table)}
            onRightClick={handleTableRightClick}
            isUpdating={updatingTable === table.tableId}
          />
        ))}
      </div>

      {/* Empty State */}
      {filteredTables.length === 0 && !loading && (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">
            {activeFilter === 'all' ? 'No tables available.' : `No ${activeFilter} tables found.`}
          </p>
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
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500"
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
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500"
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
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500"
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
                  className="flex-1 bg-slate-800 text-white px-4 py-2 rounded-md hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
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

      {/* Guest Management Modal */}
      {selectedTable && (
        <GuestModal
          table={selectedTable}
          onClose={() => setSelectedTable(null)}
          onSave={handleSaveTable}
        />
      )}

      {/* Footer Info */}
      {tablesData && (
        <div className="text-center text-sm text-gray-500 mt-8">
          Last updated: {new Date(tablesData.lastUpdated).toLocaleString()}
        </div>
      )}
    </div>
  )
}
