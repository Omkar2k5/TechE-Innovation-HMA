import React, { useState, useEffect } from "react"
import api from "../../lib/api"

// Simple Bar Chart for Horizontal Display
const HorizontalBarChart = ({ data, maxValue, color = "bg-blue-500" }) => {
  if (!data || data.length === 0) return <div className="text-gray-500 text-sm">No data available</div>
  
  return (
    <div className="space-y-3">
      {data.map((item, index) => {
        const percentage = maxValue > 0 ? (item.value / maxValue) * 100 : 0
        return (
          <div key={index}>
            <div className="flex justify-between text-sm mb-1">
              <span className="font-medium text-gray-700">{item.label}</span>
              <span className="text-gray-600">{item.value} {item.unit || 'orders'}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className={`${color} h-3 rounded-full transition-all`}
                style={{ width: `${percentage}%` }}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}

// Time Chart for Busiest Hours
const TimeChart = ({ data }) => {
  if (!data || data.length === 0) return <div className="text-gray-500 text-sm">No data available</div>
  
  const maxValue = Math.max(...data.map(d => d.value), 1)
  
  return (
    <div className="flex items-end justify-between gap-2 h-64">
      {data.map((item, index) => {
        const height = maxValue > 0 ? (item.value / maxValue) * 100 : 0
        const isHot = height > 66
        const isMedium = height > 33 && height <= 66
        const color = isHot ? 'bg-red-500' : isMedium ? 'bg-orange-500' : 'bg-green-500'
        
        return (
          <div key={index} className="flex-1 flex flex-col items-center gap-1">
            <div className="text-xs font-medium text-gray-700">{item.value}</div>
            <div 
              className={`w-full ${color} rounded-t transition-all hover:opacity-80`}
              style={{ height: `${height}%`, minHeight: item.value > 0 ? '8px' : '0px' }}
              title={`${item.label}: ${item.value} orders`}
            />
            <div className="text-xs text-gray-600 mt-1 text-center transform -rotate-45 origin-top-left">
              {item.label}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// Stats Card Component
const StatsCard = ({ title, value, subtitle, icon, trend, color = "bg-blue-100", textColor = "text-blue-800" }) => (
  <div className={`rounded-xl border-2 ${color} p-6 relative overflow-hidden`}>
    <div className="flex items-start justify-between">
      <div className="flex-1">
        <div className="text-sm font-medium text-gray-600 mb-1">{title}</div>
        <div className={`text-3xl font-bold ${textColor}`}>{value}</div>
        {subtitle && <div className="text-xs text-gray-600 mt-1">{subtitle}</div>}
        {trend && (
          <div className={`text-xs font-medium mt-2 ${
            trend.direction === 'up' ? 'text-green-600' : trend.direction === 'down' ? 'text-red-600' : 'text-gray-600'
          }`}>
            {trend.direction === 'up' ? '↑' : trend.direction === 'down' ? '↓' : '→'} {trend.value}
          </div>
        )}
      </div>
      {icon && <div className="text-4xl opacity-50">{icon}</div>}
    </div>
  </div>
)

export default function PerformanceAnalysis() {
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState('week')
  const [tablePerformance, setTablePerformance] = useState([])
  const [busiestHours, setBusiestHours] = useState([])
  const [summaryStats, setSummaryStats] = useState({
    totalOrders: 0,
    totalRevenue: 0,
    avgOrderValue: 0
  })

  useEffect(() => {
    fetchPerformanceData()
  }, [dateRange])

  const fetchPerformanceData = async () => {
    try {
      setLoading(true)
      
      // Fetch bills data
      const billsResponse = await api.get('/bills')
      const tablesResponse = await api.get('/tables')
      
      let bills = []
      if (billsResponse && billsResponse.success && billsResponse.data) {
        bills = billsResponse.data.bills || []
      } else if (billsResponse && billsResponse.bills) {
        bills = billsResponse.bills
      } else if (Array.isArray(billsResponse)) {
        bills = billsResponse
      }

      let tables = []
      if (tablesResponse && tablesResponse.success && tablesResponse.data) {
        tables = tablesResponse.data.tables || []
      }

      // Filter bills by date range
      const now = new Date()
      const filteredBills = bills.filter(bill => {
        const billDate = new Date(bill.billGeneratedAt)
        if (dateRange === 'today') {
          return billDate.toDateString() === now.toDateString()
        } else if (dateRange === 'week') {
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
          return billDate >= weekAgo
        } else if (dateRange === 'month') {
          return billDate.getMonth() === now.getMonth() && billDate.getFullYear() === now.getFullYear()
        }
        return true
      })

      // Calculate Table Performance
      const tablePerformanceMap = {}
      filteredBills.forEach(bill => {
        const tableId = bill.tableId
        if (!tablePerformanceMap[tableId]) {
          tablePerformanceMap[tableId] = {
            orders: 0,
            revenue: 0,
            avgOrderValue: 0
          }
        }
        tablePerformanceMap[tableId].orders++
        tablePerformanceMap[tableId].revenue += bill.paymentDetails?.grandTotal || 0
      })

      const tablePerformanceData = Object.entries(tablePerformanceMap)
        .map(([tableId, stats]) => ({
          label: `Table ${tableId}`,
          value: stats.orders,
          revenue: Math.round(stats.revenue),
          avgValue: stats.orders > 0 ? Math.round(stats.revenue / stats.orders) : 0,
          unit: 'orders'
        }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 10) // Top 10 tables

      // Calculate Busiest Hours
      const hourlyOrders = Array(24).fill(0)
      filteredBills.forEach(bill => {
        const billDate = new Date(bill.billGeneratedAt)
        const hour = billDate.getHours()
        hourlyOrders[hour]++
      })

      // Group hours into meaningful time slots
      const timeSlots = [
        { label: '6AM', hours: [6], value: 0 },
        { label: '7AM', hours: [7], value: 0 },
        { label: '8AM', hours: [8], value: 0 },
        { label: '9AM', hours: [9], value: 0 },
        { label: '10AM', hours: [10], value: 0 },
        { label: '11AM', hours: [11], value: 0 },
        { label: '12PM', hours: [12], value: 0 },
        { label: '1PM', hours: [13], value: 0 },
        { label: '2PM', hours: [14], value: 0 },
        { label: '3PM', hours: [15], value: 0 },
        { label: '4PM', hours: [16], value: 0 },
        { label: '5PM', hours: [17], value: 0 },
        { label: '6PM', hours: [18], value: 0 },
        { label: '7PM', hours: [19], value: 0 },
        { label: '8PM', hours: [20], value: 0 },
        { label: '9PM', hours: [21], value: 0 },
        { label: '10PM', hours: [22], value: 0 },
        { label: '11PM', hours: [23], value: 0 }
      ]

      timeSlots.forEach(slot => {
        slot.hours.forEach(hour => {
          slot.value += hourlyOrders[hour]
        })
      })

      // Calculate Summary Stats
      const totalOrders = filteredBills.length
      const totalRevenue = filteredBills.reduce((sum, bill) => sum + (bill.paymentDetails?.grandTotal || 0), 0)
      const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0

      setTablePerformance(tablePerformanceData)
      setBusiestHours(timeSlots)
      setSummaryStats({
        totalOrders,
        totalRevenue: Math.round(totalRevenue),
        avgOrderValue: Math.round(avgOrderValue)
      })

    } catch (err) {
      console.error('Error fetching performance data:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading performance data...</p>
        </div>
      </div>
    )
  }

  const maxTableOrders = Math.max(...tablePerformance.map(t => t.value), 1)

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Performance Analysis</h1>
          <p className="text-gray-600 mt-1">Track staff, tables, and operational efficiency</p>
        </div>
        
        {/* Date Range Selector */}
        <div className="flex gap-2">
          <button
            onClick={() => setDateRange('today')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              dateRange === 'today' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Today
          </button>
          <button
            onClick={() => setDateRange('week')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              dateRange === 'week' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            This Week
          </button>
          <button
            onClick={() => setDateRange('month')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              dateRange === 'month' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            This Month
          </button>
          <button
            onClick={() => fetchPerformanceData()}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-gray-800 text-white hover:bg-gray-700 transition-colors"
          >
            🔄 Refresh
          </button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatsCard
          title="Total Orders"
          value={summaryStats.totalOrders}
          subtitle="All orders processed"
          icon="📦"
          color="bg-blue-100"
          textColor="text-blue-800"
        />
        <StatsCard
          title="Total Revenue"
          value={`₹${summaryStats.totalRevenue.toLocaleString()}`}
          subtitle="From all orders"
          icon="💰"
          color="bg-green-100"
          textColor="text-green-800"
        />
        <StatsCard
          title="Avg Order Value"
          value={`₹${summaryStats.avgOrderValue.toLocaleString()}`}
          subtitle="Per order"
          icon="📊"
          color="bg-purple-100"
          textColor="text-purple-800"
        />
      </div>

      {/* Table Performance */}
      <div className="bg-white rounded-xl shadow-md p-6 border">
        <h2 className="text-xl font-bold text-gray-800 mb-4">🪑 Table Performance</h2>
        {tablePerformance.length > 0 ? (
          <HorizontalBarChart 
            data={tablePerformance} 
            maxValue={maxTableOrders}
            color="bg-indigo-500"
          />
        ) : (
          <div className="text-gray-500 text-center py-12">No table data available</div>
        )}
        {tablePerformance.length > 0 && (
          <div className="mt-4 pt-4 border-t">
            <div className="text-sm text-gray-600">Top performing tables by order volume</div>
          </div>
        )}
      </div>

      {/* Busiest Hours Chart */}
      <div className="bg-white rounded-xl shadow-md p-6 border">
        <h2 className="text-xl font-bold text-gray-800 mb-4">⏰ Busiest Hours</h2>
        <p className="text-sm text-gray-600 mb-4">Order distribution throughout the day</p>
        {busiestHours.length > 0 ? (
          <>
            <TimeChart data={busiestHours} />
            <div className="mt-6 flex items-center justify-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-green-500 rounded"></div>
                <span className="text-gray-600">Low (0-33%)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-orange-500 rounded"></div>
                <span className="text-gray-600">Medium (34-66%)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-red-500 rounded"></div>
                <span className="text-gray-600">High (67-100%)</span>
              </div>
            </div>
          </>        ) : (
          <div className="text-gray-500 text-center py-12">No hourly data available</div>
        )}
      </div>

    </div>
  )
}
