import React, { useState, useEffect, useMemo } from 'react'
import { useAuth } from '../../auth/AuthContext'
import api from '../../lib/api'

// Card Component
const Card = ({ title, value, className }) => (
  <div className={`flex-1 min-w-[180px] rounded-xl border p-4 ${className || ''}`}>
    <div className="text-sm text-slate-600">{title}</div>
    <div className="text-2xl font-semibold">{value}</div>
  </div>
)

// Elapsed Timer Component (shows time since order placed, stops when cooking starts)
const ElapsedTimer = ({ since, orderStatus }) => {
  const [elapsed, setElapsed] = useState(0)
  const [isStopped, setIsStopped] = useState(false)
  
  useEffect(() => {
    // Stop timer if order has started cooking (status is not PENDING)
    if (orderStatus && orderStatus !== 'PENDING') {
      setIsStopped(true)
      // Calculate final elapsed time when it stopped
      const diff = Math.floor((Date.now() - new Date(since).getTime()) / 1000)
      setElapsed(Math.max(0, diff))
      return
    }
    
    setIsStopped(false)
    
    const updateElapsed = () => {
      const diff = Math.floor((Date.now() - new Date(since).getTime()) / 1000)
      setElapsed(Math.max(0, diff))
    }
    
    updateElapsed()
    const interval = setInterval(updateElapsed, 1000)
    
    return () => clearInterval(interval)
  }, [since, orderStatus])
  
  const minutes = Math.floor(elapsed / 60)
  const seconds = elapsed % 60
  
  return (
    <span className="font-mono text-sm font-semibold text-slate-600">
      {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
    </span>
  )
}

// Countdown Timer Component (shows time remaining until estimated completion)
const CountdownTimer = ({ estimatedCompletionTime, orderStatus }) => {
  const [remaining, setRemaining] = useState(0)
  const [isOvertime, setIsOvertime] = useState(false)
  const [isStopped, setIsStopped] = useState(false)
  
  useEffect(() => {
    // Stop timer if order is READY or SERVED and set to 00:00
    if (orderStatus === 'READY' || orderStatus === 'SERVED') {
      setIsStopped(true)
      setRemaining(0)
      setIsOvertime(false)
      return
    }
    
    setIsStopped(false)
    
    const updateRemaining = () => {
      const now = Date.now()
      const completionTime = new Date(estimatedCompletionTime).getTime()
      const diff = Math.floor((completionTime - now) / 1000)
      
      if (diff < 0) {
        setIsOvertime(true)
        setRemaining(Math.abs(diff))
      } else {
        setIsOvertime(false)
        setRemaining(diff)
      }
    }
    
    updateRemaining()
    const interval = setInterval(updateRemaining, 1000)
    
    return () => clearInterval(interval)
  }, [estimatedCompletionTime, orderStatus])
  
  const minutes = Math.floor(remaining / 60)
  const seconds = remaining % 60
  
  return (
    <span className={`font-mono text-sm font-bold ${
      isStopped ? 'text-green-600' :
      isOvertime ? 'text-red-600' : 
      remaining < 60 ? 'text-orange-600' : 
      'text-blue-600'
    }`}>
      {!isStopped && isOvertime && '+'}
      {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
      {!isStopped && isOvertime && ' OVERTIME'}
    </span>
  )
}

// Cooking Timer Component (shows elapsed time since cooking started - matches manager app exactly)
const CookingTimer = ({ item, orderStartTime }) => {
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [isActive, setIsActive] = useState(false)

  useEffect(() => {
    // Calculate start time: use item.startedAt if available, otherwise use order.orderTime.startedPreparationAt
    // This matches the manager app logic exactly
    const itemStartTime = item.startedAt ? new Date(item.startedAt).getTime() : 
                         (orderStartTime ? new Date(orderStartTime).getTime() : null)
    
    // Only show timer if cooking has started and item is not ready
    const shouldShowTimer = itemStartTime && item.status !== 'READY' && item.status !== 'SERVED'
    
    setIsActive(shouldShowTimer)
    
    if (!shouldShowTimer) {
      setElapsedSeconds(0)
      return
    }
    
    // Calculate elapsed time - use the same calculation as manager app
    // Calculate on every render to ensure exact synchronization
    const calculateElapsed = () => {
      const now = Date.now()
      // Use Math.floor to match manager app exactly
      const elapsed = Math.floor((now - itemStartTime) / 1000)
      return Math.max(0, elapsed)
    }
    
    // Set initial value
    setElapsedSeconds(calculateElapsed())
    
    // Update every second - synchronized with manager app
    const interval = setInterval(() => {
      setElapsedSeconds(calculateElapsed())
    }, 1000)
    
    return () => clearInterval(interval)
  }, [item.startedAt, item.status, orderStartTime])

  if (!isActive) {
    if (item.status === 'READY') {
      return (
        <div className="mt-2 flex items-center gap-2 px-2 py-1 bg-green-100 rounded text-xs">
          <span className="text-green-800 font-semibold">✓ Ready</span>
        </div>
      )
    }
    if (item.status === 'PENDING') {
      return (
        <div className="mt-2 flex items-center gap-2 px-2 py-1 bg-amber-100 rounded text-xs">
          <span className="text-amber-800 font-semibold">⏳ Waiting to start</span>
        </div>
      )
    }
    return null
  }

  const minutes = Math.floor(elapsedSeconds / 60)
  const seconds = elapsedSeconds % 60
  const formatted = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`

  return (
    <div className="mt-2 flex items-center gap-2 px-2 py-1 bg-blue-100 rounded text-xs">
      <span className="text-blue-800 font-semibold">⏱️ Cooking Time:</span>
      <span className="text-blue-800 font-mono font-bold">{formatted}</span>
    </div>
  )
}

// Item Card Component
const ItemCard = ({ item, orderStartTime, onStatusChange, onShortage }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'PENDING': return 'bg-amber-100 text-amber-800 border-amber-300'
      case 'PREPARING': return 'bg-blue-100 text-blue-800 border-blue-300'
      case 'READY': return 'bg-green-100 text-green-800 border-green-300'
      default: return 'bg-gray-100 text-gray-800 border-gray-300'
    }
  }
  
  return (
    <div className="bg-white rounded-lg border p-4">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h4 className="font-semibold text-slate-900">{item.itemName}</h4>
          <div className="flex items-center gap-3 mt-1 text-sm text-slate-600">
            <span>Qty: {item.quantity}</span>
            {item.preparationTimeMinutes && (
              <span className="flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {item.preparationTimeMinutes} min
              </span>
            )}
          </div>
          {item.specialInstructions && (
            <div className="mt-2 text-xs bg-amber-50 text-amber-800 px-2 py-1 rounded">
              📝 {item.specialInstructions}
            </div>
          )}
          {/* Timer display below each dish - matches manager app */}
          <CookingTimer item={item} orderStartTime={orderStartTime} />
        </div>
        <span className={`px-3 py-1 rounded-md border-2 text-xs font-semibold ${getStatusColor(item.status)}`}>
          {item.status}
        </span>
      </div>
      
      <div className="flex items-center gap-2">
        <button
          onClick={() => onStatusChange('PREPARING')}
          disabled={item.status === 'READY'}
          className={`flex-1 px-3 py-2 rounded-md text-sm font-medium border transition-colors ${
            item.status === 'PREPARING'
              ? 'bg-blue-600 text-white border-blue-600'
              : 'bg-white text-blue-700 border-blue-300 hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed'
          }`}
        >
          {item.status === 'PREPARING' ? '🔥 Cooking' : 'Start Cooking'}
        </button>
        <button
          onClick={() => onStatusChange('READY')}
          disabled={item.status === 'PENDING'}
          className={`flex-1 px-3 py-2 rounded-md text-sm font-medium border transition-colors ${
            item.status === 'READY'
              ? 'bg-green-600 text-white border-green-600'
              : 'bg-white text-green-700 border-green-300 hover:bg-green-50 disabled:opacity-50 disabled:cursor-not-allowed'
          }`}
        >
          ✓ Ready
        </button>
        <button
          onClick={onShortage}
          className="px-3 py-2 rounded-md text-sm font-medium border bg-white text-amber-700 border-amber-300 hover:bg-amber-50 transition-colors"
          title="Report ingredient shortage"
        >
          ⚠️
        </button>
      </div>
    </div>
  )
}

// Shortage Modal
const ShortageModal = ({ isOpen, onClose, onSubmit, orderInfo }) => {
  const [ingredient, setIngredient] = useState('')
  const [quantity, setQuantity] = useState('')
  
  useEffect(() => {
    if (isOpen) {
      setIngredient('')
      setQuantity('')
    }
  }, [isOpen])
  
  if (!isOpen) return null
  
  const handleSubmit = () => {
    if (!ingredient.trim()) return
    onSubmit({ ingredient: ingredient.trim(), quantity: quantity ? parseInt(quantity) : null })
  }
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl w-full max-w-md mx-4 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center text-2xl">
            ⚠️
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-900">Report Shortage</h3>
            {orderInfo && (
              <p className="text-sm text-slate-600">Table {orderInfo.tableId}</p>
            )}
          </div>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Ingredient Name *
            </label>
            <input
              type="text"
              value={ingredient}
              onChange={(e) => setIngredient(e.target.value)}
              placeholder="e.g., Tomatoes, Paneer"
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Quantity Needed (Optional)
            </label>
            <input
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="e.g., 5"
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
            />
          </div>
        </div>
        
        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 rounded-md border border-slate-300 bg-white hover:bg-slate-50 font-medium text-slate-700 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!ingredient.trim()}
            className="flex-1 px-4 py-2 rounded-md bg-red-600 hover:bg-red-700 text-white font-medium shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Report Shortage
          </button>
        </div>
      </div>
    </div>
  )
}

export default function CookDashboard() {
  const { user } = useAuth()
  const [orders, setOrders] = useState([])
  const [stats, setStats] = useState({ pending: 0, preparing: 0, ready: 0, totalActive: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filter, setFilter] = useState('all')
  const [fastPrepOnly, setFastPrepOnly] = useState(false)
  const [shortageModal, setShortageModal] = useState({ isOpen: false, orderInfo: null, item: null })
  
  // Fetch orders
  const fetchOrders = async (showLoading = false) => {
    try {
      if (showLoading) {
        setLoading(true)
      }
      const response = await api.get('/orders/kitchen')
      if (response && response.success && response.data) {
        const timestamp = new Date().toLocaleTimeString()
        console.log(`👨‍🍳 Cook [${timestamp}]: Orders fetched:`, response.data.orders.length, 'orders')
        setOrders(response.data.orders || [])
        setStats(response.data.stats || { pending: 0, preparing: 0, ready: 0, totalActive: 0 })
        setError(null) // Clear any previous errors
      }
    } catch (err) {
      console.error('Error fetching orders:', err)
      setError('Failed to load orders')
    } finally {
      if (showLoading) {
        setLoading(false)
      }
    }
  }
  
  useEffect(() => {
    // Initial fetch with loading indicator
    fetchOrders(true)
    
    // Auto-refresh every 1.5 seconds to show new orders without manual refresh
    const interval = setInterval(() => fetchOrders(false), 1500)
    
    return () => clearInterval(interval)
  }, [])
  
  // Start order preparation
  const handleStartOrder = async (orderId) => {
    try {
      const response = await api.post(`/orders/${orderId}/start`)
      if (response && response.success) {
        await fetchOrders()
        // Play notification sound
        try {
          const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBjGH0fPTgjMGHm7A7+OZRQ0PVqzn7ahdGQxJpNvyuWhiITY=')
          audio.play().catch(() => {})
        } catch {}
      }
    } catch (err) {
      console.error('Error starting order:', err)
      alert('Failed to start order')
    }
  }
  
  // Update item status
  const handleItemStatusChange = async (orderId, itemIndex, status) => {
    try {
      const response = await api.put(`/orders/${orderId}/items/${itemIndex}`, { status })
      if (response && response.success) {
        await fetchOrders()
        
        // Notification when all ready
        if (response.data.allReady) {
          try {
            const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBjGH0fPTgjMGHm7A7+OZRQ0PVqzn7ahdGQxJpNvyuWhiITY=')
            audio.play().catch(() => {})
          } catch {}
          
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('Order Ready!', {
              body: `Order for Table ${response.data.order.tableId} is ready to serve`,
              icon: '/icon.png'
            })
          }
        }
      }
    } catch (err) {
      console.error('Error updating item:', err)
      alert('Failed to update item status')
    }
  }
  
  // Report shortage
  const handleReportShortage = async (data) => {
    try {
      // For now, just show alert. You can implement inventory API later
      console.log('Shortage reported:', data)
      alert(`Shortage reported: ${data.ingredient}${data.quantity ? ` (${data.quantity} units needed)` : ''}`)
      setShortageModal({ isOpen: false, orderInfo: null, item: null })
    } catch (err) {
      console.error('Error reporting shortage:', err)
      alert('Failed to report shortage')
    }
  }
  
  // Filtered and sorted orders
  const filteredOrders = useMemo(() => {
    let filtered = orders
    
    // Filter by status
    if (filter !== 'all') {
      filtered = filtered.filter(o => o.orderStatus === filter.toUpperCase())
    }
    
    // Filter by fast prep
    if (fastPrepOnly) {
      filtered = filtered.filter(o => {
        const maxPrepTime = Math.max(...o.orderedItems.map(item => item.preparationTimeMinutes || 0))
        return maxPrepTime <= 10
      })
    }
    
    // Sort by priority and timestamp (newest first to show at top)
    return filtered.sort((a, b) => {
      // Priority weight
      const priorityWeight = { URGENT: 0, HIGH: 1, NORMAL: 2, LOW: 3 }
      const aPriority = priorityWeight[a.priority] || 2
      const bPriority = priorityWeight[b.priority] || 2
      
      if (aPriority !== bPriority) {
        return aPriority - bPriority
      }
      
      // Then by timestamp (NEWEST first - reversed order to show new orders at top)
      return new Date(b.orderTime?.placedAt) - new Date(a.orderTime?.placedAt)
    })
  }, [orders, filter, fastPrepOnly])
  
  // Request notification permission
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }, [])
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading kitchen orders...</p>
        </div>
      </div>
    )
  }
  
  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Kitchen Dashboard</h1>
          <p className="text-slate-600 mt-1">Welcome back, {user?.email}</p>
        </div>
        
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 rounded-md hover:bg-slate-50 cursor-pointer">
            <input
              type="checkbox"
              checked={fastPrepOnly}
              onChange={(e) => setFastPrepOnly(e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
            />
            <span className="text-sm font-medium text-slate-700">⚡ Fast Prep Only (≤10 min)</span>
          </label>
        </div>
      </div>
      
      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md mb-6">
          <div className="flex items-center justify-between">
            <span>{error}</span>
            <button onClick={() => setError(null)} className="ml-4 text-red-400 hover:text-red-600">✕</button>
          </div>
        </div>
      )}
      
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card title="Pending" value={stats.pending} className="bg-amber-100 text-amber-800" />
        <Card title="Preparing" value={stats.preparing} className="bg-blue-100 text-blue-800" />
        <Card title="Ready" value={stats.ready} className="bg-green-100 text-green-800" />
        <Card title="Total Active" value={stats.totalActive} className="bg-slate-100 text-slate-800" />
      </div>
      
      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {[
          { key: 'all', label: 'All Orders', count: orders.length },
          { key: 'pending', label: 'Pending', count: stats.pending },
          { key: 'preparing', label: 'Preparing', count: stats.preparing },
          { key: 'ready', label: 'Ready', count: stats.ready }
        ].map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-3 py-1.5 rounded-md border text-sm transition-colors ${
              filter === f.key
                ? 'bg-slate-800 border-slate-800 text-white'
                : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
            }`}
          >
            {f.label} ({f.count})
          </button>
        ))}
      </div>
      
      {/* Orders Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredOrders.map((order) => (
          <div key={order.orderId} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            {/* Order Header */}
            <div className={`p-4 border-b ${
              order.priority === 'URGENT' ? 'bg-red-50 border-red-200' :
              order.priority === 'HIGH' ? 'bg-orange-50 border-orange-200' :
              'bg-slate-50 border-slate-200'
            }`}>
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Table {order.tableId}</h3>
                  <div className="flex flex-col gap-1 mt-1">
                    {/* Show elapsed time since order was CREATED (stops when cooking starts) */}
                    <div className="flex items-center gap-1 text-xs text-slate-500">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>Received:</span>
                      <ElapsedTimer since={order.orderTime?.placedAt} orderStatus={order.orderStatus} />
                    </div>
                    
                    {/* Show countdown ONLY if cooking has started (not PENDING) and has estimated time */}
                    {order.orderStatus !== 'PENDING' && order.orderTime?.startedPreparationAt && order.estimatedCompletionTime && (
                      <div className="flex items-center gap-1 text-sm">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        <span className="text-xs text-slate-600">Time Left:</span>
                        <CountdownTimer 
                          estimatedCompletionTime={order.estimatedCompletionTime}
                          orderStatus={order.orderStatus}
                        />
                      </div>
                    )}
                    
                    {/* Show static estimated time if order hasn't started yet */}
                    {order.orderStatus === 'PENDING' && order.estimatedCompletionTime && (
                      <div className="text-xs text-slate-500">
                        Est. time: {Math.max(...order.orderedItems.map(item => item.preparationTimeMinutes || 0))} min
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className="text-xs font-mono text-slate-500">
                    #{order.orderId.split('_')[1]?.substring(0, 8)}
                  </span>
                  {order.priority !== 'NORMAL' && (
                    <span className={`text-xs px-2 py-0.5 rounded font-bold ${
                      order.priority === 'URGENT' ? 'bg-red-200 text-red-800' :
                      order.priority === 'HIGH' ? 'bg-orange-200 text-orange-800' :
                      'bg-blue-200 text-blue-800'
                    }`}>
                      {order.priority}
                    </span>
                  )}
                </div>
              </div>
            </div>
            
            {/* Start Order Button */}
            {order.orderStatus === 'PENDING' && (
              <div className="p-4 bg-blue-50 border-b border-blue-200">
                <button
                  onClick={() => handleStartOrder(order.orderId)}
                  className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-sm transition-colors"
                >
                  🔥 Start Preparing Order
                </button>
              </div>
            )}
            
            {/* Order Items */}
            <div className="p-4 space-y-3">
              {order.orderedItems.map((item, idx) => (
                <ItemCard
                  key={idx}
                  item={item}
                  orderStartTime={order.orderTime?.startedPreparationAt}
                  onStatusChange={(status) => handleItemStatusChange(order.orderId, idx, status)}
                  onShortage={() => setShortageModal({ isOpen: true, orderInfo: order, item })}
                />
              ))}
            </div>
            
            {/* Order Notes */}
            {order.notes && (
              <div className="px-4 pb-4">
                <div className="text-xs bg-slate-100 text-slate-700 px-3 py-2 rounded">
                  💬 {order.notes}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
      
      {/* Empty State */}
      {filteredOrders.length === 0 && (
        <div className="text-center py-16 bg-white rounded-xl border border-slate-200">
          <div className="text-6xl mb-4">🍳</div>
          <h3 className="text-xl font-semibold text-slate-900 mb-2">No Orders</h3>
          <p className="text-slate-600">
            {filter === 'all' ? 'No active orders in the kitchen' : `No ${filter} orders`}
          </p>
        </div>
      )}
      
      {/* Shortage Modal */}
      <ShortageModal
        isOpen={shortageModal.isOpen}
        onClose={() => setShortageModal({ isOpen: false, orderInfo: null, item: null })}
        onSubmit={handleReportShortage}
        orderInfo={shortageModal.orderInfo}
      />
    </div>
  )
}
