import React, { useState, useEffect } from 'react'
import api from '../../lib/api'

// Simple Bar Chart Component
const BarChart = ({ data, maxValue }) => {
  if (!data || data.length === 0) return <div className="text-gray-500 text-sm">No data available</div>
  
  return (
    <div className="flex items-end justify-between gap-2 h-48">
      {data.map((item, index) => {
        const height = maxValue > 0 ? (item.value / maxValue) * 100 : 0
        return (
          <div key={index} className="flex-1 flex flex-col items-center gap-1">
            <div className="text-xs font-medium text-gray-700">₹{item.value}</div>
            <div 
              className="w-full bg-blue-500 rounded-t transition-all hover:bg-blue-600"
              style={{ height: `${height}%`, minHeight: item.value > 0 ? '8px' : '0px' }}
              title={`${item.label}: ₹${item.value}`}
            />
            <div className="text-xs text-gray-600 mt-1 text-center">{item.label}</div>
          </div>
        )
      })}
    </div>
  )
}

// Simple Pie Chart Component
const PieChart = ({ data }) => {
  if (!data || data.length === 0) return <div className="text-gray-500 text-sm">No data available</div>
  
  const total = data.reduce((sum, item) => sum + item.value, 0)
  const colors = ['bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-red-500', 'bg-purple-500', 'bg-pink-500']
  
  return (
    <div className="flex flex-col items-center">
      <div className="w-48 h-48 rounded-full overflow-hidden flex" style={{ transform: 'rotate(-90deg)' }}>
        {data.map((item, index) => {
          const percentage = total > 0 ? (item.value / total) * 100 : 0
          return (
            <div 
              key={index}
              className={colors[index % colors.length]}
              style={{ width: `${percentage}%` }}
              title={`${item.label}: ${percentage.toFixed(1)}%`}
            />
          )
        })}
      </div>
      <div className="mt-4 space-y-2 w-full">
        {data.map((item, index) => {
          const percentage = total > 0 ? (item.value / total) * 100 : 0
          return (
            <div key={index} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${colors[index % colors.length]}`} />
                <span className="text-gray-700">{item.label}</span>
              </div>
              <span className="font-medium">{percentage.toFixed(1)}%</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// Card Component
const StatCard = ({ title, value, subtitle, icon, color = 'bg-blue-100', textColor = 'text-blue-800' }) => (
  <div className={`rounded-xl border-2 ${color} p-6`}>
    <div className="flex items-start justify-between">
      <div>
        <div className="text-sm font-medium text-gray-600 mb-1">{title}</div>
        <div className={`text-3xl font-bold ${textColor}`}>{value}</div>
        {subtitle && <div className="text-xs text-gray-600 mt-1">{subtitle}</div>}
      </div>
      {icon && <div className="text-3xl">{icon}</div>}
    </div>
  </div>
)

export default function ReportsPage() {
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState('today')
  const [reportsData, setReportsData] = useState({
    dailyCollection: 0,
    pendingBills: 0,
    noShows: 0,
    totalReservations: 0,
    completedOrders: 0,
    cancelledOrders: 0,
    averageOrderValue: 0,
    totalRevenue: 0
  })
  const [chartData, setChartData] = useState({
    dailyRevenue: [],
    orderStatus: [],
    paymentMethods: [],
    topItems: []
  })

  useEffect(() => {
    fetchReportsData()
  }, [dateRange])

  const fetchReportsData = async () => {
    try {
      setLoading(true)
      
      // Fetch bills/analytics data
      const billsResponse = await api.get('/bills')
      const reservationsResponse = await api.get('/reservations')
      
      // Process bills data - bills are in nested structure
      let bills = []
      if (billsResponse && billsResponse.success && billsResponse.data) {
        // If bills are in nested structure (data.bills array)
        bills = billsResponse.data.bills || []
      } else if (billsResponse && billsResponse.bills) {
        // Direct bills array in response
        bills = billsResponse.bills
      } else if (Array.isArray(billsResponse)) {
        // Direct array response
        bills = billsResponse
      }

      // Process reservations data
      let reservations = []
      if (reservationsResponse && reservationsResponse.success) {
        reservations = reservationsResponse.reservations || []
      } else if (Array.isArray(reservationsResponse)) {
        reservations = reservationsResponse
      }

      // Filter data based on date range
      const now = new Date()
      const filteredBills = bills.filter(bill => {
        // Use billGeneratedAt for filtering
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

      const filteredReservations = reservations.filter(res => {
        const resDate = new Date(res.reservationDate)
        if (dateRange === 'today') {
          return resDate.toDateString() === now.toDateString()
        } else if (dateRange === 'week') {
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
          return resDate >= weekAgo
        } else if (dateRange === 'month') {
          return resDate.getMonth() === now.getMonth() && resDate.getFullYear() === now.getFullYear()
        }
        return true
      })

      // Calculate daily collection
      const paidBills = filteredBills.filter(bill => bill.paymentDetails?.paymentStatus === 'PAID')
      const dailyCollection = paidBills.reduce((sum, bill) => sum + (bill.paymentDetails?.grandTotal || 0), 0)

      // Calculate pending bills
      const pendingBillsCount = filteredBills.filter(bill => 
        bill.paymentDetails?.paymentStatus === 'PENDING' || bill.paymentDetails?.paymentStatus === 'PARTIAL'
      ).length
      const pendingAmount = filteredBills
        .filter(bill => bill.paymentDetails?.paymentStatus === 'PENDING' || bill.paymentDetails?.paymentStatus === 'PARTIAL')
        .reduce((sum, bill) => sum + (bill.paymentDetails?.grandTotal || 0), 0)

      // Calculate no-shows
      const noShowsCount = filteredReservations.filter(res => res.status === 'NO_SHOW').length

      // Calculate other stats
      const completedOrders = filteredBills.filter(bill => bill.paymentDetails?.paymentStatus === 'PAID').length
      const cancelledOrders = filteredBills.filter(bill => bill.paymentDetails?.paymentStatus === 'CANCELLED').length
      const averageOrderValue = completedOrders > 0 ? dailyCollection / completedOrders : 0

      // Prepare chart data - Daily Revenue (last 7 days)
      const dailyRevenueData = []
      for (let i = 6; i >= 0; i--) {
        const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
        const dayBills = bills.filter(bill => {
          const billDate = new Date(bill.billGeneratedAt)
          return billDate.toDateString() === date.toDateString() && bill.paymentDetails?.paymentStatus === 'PAID'
        })
        const dayRevenue = dayBills.reduce((sum, bill) => sum + (bill.paymentDetails?.grandTotal || 0), 0)
        dailyRevenueData.push({
          label: date.toLocaleDateString('en-US', { weekday: 'short' }),
          value: Math.round(dayRevenue)
        })
      }

      // Order Status Distribution
      const orderStatusData = [
        { label: 'Paid', value: paidBills.length },
        { label: 'Pending', value: filteredBills.filter(b => b.paymentDetails?.paymentStatus === 'PENDING').length },
        { label: 'Cancelled', value: cancelledOrders }
      ].filter(item => item.value > 0)

      // Payment Methods
      const paymentMethodsMap = {}
      paidBills.forEach(bill => {
        const method = bill.paymentDetails?.paymentMethod || 'CASH'
        paymentMethodsMap[method] = (paymentMethodsMap[method] || 0) + 1
      })
      const paymentMethodsData = Object.entries(paymentMethodsMap).map(([label, value]) => ({ label, value }))

      setReportsData({
        dailyCollection: Math.round(dailyCollection),
        pendingBills: pendingBillsCount,
        pendingAmount: Math.round(pendingAmount),
        noShows: noShowsCount,
        totalReservations: filteredReservations.length,
        completedOrders,
        cancelledOrders,
        averageOrderValue: Math.round(averageOrderValue),
        totalRevenue: Math.round(dailyCollection)
      })

      setChartData({
        dailyRevenue: dailyRevenueData,
        orderStatus: orderStatusData,
        paymentMethods: paymentMethodsData
      })

    } catch (err) {
      console.error('Error fetching reports data:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading reports...</p>
        </div>
      </div>
    )
  }

  const maxRevenueValue = Math.max(...chartData.dailyRevenue.map(d => d.value), 1)

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Reports & Analytics</h1>
          <p className="text-gray-600 mt-1">Track your business performance</p>
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
            onClick={() => fetchReportsData()}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-gray-800 text-white hover:bg-gray-700 transition-colors"
          >
            🔄 Refresh
          </button>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Daily Collection"
          value={`₹${reportsData.dailyCollection.toLocaleString()}`}
          subtitle={`${reportsData.completedOrders} completed orders`}
          icon="💰"
          color="bg-green-100"
          textColor="text-green-800"
        />
        <StatCard
          title="Pending Bills"
          value={reportsData.pendingBills}
          subtitle={`Worth ₹${reportsData.pendingAmount?.toLocaleString() || 0}`}
          icon="⏳"
          color="bg-yellow-100"
          textColor="text-yellow-800"
        />
        <StatCard
          title="No-Shows"
          value={reportsData.noShows}
          subtitle={`Out of ${reportsData.totalReservations} reservations`}
          icon="❌"
          color="bg-red-100"
          textColor="text-red-800"
        />
        <StatCard
          title="Avg Order Value"
          value={`₹${reportsData.averageOrderValue.toLocaleString()}`}
          subtitle="Per order"
          icon="📊"
          color="bg-blue-100"
          textColor="text-blue-800"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Revenue Chart */}
        <div className="bg-white rounded-xl shadow-md p-6 border">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Daily Revenue (Last 7 Days)</h2>
          <BarChart data={chartData.dailyRevenue} maxValue={maxRevenueValue} />
        </div>

        {/* Order Status Distribution */}
        <div className="bg-white rounded-xl shadow-md p-6 border">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Order Status Distribution</h2>
          {chartData.orderStatus.length > 0 ? (
            <PieChart data={chartData.orderStatus} />
          ) : (
            <div className="text-gray-500 text-center py-12">No orders yet</div>
          )}
        </div>

        {/* Payment Methods */}
        <div className="bg-white rounded-xl shadow-md p-6 border">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Payment Methods</h2>
          {chartData.paymentMethods.length > 0 ? (
            <div className="space-y-3">
              {chartData.paymentMethods.map((method, index) => {
                const total = chartData.paymentMethods.reduce((sum, m) => sum + m.value, 0)
                const percentage = total > 0 ? (method.value / total) * 100 : 0
                return (
                  <div key={index}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium text-gray-700">{method.label}</span>
                      <span className="text-gray-600">{method.value} orders ({percentage.toFixed(1)}%)</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-gray-500 text-center py-12">No payment data</div>
          )}
        </div>

        {/* Additional Stats */}
        <div className="bg-white rounded-xl shadow-md p-6 border">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Quick Stats</h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center py-3 border-b">
              <span className="text-gray-700 font-medium">Total Orders</span>
              <span className="text-2xl font-bold text-blue-600">{reportsData.completedOrders + reportsData.cancelledOrders}</span>
            </div>
            <div className="flex justify-between items-center py-3 border-b">
              <span className="text-gray-700 font-medium">Completed Orders</span>
              <span className="text-2xl font-bold text-green-600">{reportsData.completedOrders}</span>
            </div>
            <div className="flex justify-between items-center py-3 border-b">
              <span className="text-gray-700 font-medium">Cancelled Orders</span>
              <span className="text-2xl font-bold text-red-600">{reportsData.cancelledOrders}</span>
            </div>
            <div className="flex justify-between items-center py-3">
              <span className="text-gray-700 font-medium">Total Reservations</span>
              <span className="text-2xl font-bold text-purple-600">{reportsData.totalReservations}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Section */}
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
        <h2 className="text-2xl font-bold mb-2">Revenue Summary</h2>
        <p className="text-blue-100 mb-4">Performance overview for selected period</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <div className="text-blue-200 text-sm">Total Revenue</div>
            <div className="text-3xl font-bold">₹{reportsData.totalRevenue.toLocaleString()}</div>
          </div>
          <div>
            <div className="text-blue-200 text-sm">Completed Orders</div>
            <div className="text-3xl font-bold">{reportsData.completedOrders}</div>
          </div>
          <div>
            <div className="text-blue-200 text-sm">Success Rate</div>
            <div className="text-3xl font-bold">
              {reportsData.completedOrders + reportsData.cancelledOrders > 0
                ? ((reportsData.completedOrders / (reportsData.completedOrders + reportsData.cancelledOrders)) * 100).toFixed(1)
                : 0}%
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
