import React, { useState, useEffect, useMemo } from 'react'
import { useAuth } from '../../auth/AuthContext'
import api from '../../lib/api'

const STATUS_OPTIONS = [
  { value: 'VACANT', label: 'Vacant' },
  { value: 'OCCUPIED', label: 'Occupied' },
  { value: 'RESERVED', label: 'Reserved' },
  { value: 'MAINTENANCE', label: 'Maintenance' }
]

// ---------------- ANIMATED BACKGROUND SHAPES ----------------
const AnimatedShapes = () => (
  <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
    <div className="absolute top-20 left-10 w-72 h-72 bg-gradient-to-br from-purple-400/20 to-pink-400/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '0s' }}></div>
    <div className="absolute top-40 right-20 w-96 h-96 bg-gradient-to-br from-blue-400/20 to-cyan-400/20 rounded-full blur-3xl animate-float-slow" style={{ animationDelay: '2s' }}></div>
    <div className="absolute bottom-20 left-1/3 w-80 h-80 bg-gradient-to-br from-teal-400/20 to-emerald-400/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '4s' }}></div>
    <div className="absolute top-1/2 right-1/4 w-64 h-64 bg-gradient-to-br from-indigo-400/20 to-purple-400/20 rounded-full blur-3xl animate-float-slow" style={{ animationDelay: '1s' }}></div>
  </div>
)

// ---------------- CARD COMPONENT ----------------
const Card = ({ title, value, className, gradient }) => (
  <div className={`group relative flex-1 min-w-[180px] rounded-2xl p-5 backdrop-blur-sm bg-white/80 border border-white/50 shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105 overflow-hidden ${className || ''}`}>
    <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${gradient}`}></div>
    <div className="relative z-10">
      <div className="text-sm font-medium text-gray-600 mb-1">{title}</div>
      <div className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">{value}</div>
    </div>
    <div className="absolute -bottom-2 -right-2 w-20 h-20 bg-gradient-to-br from-white/40 to-transparent rounded-full blur-xl"></div>
  </div>
);

// ---------------- GUEST MODAL ----------------
const GuestModal = ({ table, onClose, onSave }) => {
  const [guest, setGuest] = useState(table.guest || { name: '', phone: '', groupSize: 1 });
  const [status, setStatus] = useState(table.status);

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-50 animate-fade-in">
      <div className="bg-white/90 backdrop-blur-xl rounded-3xl p-8 w-full max-w-md shadow-2xl space-y-5 border border-white/50 animate-scale-in">
        <h3 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-4">
          {table.tableId ? `Manage Table ${table.tableId}` : 'Add Walk-in Guest'}
        </h3>

        <div className="space-y-4">
          <input
            type="text"
            placeholder="Guest Name"
            value={guest.name}
            onChange={(e) => setGuest({ ...guest, name: e.target.value })}
            className="w-full border-2 border-purple-200 rounded-xl p-3 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all outline-none bg-white/80 backdrop-blur-sm"
          />

          <input
            type="number"
            min={1}
            placeholder="Group Size"
            value={guest.groupSize}
            onChange={(e) => setGuest({ ...guest, groupSize: +e.target.value })}
            className="w-full border-2 border-purple-200 rounded-xl p-3 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all outline-none bg-white/80 backdrop-blur-sm"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Table Status</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full border-2 border-purple-200 rounded-xl p-3 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all outline-none bg-white/80 backdrop-blur-sm"
          >
            <option value="VACANT">Vacant</option>
            <option value="RESERVED">Reserved</option>
            <option value="OCCUPIED">Occupied</option>
            <option value="MAINTENANCE">Maintenance</option>
          </select>
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <button
            onClick={onClose}
            className="px-6 py-3 rounded-xl border-2 border-gray-300 hover:bg-gray-100 transition-all font-medium"
          >
            Cancel
          </button>
          <button
            onClick={() => onSave(guest, status)}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:shadow-lg hover:scale-105 transition-all font-medium"
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
      case 'vacant': return 'bg-gradient-to-br from-emerald-100 to-teal-100 border-emerald-300 hover:shadow-emerald-200';
      case 'occupied': return 'bg-gradient-to-br from-blue-100 to-cyan-100 border-blue-300 hover:shadow-blue-200';
      case 'reserved': return 'bg-gradient-to-br from-purple-100 to-pink-100 border-purple-300 hover:shadow-purple-200';
      case 'maintenance': return 'bg-gradient-to-br from-amber-100 to-orange-100 border-amber-300 hover:shadow-amber-200';
      default: return 'bg-gradient-to-br from-gray-100 to-slate-100 border-gray-300 hover:shadow-gray-200';
    }
  };

  const getStatusBadgeColor = (status) => {
    switch (status.toLowerCase()) {
      case 'vacant': return 'bg-emerald-500 text-white';
      case 'occupied': return 'bg-blue-500 text-white';
      case 'reserved': return 'bg-purple-500 text-white';
      case 'maintenance': return 'bg-amber-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  return (
    <div className="relative group">
      <button
        onClick={onClick}
        onContextMenu={(e) => {
          e.preventDefault()
          if (onRightClick) onRightClick(table)
        }}
        disabled={isUpdating}
        className={`w-full h-36 rounded-2xl p-4 border-2 text-left transition-all duration-300 cursor-pointer relative flex flex-col justify-between hover:scale-105 hover:shadow-xl ${isUpdating
          ? 'opacity-75 cursor-not-allowed bg-gray-100 border-gray-300'
          : getStatusColor(table.status)
          }`}
      >
        {isUpdating && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm rounded-2xl">
            <div className="animate-spin rounded-full h-6 w-6 border-3 border-purple-600 border-t-transparent"></div>
          </div>
        )}

        <div className="flex-1 flex flex-col justify-start">
          <div className="font-bold text-xl leading-tight bg-gradient-to-r from-purple-700 to-blue-700 bg-clip-text text-transparent">{table.tableId}</div>
          <div className="text-sm text-gray-600 leading-tight mt-1.5 font-medium">{table.capacity} seats</div>
        </div>

        <div className="flex flex-col justify-end gap-2">
          <div className={`text-xs font-bold uppercase leading-tight px-3 py-1.5 rounded-full ${getStatusBadgeColor(table.status)}`}>
            {isUpdating ? 'Updating...' : table.status}
          </div>
          {table.guest && (
            <div className="text-xs text-gray-700 leading-tight truncate flex items-center font-medium">
              <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" />
              </svg>
              {table.guest.name} ({table.guest.groupSize})
            </div>
          )}
        </div>

        {/* Decorative gradient overlay */}
        <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-white/40 to-transparent rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
      </button>
    </div>
  );
};

// ---------------- FILTER TAB ----------------
const FilterTab = ({ active, onClick, children, count }) => (
  <button
    onClick={onClick}
    className={`px-4 py-2.5 rounded-xl border-2 text-sm font-medium transition-all duration-300 ${active
      ? 'bg-gradient-to-r from-purple-600 to-blue-600 border-transparent text-white shadow-lg scale-105'
      : 'bg-white/80 backdrop-blur-sm border-purple-200 text-gray-700 hover:border-purple-400 hover:shadow-md'
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
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-purple-200 border-t-purple-600 mx-auto"></div>
          <p className="mt-6 text-gray-600 font-medium">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-teal-50 relative">
      <AnimatedShapes />

      <div className="relative z-10 p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-700 via-blue-600 to-teal-600 bg-clip-text text-transparent mb-2">Reception Dashboard</h1>
            <p className="text-gray-700 font-medium">Welcome back, {user?.email}</p>
            <p className="text-sm text-gray-600 mt-1">
              {tablesData ? tablesData.hotelName : 'Loading...'}
            </p>
          </div>
          <button
            onClick={() => setShowAddForm(true)}
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl hover:shadow-xl hover:scale-105 transition-all duration-300 flex items-center font-medium group"
          >
            <svg className="w-5 h-5 mr-2 group-hover:rotate-90 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add New Table
          </button>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50/80 backdrop-blur-sm border-2 border-red-300 text-red-700 px-5 py-4 rounded-2xl mb-6 shadow-lg animate-scale-in">
            <div className="flex items-center justify-between">
              <span className="font-medium">{error}</span>
              <button
                onClick={() => setError(null)}
                className="ml-4 text-red-400 hover:text-red-600 transition-colors"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {/* STATUS CARDS */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-5 mb-8">
          <Card title="Vacant Tables" value={statusCounts.vacant} gradient="bg-gradient-to-br from-emerald-100/50 to-teal-100/50" />
          <Card title="Occupied" value={statusCounts.occupied} gradient="bg-gradient-to-br from-blue-100/50 to-cyan-100/50" />
          <Card title="Maintenance" value={statusCounts.maintenance} gradient="bg-gradient-to-br from-amber-100/50 to-orange-100/50" />
          <Card title="Reserved" value={statusCounts.reserved} gradient="bg-gradient-to-br from-purple-100/50 to-pink-100/50" />
        </div>

        {/* FILTER TABS */}
        <div className="flex flex-wrap gap-3 mb-8">
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
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
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
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🪑</div>
            <p className="text-gray-600 text-lg font-medium">
              {activeFilter === 'all' ? 'No tables available.' : `No ${activeFilter} tables found.`}
            </p>
          </div>
        )}

        {/* Add Table Modal */}
        {showAddForm && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
            <div className="bg-white/90 backdrop-blur-xl rounded-3xl p-8 w-full max-w-md mx-4 shadow-2xl border border-white/50 animate-scale-in">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">Add New Table</h2>
                <button
                  onClick={() => {
                    setShowAddForm(false)
                    setAddFormData({ tableId: '', capacity: 2, status: 'VACANT' })
                    setError(null)
                  }}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={addNewTable} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Table ID *
                  </label>
                  <input
                    type="text"
                    name="tableId"
                    value={addFormData.tableId}
                    onChange={handleAddFormChange}
                    placeholder="e.g., T01, Table-A1"
                    className="w-full border-2 border-purple-200 rounded-xl px-4 py-3 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all bg-white/80 backdrop-blur-sm"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Capacity (seats) *
                  </label>
                  <input
                    type="number"
                    name="capacity"
                    value={addFormData.capacity}
                    onChange={handleAddFormChange}
                    min="1"
                    max="20"
                    className="w-full border-2 border-purple-200 rounded-xl px-4 py-3 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all bg-white/80 backdrop-blur-sm"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Initial Status
                  </label>
                  <select
                    name="status"
                    value={addFormData.status}
                    onChange={handleAddFormChange}
                    className="w-full border-2 border-purple-200 rounded-xl px-4 py-3 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all bg-white/80 backdrop-blur-sm"
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
                    className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-3 rounded-xl hover:shadow-xl hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center font-medium transition-all duration-300"
                  >
                    {addingTable ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></div>
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
                    className="flex-1 bg-gray-200 text-gray-700 px-6 py-3 rounded-xl hover:bg-gray-300 transition-all font-medium"
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
          <div className="text-center text-sm text-gray-600 mt-10 font-medium">
            Last updated: {new Date(tablesData.lastUpdated).toLocaleString()}
          </div>
        )}
      </div>
    </div>
  )
}
