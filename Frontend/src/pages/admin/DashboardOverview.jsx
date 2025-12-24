import React, { useState, useEffect } from 'react'
import axios from 'axios'

export default function DashboardOverview(){
  const [range, setRange] = useState('today')
  const [analytics, setAnalytics] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchAnalytics()
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchAnalytics, 30000)
    return () => clearInterval(interval)
  }, [range])

  const fetchAnalytics = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('authToken')
      const response = await axios.get(
        `http://localhost:5000/api/analytics/dashboard?range=${range}`,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      
      if (response.data.success) {
        setAnalytics(response.data.data)
        setError(null)
      }
    } catch (err) {
      console.error('Failed to fetch analytics:', err)
      setError(err.response?.data?.message || 'Failed to load analytics')
    } finally {
      setLoading(false)
    }
  }

  const getOccupancyBadge = (rate) => {
    const numRate = parseFloat(rate)
    if (numRate >= 80) return { bg: 'bg-red-50', text: 'text-red-700', label: 'High' }
    if (numRate >= 50) return { bg: 'bg-yellow-50', text: 'text-yellow-700', label: 'Medium' }
    return { bg: 'bg-green-50', text: 'text-green-700', label: 'Low' }
  }

  const getTurnaroundBadge = (mins) => {
    if (mins <= 15) return { bg: 'bg-green-50', text: 'text-green-700', label: 'Excellent' }
    if (mins <= 25) return { bg: 'bg-yellow-50', text: 'text-yellow-700', label: 'Good' }
    return { bg: 'bg-red-50', text: 'text-red-700', label: 'Needs Attention' }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'OCCUPIED': return 'bg-red-500'
      case 'VACANT': return 'bg-green-500'
      case 'RESERVED': return 'bg-blue-500'
      case 'MAINTENANCE': return 'bg-gray-500'
      default: return 'bg-gray-400'
    }
  }

  const getOrderStatusColor = (status) => {
    switch (status) {
      case 'PENDING': return 'text-orange-600'
      case 'PREPARING': return 'text-blue-600'
      case 'READY': return 'text-green-600'
      default: return 'text-gray-600'
    }
  }

  if (loading && !analytics) {
    return (
      <div className="p-6 flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading dashboard analytics...</p>
        </div>
      </div>
    )
  }

  if (error && !analytics) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
          <p className="text-red-800 font-medium">⚠️ {error}</p>
          <button 
            onClick={fetchAnalytics}
            className="mt-3 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  const overview = analytics?.overview || {}
  const tables = analytics?.tables || {}
  const orders = analytics?.orders || {}
  const revenue = analytics?.revenue || {}
  const occupancyBadge = getOccupancyBadge(overview.occupancyRate || '0')
  const turnaroundBadge = getTurnaroundBadge(overview.avgTurnaroundMinutes || 0)

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Business Overview</h1>
          <p className="text-sm text-slate-500 mt-1">Real-time analytics and performance metrics</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={()=>setRange('today')} className={`px-3 py-1 rounded ${range==='today' ? 'bg-blue-50 text-blue-700 font-medium' : 'text-slate-600 hover:bg-slate-100'}`}>Today</button>
          <button onClick={()=>setRange('7d')} className={`px-3 py-1 rounded ${range==='7d' ? 'bg-blue-50 text-blue-700 font-medium' : 'text-slate-600 hover:bg-slate-100'}`}>7 Days</button>
          <button onClick={()=>setRange('30d')} className={`px-3 py-1 rounded ${range==='30d' ? 'bg-blue-50 text-blue-700 font-medium' : 'text-slate-600 hover:bg-slate-100'}`}>30 Days</button>
          <button 
            onClick={fetchAnalytics}
            className="ml-2 px-3 py-1 rounded text-slate-600 hover:bg-slate-100"
            title="Refresh"
          >
            🔄
          </button>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4 flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div>
              <div className="text-sm text-slate-500">Occupancy Rate</div>
              <div className="text-2xl font-semibold mt-2">{overview.occupancyRate || '0%'}</div>
              <div className="text-xs text-slate-600 mt-1">{overview.activeTables || '0/0'} tables</div>
            </div>
            <div className={`text-xs px-2 py-1 ${occupancyBadge.bg} rounded-full ${occupancyBadge.text}`}>
              {occupancyBadge.label}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4 flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div>
              <div className="text-sm text-slate-500">Total Revenue</div>
              <div className="text-2xl font-semibold mt-2">₹{(overview.totalRevenue || 0).toFixed(2)}</div>
              <div className="text-xs text-slate-600 mt-1">{revenue.billCount || 0} bills paid</div>
            </div>
            <div className="text-xs px-2 py-1 bg-green-50 rounded-full text-green-700">
              {revenue.billCount > 0 ? 'Active' : 'No Sales'}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4 flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div>
              <div className="text-sm text-slate-500">Pending Amount</div>
              <div className="text-2xl font-semibold mt-2">₹{(overview.pendingAmount || 0).toFixed(2)}</div>
              <div className="text-xs text-slate-600 mt-1">{orders.pending + orders.preparing + orders.ready || 0} active orders</div>
            </div>
            <div className="text-xs px-2 py-1 bg-orange-50 rounded-full text-orange-700">
              Pending
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4 flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div>
              <div className="text-sm text-slate-500">Avg Turnaround</div>
              <div className="text-2xl font-semibold mt-2">{overview.avgTurnaroundDisplay || '0 mins'}</div>
              <div className="text-xs text-slate-600 mt-1">{orders.completed || 0} completed</div>
            </div>
            <div className={`text-xs px-2 py-1 ${turnaroundBadge.bg} rounded-full ${turnaroundBadge.text}`}>
              {turnaroundBadge.label}
            </div>
          </div>
        </div>
      </div>

      {/* Table Status Overview */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Table Status Summary</h2>
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span className="text-sm">Vacant</span>
            </div>
            <span className="font-semibold">{tables.stats?.vacant || 0}</span>
          </div>
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <span className="text-sm">Occupied</span>
            </div>
            <span className="font-semibold">{tables.stats?.occupied || 0}</span>
          </div>
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500"></div>
              <span className="text-sm">Reserved</span>
            </div>
            <span className="font-semibold">{tables.stats?.reserved || 0}</span>
          </div>
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-gray-500"></div>
              <span className="text-sm">Maintenance</span>
            </div>
            <span className="font-semibold">{tables.stats?.maintenance || 0}</span>
          </div>
          <div className="pt-2 mt-2 border-t flex justify-between items-center">
            <span className="text-sm font-medium">Total Active Tables</span>
            <span className="font-bold text-lg">{tables.stats?.total || 0}</span>
          </div>
        </div>
      </div>

      {/* Table Details with Timers */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Live Table Overview</h2>
          <span className="text-xs text-slate-500">Real-time status and order timers</span>
        </div>
        
        {tables.details && tables.details.length > 0 ? (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(200px,200px))] gap-4 justify-start">
            {tables.details.map((table) => (
              <div 
                key={table.tableId} 
                className={`border rounded-lg p-4 w-[200px] h-[180px] flex flex-col ${
                  table.status === 'OCCUPIED' ? 'border-red-300 bg-red-50' :
                  table.status === 'RESERVED' ? 'border-blue-300 bg-blue-50' :
                  table.status === 'MAINTENANCE' ? 'border-gray-300 bg-gray-50' :
                  'border-green-300 bg-green-50'
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="min-w-0">
                    <div className="font-semibold truncate">{table.tableId}</div>
                    <div className="text-xs text-slate-600">Cap: {table.capacity}</div>
                  </div>
                  <div className={`w-3 h-3 rounded-full flex-shrink-0 ${getStatusColor(table.status)}`}></div>
                </div>
                
                <div className="text-xs font-medium mb-2">{table.status}</div>
                
                {table.orderTimer && (
                  <div className="mt-auto pt-3 border-t border-slate-200">
                    <div className="text-xs text-slate-600 mb-1">Active Order</div>
                    <div className={`text-xs font-medium truncate ${getOrderStatusColor(table.orderTimer.status)}`}>
                      {table.orderTimer.status}
                    </div>
                    <div className="text-xs text-slate-600 mt-1">
                      ⏱️ {table.orderTimer.minutesElapsed} min
                    </div>
                  </div>
                )}
                
                {!table.orderTimer && table.status === 'OCCUPIED' && (
                  <div className="mt-auto pt-3 border-t border-slate-200 text-xs text-slate-500">
                    No active order
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-slate-500">
            <p>No tables found</p>
          </div>
        )}
      </div>
    </div>
  )
}
