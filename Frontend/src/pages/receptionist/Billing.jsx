import React, { useState, useEffect, useMemo } from 'react'
import api from '../../lib/api'
import { useAuth } from '../../auth/AuthContext'

// Countdown Timer Component - shows time remaining until estimated completion
const CountdownTimer = ({ estimatedCompletionTime, orderStatus, startedAt }) => {
  const [display, setDisplay] = useState('')
  const [isOvertime, setIsOvertime] = useState(false)
  
  useEffect(() => {
    // Don't show timer if order is completed/served or hasn't started cooking
    if (!estimatedCompletionTime || !startedAt || ['READY', 'SERVED', 'COMPLETED'].includes(orderStatus)) {
      return
    }
    
    const updateTimer = () => {
      const now = Date.now()
      const completionTime = new Date(estimatedCompletionTime).getTime()
      const diff = Math.floor((completionTime - now) / 1000)
      
      if (diff < 0) {
        setIsOvertime(true)
        const overtime = Math.abs(diff)
        const minutes = Math.floor(overtime / 60)
        const seconds = overtime % 60
        setDisplay(`+${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`)
      } else {
        setIsOvertime(false)
        const minutes = Math.floor(diff / 60)
        const seconds = diff % 60
        setDisplay(`${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`)
      }
    }
    
    updateTimer()
    const interval = setInterval(updateTimer, 1000)
    
    return () => clearInterval(interval)
  }, [estimatedCompletionTime, orderStatus, startedAt])
  
  // Show "Not Started" if order is PENDING
  if (orderStatus === 'PENDING') {
    return <span className="font-mono text-sm text-slate-500">Not Started</span>
  }
  
  // Show "Ready" if order is completed
  if (['READY', 'SERVED', 'COMPLETED'].includes(orderStatus)) {
    return <span className="font-mono text-sm font-bold text-green-600">READY</span>
  }
  
  // Don't show timer if cooking hasn't started
  if (!startedAt) {
    return <span className="font-mono text-sm text-slate-500">Waiting...</span>
  }
  
  return (
    <span className={`font-mono text-sm font-bold ${
      isOvertime ? 'text-red-600' : 'text-blue-600'
    }`}>
      {display}
      {isOvertime && ' ⏰'}
    </span>
  )
}

// Icon Components
const Icons = {
  Plus: ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
    </svg>
  ),
  Table: ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
      <line x1="9" y1="21" x2="9" y2="9"></line>
      <line x1="21" y1="9" x2="9" y2="9"></line>
    </svg>
  ),
  Receipt: ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5l-5-5L12 20H4l5-5 5 5z" />
    </svg>
  ),
  DollarSign: ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <line x1="12" y1="1" x2="12" y2="23"></line>
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
    </svg>
  ),
  Clock: ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="10"></circle>
      <polyline points="12,6 12,12 16,14"></polyline>
    </svg>
  ),
  Users: ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
    </svg>
  ),
  Close: ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  ),
  ShoppingCart: ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <circle cx="9" cy="21" r="1"></circle>
      <circle cx="20" cy="21" r="1"></circle>
      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
    </svg>
  ),
  Edit: ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
  )
}

// Order Details Modal Component
const OrderDetailsModal = ({ order, onClose, onUpdateBilling, onUpdateOrder }) => {
  const [updating, setUpdating] = useState(false)
  const [newPaymentMethod, setNewPaymentMethod] = useState(order?.billDetails?.paymentMethod || 'CASH')
  const [editingBill, setEditingBill] = useState(false)
  const [billDetails, setBillDetails] = useState({
    subtotal: order?.billDetails?.subtotal || 0,
    tax: order?.billDetails?.tax || 0,
    grandTotal: order?.billDetails?.grandTotal || 0
  })

  const handleMarkAsPaid = async () => {
    setUpdating(true)
    try {
      await onUpdateBilling(order.orderId, {
        paymentStatus: 'PAID',
        paymentMethod: newPaymentMethod
      })
    } finally {
      setUpdating(false)
    }
  }

  const handleMarkAsCompleted = async () => {
    setUpdating(true)
    try {
      await onUpdateOrder(order.orderId, {
        orderStatus: 'COMPLETED',
        completedAt: new Date().toISOString()
      })
    } finally {
      setUpdating(false)
    }
  }

  const handleTaxChange = (newTax) => {
    const updatedBillDetails = {
      ...billDetails,
      tax: parseFloat(newTax) || 0,
      grandTotal: billDetails.subtotal + (parseFloat(newTax) || 0)
    }
    setBillDetails(updatedBillDetails)
  }

  const handleSubtotalChange = (newSubtotal) => {
    const updatedBillDetails = {
      ...billDetails,
      subtotal: parseFloat(newSubtotal) || 0,
      grandTotal: (parseFloat(newSubtotal) || 0) + billDetails.tax
    }
    setBillDetails(updatedBillDetails)
  }

  const handleUpdateBillDetails = async () => {
    setUpdating(true)
    try {
      await onUpdateBilling(order.orderId, {
        billDetails: billDetails
      })
      setEditingBill(false)
    } finally {
      setUpdating(false)
    }
  }

  if (!order) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b bg-gray-50">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Order Details</h2>
            <p className="text-gray-600 text-sm mt-1">
              {order.orderId} • Table {order.tableId}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-200 rounded-full transition-colors"
          >
            <Icons.Close className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 max-h-[calc(90vh-200px)] overflow-y-auto">
          {/* Order Status */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Order Status</h3>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                order.orderStatus === 'COMPLETED'
                  ? 'bg-green-100 text-green-800'
                  : order.orderStatus === 'ONGOING'
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-yellow-100 text-yellow-800'
              }`}>
                {order.orderStatus}
              </span>
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Placed At:</span>
                <p className="font-medium">{new Date(order.orderTime.placedAt).toLocaleString()}</p>
              </div>
              {order.orderTime.completedAt && (
                <div>
                  <span className="text-gray-600">Completed At:</span>
                  <p className="font-medium">{new Date(order.orderTime.completedAt).toLocaleString()}</p>
                </div>
              )}
              <div>
                <span className="text-gray-600">Waiter:</span>
                <p className="font-medium">{order.waiterAssigned}</p>
              </div>
              <div>
                <span className="text-gray-600">Table:</span>
                <p className="font-medium">{order.tableId}</p>
              </div>
            </div>
          </div>

          {/* Order Items */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-4">Ordered Items</h3>
            <div className="space-y-3">
              {order.orderedItems.map((item, index) => (
                <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <div>
                    <h4 className="font-medium">{item.itemName}</h4>
                    <p className="text-sm text-gray-600">₹{item.price} × {item.quantity}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">₹{item.totalPrice}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Billing Details */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Billing Details</h3>
              {order.billDetails.paymentStatus === 'PENDING' && (
                <button
                  onClick={() => setEditingBill(!editingBill)}
                  className="flex items-center space-x-1 text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  <Icons.Edit className="w-4 h-4" />
                  <span>{editingBill ? 'Cancel Edit' : 'Edit Bill'}</span>
                </button>
              )}
            </div>
            
            {editingBill ? (
              <div className="bg-blue-50 rounded-lg p-4 space-y-4 border border-blue-200">
                <div className="text-sm text-blue-700 mb-3 font-medium">
                  ⚠️ Edit Mode - You can adjust the billing details
                </div>
                
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Subtotal:</span>
                    <div className="flex items-center space-x-2">
                      <span>₹</span>
                      <input
                        type="number"
                        value={billDetails.subtotal}
                        onChange={(e) => handleSubtotalChange(e.target.value)}
                        className="w-20 px-2 py-1 border border-gray-300 rounded text-right focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        step="0.01"
                        min="0"
                      />
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="font-medium">GST/Tax:</span>
                    <div className="flex items-center space-x-2">
                      <span>₹</span>
                      <input
                        type="number"
                        value={billDetails.tax}
                        onChange={(e) => handleTaxChange(e.target.value)}
                        className="w-20 px-2 py-1 border border-gray-300 rounded text-right focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        step="0.01"
                        min="0"
                      />
                    </div>
                  </div>
                  
                  <div className="flex justify-between font-bold text-lg border-t pt-2">
                    <span>Grand Total:</span>
                    <span className="text-green-600">₹{billDetails.grandTotal.toFixed(2)}</span>
                  </div>
                </div>
                
                <div className="flex space-x-2 pt-2">
                  <button
                    onClick={handleUpdateBillDetails}
                    disabled={updating}
                    className="flex-1 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 font-medium"
                  >
                    {updating ? 'Updating...' : 'Save Changes'}
                  </button>
                  <button
                    onClick={() => {
                      setEditingBill(false)
                      setBillDetails({
                        subtotal: order.billDetails.subtotal,
                        tax: order.billDetails.tax,
                        grandTotal: order.billDetails.grandTotal
                      })
                    }}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 font-medium"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>₹{order.billDetails.subtotal}</span>
                </div>
                <div className="flex justify-between">
                  <span>GST/Tax:</span>
                  <span>₹{order.billDetails.tax}</span>
                </div>
                <div className="flex justify-between font-bold text-lg border-t pt-2">
                  <span>Grand Total:</span>
                  <span>₹{order.billDetails.grandTotal}</span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t">
                  <span>Payment Status:</span>
                  <span className={`px-2 py-1 rounded text-sm font-medium ${
                    order.billDetails.paymentStatus === 'PAID'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {order.billDetails.paymentStatus}
                  </span>
                </div>
                {order.billDetails.paymentMethod && (
                  <div className="flex justify-between">
                    <span>Payment Method:</span>
                    <span className="font-medium">{order.billDetails.paymentMethod}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-3">
            {order.billDetails.paymentStatus === 'PENDING' && !editingBill && (
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Payment Method
                  </label>
                  <select
                    value={newPaymentMethod}
                    onChange={(e) => setNewPaymentMethod(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="CASH">Cash</option>
                    <option value="CARD">Card</option>
                    <option value="UPI">UPI</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
                <button
                  onClick={handleMarkAsPaid}
                  disabled={updating}
                  className="w-full py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  {updating ? 'Updating...' : `Mark as Paid (₹${order.billDetails.grandTotal})`}
                </button>
              </div>
            )}
            
            {order.orderStatus === 'ONGOING' && !editingBill && (
              <button
                onClick={handleMarkAsCompleted}
                disabled={updating}
                className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {updating ? 'Updating...' : 'Mark Order as Completed'}
              </button>
            )}
            
            <button
              onClick={onClose}
              className="w-full py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 font-medium"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}


export default function BillingPage() {
  const { user } = useAuth()
  const [orderData, setOrderData] = useState(null) // Complete order document from API
  const [orders, setOrders] = useState([]) // Individual orders array
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [showOrderDetails, setShowOrderDetails] = useState(false)
  const [activeTab, setActiveTab] = useState('ongoing') // ongoing, completed, all

  // Fetch data on component mount
  useEffect(() => {
    const initializeData = async () => {
      try {
        console.log('🔄 Initializing billing page data...');
        console.log('👤 Current user:', user);
        
        // Check if user is authenticated
        const token = localStorage.getItem('authToken');
        console.log('🔐 Auth token exists:', !!token);
        
        if (!token || !user) {
          setError('Please log in to access orders and billing.');
          setLoading(false);
          return;
        }
        
        console.log('🏨 User hotel:', user.hotel?.id, user.hotel?.name);
        
        await fetchOrders();
        
        console.log('✅ Billing page data loaded successfully');
      } catch (err) {
        console.error('❌ Error initializing billing page:', err);
        setError('Failed to initialize billing page');
      } finally {
        setLoading(false);
      }
    };
    
    initializeData();
  }, [])

  const fetchOrders = async () => {
    try {
      console.log('🔍 Fetching orders and bills from API...');
      
      // Fetch orders first
      let ordersResponse;
      try {
        ordersResponse = await api.get('/orders');
        console.log('📥 Orders API response:', ordersResponse);
      } catch (ordersErr) {
        console.error('❌ Orders API failed:', ordersErr);
        setError('Failed to load orders: ' + (ordersErr.message || 'Unknown error'));
        setOrders([]);
        setOrderData(null);
        return;
      }
      
      // Fetch bills second
      let billsResponse;
      try {
        billsResponse = await api.get('/bills');
        console.log('📥 Bills API response:', billsResponse);
      } catch (billsErr) {
        console.error('❌ Bills API failed:', billsErr);
        setError('Failed to load bills: ' + (billsErr.message || 'Unknown error'));
        setOrders([]);
        setOrderData(null);
        return;
      }
      
      if (ordersResponse && ordersResponse.success && billsResponse && billsResponse.success) {
        const ordersData = ordersResponse.data?.orders || [];
        const billsData = billsResponse.data?.bills || [];
        
        console.log('📄 Orders data:', ordersData.length, 'orders');
        console.log('📄 Bills data:', billsData.length, 'bills');
        
        // If no orders, that's okay - not an error
        if (ordersData.length === 0) {
          console.log('📄 No orders found - this is normal for a new system');
          setOrderData(ordersResponse.data);
          setOrders([]);
          setError(null);
          return;
        }
        
        // Create a map of bills by orderId for quick lookup
        const billsMap = {};
        billsData.forEach(bill => {
          billsMap[bill.orderId] = bill;
        });
        
        // Merge orders with their bills data
        const mergedOrders = ordersData.map(order => {
          const bill = billsMap[order.orderId];
          return {
            ...order,
            billDetails: bill ? bill.paymentDetails : {
              subtotal: 0,
              tax: 0,
              grandTotal: 0,
              paymentStatus: 'PENDING',
              paymentMethod: null
            },
            billId: bill ? bill.billId : null
          };
        });
        
        console.log('✅ Orders loaded and merged with bills:', mergedOrders.length, 'orders');
        setOrderData(ordersResponse.data);
        setOrders(mergedOrders);
        setError(null); // Clear any previous errors
      } else {
        console.warn('⚠️ API returned unsuccessful response');
        console.warn('Orders response success:', ordersResponse?.success);
        console.warn('Bills response success:', billsResponse?.success);
        setError(`Failed to load data: ${!ordersResponse?.success ? 'Orders API failed. ' : ''}${!billsResponse?.success ? 'Bills API failed.' : ''}`);
        setOrders([]);
        setOrderData(null);
      }
    } catch (err) {
      console.error('❌ Error fetching orders and bills:', err);
      setError('Failed to load orders and billing data: ' + (err.message || 'Unknown error'));
      setOrders([]);
      setOrderData(null);
    }
  }

  // Update billing status (payment)
  const handleUpdateBilling = async (orderId, billingData) => {
    try {
      console.log('💳 Updating billing for order:', orderId, billingData);
      
      // Find the order to get billId
      const order = orders.find(o => o.orderId === orderId);
      if (!order || !order.billId) {
        setError('Bill ID not found for this order');
        return;
      }
      
      // Use bills API endpoint with billId
      const response = await api.put(`/bills/${order.billId}/payment`, {
        paymentMethod: billingData.paymentMethod,
        paymentStatus: billingData.paymentStatus,
        paidAmount: billingData.paidAmount,
        discount: billingData.discount
      });
      
      if (response && response.success) {
        console.log('✅ Billing updated successfully');
        await fetchOrders(); // Refresh data
        setShowOrderDetails(false);
        setSelectedOrder(null);
      } else {
        setError(response?.message || 'Failed to update billing status');
      }
    } catch (err) {
      console.error('❌ Error updating billing:', err);
      setError('Failed to update billing status: ' + (err.message || 'Unknown error'));
    }
  }

  // Update order status
  const handleUpdateOrder = async (orderId, orderData) => {
    try {
      console.log('🔄 Updating order:', orderId, orderData);
      const response = await api.put(`/orders/${orderId}`, orderData);
      
      if (response && response.success) {
        console.log('✅ Order updated successfully');
        await fetchOrders(); // Refresh data
        setShowOrderDetails(false);
        setSelectedOrder(null);
      } else {
        setError(response?.message || 'Failed to update order');
      }
    } catch (err) {
      console.error('❌ Error updating order:', err);
      setError('Failed to update order');
    }
  }

  // Calculate statistics based on payment status (not order status)
  const stats = useMemo(() => {
    if (!orders || orders.length === 0) {
      return {
        totalOrders: 0,
        ongoingOrders: 0,
        completedOrders: 0,
        pendingPayments: 0,
        totalRevenue: 0,
        pendingAmount: 0
      }
    }

    // Ongoing = PENDING payment, Completed = PAID payment
    const ongoingOrders = orders.filter(order => order.billDetails?.paymentStatus === 'PENDING')
    const completedOrders = orders.filter(order => order.billDetails?.paymentStatus === 'PAID')
    
    return {
      totalOrders: orders.length,
      ongoingOrders: ongoingOrders.length,
      completedOrders: completedOrders.length,
      pendingPayments: ongoingOrders.length,
      totalRevenue: completedOrders.reduce((sum, order) => sum + (order.billDetails?.grandTotal || 0), 0),
      pendingAmount: ongoingOrders.reduce((sum, order) => sum + (order.billDetails?.grandTotal || 0), 0)
    }
  }, [orders])

  // Filter orders based on active tab - using payment status instead of order status
  const filteredOrders = useMemo(() => {
    switch (activeTab) {
      case 'ongoing':
        // Ongoing = PENDING payment status
        return orders.filter(order => order.billDetails?.paymentStatus === 'PENDING')
      case 'completed':
        // Completed = PAID payment status
        return orders.filter(order => order.billDetails?.paymentStatus === 'PAID')
      case 'all':
      default:
        return orders
    }
  }, [orders, activeTab])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading orders and billing...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Orders & Billing</h1>
          <p className="text-slate-600 mt-1">Manage table orders and process payments</p>
          {process.env.NODE_ENV === 'development' && (
            <div className="mt-2 text-xs text-gray-500">
              User: {user?.email} | Hotel: {user?.hotel?.name} ({user?.hotel?.id})
            </div>
          )}
        </div>
        {process.env.NODE_ENV === 'development' && (
          <button
            onClick={async () => {
              console.log('🧪 Testing orders API directly...');
              const testResult = await api.get('/orders');
              console.log('🧪 Test result:', testResult);
              alert('Check console for test results');
            }}
            className="px-3 py-2 bg-gray-600 text-white rounded-md text-sm"
          >
            Test API
          </button>
        )}
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

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
          <div className="flex items-center">
            <Icons.ShoppingCart className="w-8 h-8 text-blue-600 mr-3" />
            <div>
              <div className="text-2xl font-bold text-blue-700">{stats.ongoingOrders}</div>
              <div className="text-blue-600 text-sm font-medium">Ongoing Orders</div>
            </div>
          </div>
        </div>
        
        <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
          <div className="flex items-center">
            <Icons.Clock className="w-8 h-8 text-yellow-600 mr-3" />
            <div>
              <div className="text-2xl font-bold text-yellow-700">{stats.pendingPayments}</div>
              <div className="text-yellow-600 text-sm font-medium">Pending Payments</div>
            </div>
          </div>
        </div>
        
        <div className="bg-green-50 rounded-lg p-4 border border-green-200">
          <div className="flex items-center">
            <Icons.DollarSign className="w-8 h-8 text-green-600 mr-3" />
            <div>
              <div className="text-2xl font-bold text-green-700">₹{stats.totalRevenue.toFixed(2)}</div>
              <div className="text-green-600 text-sm font-medium">Total Revenue</div>
            </div>
          </div>
        </div>
        
        <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
          <div className="flex items-center">
            <Icons.Receipt className="w-8 h-8 text-purple-600 mr-3" />
            <div>
              <div className="text-2xl font-bold text-purple-700">{stats.completedOrders}</div>
              <div className="text-purple-600 text-sm font-medium">Completed Orders</div>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
        <button
          onClick={() => setActiveTab('ongoing')}
          className={`px-4 py-2 rounded-md font-medium transition-colors ${
            activeTab === 'ongoing'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Ongoing ({stats.ongoingOrders})
        </button>
        <button
          onClick={() => setActiveTab('completed')}
          className={`px-4 py-2 rounded-md font-medium transition-colors ${
            activeTab === 'completed'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Completed ({stats.completedOrders})
        </button>
        <button
          onClick={() => setActiveTab('all')}
          className={`px-4 py-2 rounded-md font-medium transition-colors ${
            activeTab === 'all'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          All Orders ({stats.totalOrders})
        </button>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6 border-b">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">
              {activeTab === 'ongoing' ? 'Ongoing Orders' : 
               activeTab === 'completed' ? 'Completed Orders' : 'All Orders'}
            </h2>
            <p className="text-sm text-gray-600">
              Hotel: {orderData?.hotelName || 'Loading...'}
            </p>
          </div>
        </div>
        
        {filteredOrders.length === 0 ? (
          <div className="text-center py-12">
            <Icons.ShoppingCart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No {activeTab === 'ongoing' ? 'Ongoing' : activeTab === 'completed' ? 'Completed' : ''} Orders
            </h3>
            <p className="text-gray-500">
              {activeTab === 'ongoing' 
                ? 'No orders are currently ongoing'
                : activeTab === 'completed'
                ? 'No orders have been completed yet'
                : 'No orders found'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Table</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Items</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredOrders.map((order) => (
                  <tr key={order.orderId} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      <div>
                        <div className="font-mono text-xs text-gray-600 mb-1">{order.orderId}</div>
                        <div className="text-xs text-gray-500">Waiter: {order.waiterAssigned}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="font-semibold text-lg">{order.tableId}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div>{order.orderedItems?.length || 0} items</div>
                      <div className="text-xs text-gray-500">
                        {order.orderedItems?.slice(0, 2).map(item => item.itemName).join(', ')}
                        {order.orderedItems?.length > 2 && '...'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="font-semibold">₹{order.billDetails?.grandTotal?.toFixed(2) || '0.00'}</div>
                      <div className="text-xs text-gray-500">
                        Subtotal: ₹{order.billDetails?.subtotal || 0}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        order.orderStatus === 'COMPLETED'
                          ? 'bg-green-100 text-green-800'
                          : order.orderStatus === 'ONGOING'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {order.orderStatus}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full inline-block ${
                          order.billDetails?.paymentStatus === 'PAID'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {order.billDetails?.paymentStatus || 'PENDING'}
                        </span>
                        {order.billDetails?.paymentMethod && (
                          <span className="text-xs text-gray-500 mt-1">
                            {order.billDetails.paymentMethod}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div>
                        <div className="text-xs">Placed: {new Date(order.orderTime.placedAt).toLocaleTimeString()}</div>
                        {order.orderTime.completedAt && (
                          <div className="text-xs text-green-600">Completed: {new Date(order.orderTime.completedAt).toLocaleTimeString()}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => {
                          setSelectedOrder(order)
                          setShowOrderDetails(true)
                        }}
                        className="text-blue-600 hover:text-blue-900 mr-3"
                      >
                        View Details
                      </button>
                      {order.billDetails?.paymentStatus === 'PENDING' && (
                        <button
                          onClick={() => {
                            setSelectedOrder(order)
                            setShowOrderDetails(true)
                          }}
                          className="text-green-600 hover:text-green-900"
                        >
                          Update Payment
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Order Details Modal */}
      {showOrderDetails && selectedOrder && (
        <OrderDetailsModal
          order={selectedOrder}
          onClose={() => {
            setShowOrderDetails(false)
            setSelectedOrder(null)
          }}
          onUpdateBilling={handleUpdateBilling}
          onUpdateOrder={handleUpdateOrder}
        />
      )}
    </div>
  )
}
