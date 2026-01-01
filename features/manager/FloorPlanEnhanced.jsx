"use client"

import { useEffect, useRef, useState } from "react"
import {
  ScrollView, View, Text, StyleSheet, Pressable, Alert,
  TextInput, Modal, RefreshControl, ActivityIndicator
} from "react-native"
import api from "../../services/api"
import syncService from "../../services/syncService"
import notificationService from "../../services/notificationService"

const COLORS = {
  primary: "#2F6FED",
  green: "#10B981",
  red: "#EF4444",
  yellow: "#F59E0B",
  gray: "#6B7280",
  white: "#FFFFFF",
  black: "#0E141B",
  lightGray: "#F3F4F6",
}

const STATUS_COLORS = {
  VACANT: { bg: "#D1FAE5", border: "#10B981", text: "#065F46" },
  OCCUPIED: { bg: "#FEE2E2", border: "#EF4444", text: "#991B1B" },
  RESERVED: { bg: "#FEF3C7", border: "#F59E0B", text: "#92400E" },
  MAINTENANCE: { bg: "#F3F4F6", border: "#6B7280", text: "#374151" },
}


const TableCard = ({ table, onPress, onLongPress, onTakeOrder }) => {
  const statusColor = STATUS_COLORS[table.status] || STATUS_COLORS.VACANT

  return (
    <Pressable
      onPress={() => onPress(table)}
      onLongPress={() => onLongPress(table)}
      style={[
        styles.tableCard,
        { backgroundColor: statusColor.bg, borderColor: statusColor.border },
      ]}
    >
      <View style={styles.tableHeader}>
        <Text style={[styles.tableId, { color: statusColor.text }]}>{table.tableId}</Text>
        <View style={[styles.statusDot, { backgroundColor: statusColor.border }]} />
      </View>

      <Text style={styles.tableCapacity}>👥 {table.capacity} seats</Text>
      <Text style={[styles.tableStatus, { color: statusColor.text }]}>{table.status}</Text>

      {/* Prominent Take Order Button for OCCUPIED tables */}
      {table.status === "OCCUPIED" && (
        <Pressable
          onPress={(e) => {
            e.stopPropagation()
            onTakeOrder(table)
          }}
          style={styles.takeOrderButton}
        >
          <Text style={styles.takeOrderButtonText}>📋 Take Order</Text>
        </Pressable>
      )}
    </Pressable>
  )
}

// Item Timer Component - synchronized with backend timer system
// Uses backend API to get exact timer data for perfect synchronization
const ItemTimer = ({ item, orderStartTime, timerUpdate, orderId, itemIndex }) => {
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [syncedStartTime, setSyncedStartTime] = useState(null)

  // Only show timer if cooking has started and item is not ready
  const isCooking = item.status === 'in_progress' || item.status === 'PREPARING'
  const shouldShowTimer = isCooking && item.status !== 'READY' && item.status !== 'SERVED'

  // Fetch synchronized timer data from backend
  useEffect(() => {
    if (!shouldShowTimer || !orderId || itemIndex === undefined) {
      setElapsedSeconds(0)
      setSyncedStartTime(null)
      return
    }

    const fetchTimerData = async () => {
      try {
        const response = await api.orders.getTimers()
        if (response && response.success && response.data.timers[orderId] && response.data.timers[orderId][itemIndex]) {
          const timerInfo = response.data.timers[orderId][itemIndex]
          setSyncedStartTime(timerInfo.startTime)
        } else {
          // Fallback to item's startedAt if no synchronized timer data
          if (item.startedAt) {
            const time = new Date(item.startedAt).getTime()
            if (!isNaN(time)) setSyncedStartTime(time)
          }
        }
      } catch (error) {
        console.error("Error fetching timer data:", error)
        // Fallback to item's startedAt
        if (item.startedAt) {
          const time = new Date(item.startedAt).getTime()
          if (!isNaN(time)) setSyncedStartTime(time)
        }
      }
    }

    // Fetch initial timer data
    fetchTimerData()

    // Update timer data every second for synchronization
    const interval = setInterval(fetchTimerData, 1000)

    return () => clearInterval(interval)
  }, [shouldShowTimer, timerUpdate, item.startedAt, item.status, orderId, itemIndex])

  // Calculate elapsed time using synchronized start time
  useEffect(() => {
    if (!shouldShowTimer || !syncedStartTime) {
      setElapsedSeconds(0)
      return
    }

    const calculateElapsed = () => {
      const now = Date.now()
      const elapsed = Math.floor((now - syncedStartTime) / 1000)
      return Math.max(0, elapsed)
    }

    setElapsedSeconds(calculateElapsed())

    const interval = setInterval(() => {
      setElapsedSeconds(calculateElapsed())
    }, 1000)

    return () => clearInterval(interval)
  }, [shouldShowTimer, syncedStartTime])

  if (!shouldShowTimer) {
    if (item.status === 'READY') {
      return (
        <View style={[styles.timerContainer, { backgroundColor: '#D1FAE5' }]}>
          <Text style={[styles.timerLabel, { color: '#065F46' }]}>✓ Ready</Text>
        </View>
      )
    }
    if (item.status === 'PENDING') {
      return (
        <View style={[styles.timerContainer, { backgroundColor: '#FEF3C7' }]}>
          <Text style={[styles.timerLabel, { color: '#92400E' }]}>⏳ Waiting to start</Text>
        </View>
      )
    }
    return null
  }

  const minutes = Math.floor(elapsedSeconds / 60)
  const seconds = elapsedSeconds % 60
  const formatted = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`

  return (
    <View style={styles.timerContainer}>
      <Text style={styles.timerLabel}>⏱️ Cooking Time:</Text>
      <Text style={styles.timerValue}>{formatted}</Text>
    </View>
  )
}

const OrderModal = ({ visible, table, onClose, onSubmit }) => {
  const [menu, setMenu] = useState([])
  const [cart, setCart] = useState([])
  const [notes, setNotes] = useState("")
  const [loading, setLoading] = useState(false)
  const [previousOrders, setPreviousOrders] = useState([])
  const [activeTab, setActiveTab] = useState("takeOrder") // "takeOrder" or "previousOrders"
  const [timerUpdate, setTimerUpdate] = useState(0) // Force re-render for timers

  useEffect(() => {
    if (visible) {
      loadMenu()
      loadPreviousOrders()

      // Auto-refresh previous orders every 1 second to stay in sync with cook dashboard
      // This ensures we get the latest startedAt timestamp immediately when cook presses "Start Cooking"
      const refreshInterval = setInterval(() => {
        loadPreviousOrders()
      }, 1000)

      // Update timers every second - synchronized with cook dashboard
      const timerInterval = setInterval(() => {
        setTimerUpdate(Date.now())
      }, 1000)

      return () => {
        clearInterval(refreshInterval)
        clearInterval(timerInterval)
      }
    }
  }, [visible, table])

  const loadMenu = async () => {
    try {
      setLoading(true)
      const menuData = await syncService.fetchAndCacheMenu()
      setMenu(menuData || [])
    } catch (error) {
      console.error("Error loading menu:", error)
      Alert.alert("Error", "Failed to load menu")
    } finally {
      setLoading(false)
    }
  }

  const loadPreviousOrders = async () => {
    try {
      if (!table?.tableId) return
      const response = await api.orders.getPreviousOrders(table.tableId)
      if (response && response.success) {
        setPreviousOrders(response.data.orders || [])
      }
    } catch (error) {
      console.error("Error loading previous orders:", error)
    }
  }

  const addToCart = (item) => {
    setCart(prev => {
      const existing = prev.find(i => i._id === item._id)
      if (existing) {
        return prev.map(i => i._id === item._id ? { ...i, quantity: i.quantity + 1 } : i)
      }
      return [...prev, { ...item, quantity: 1 }]
    })
  }

  const updateQuantity = (itemId, delta) => {
    setCart(prev => {
      return prev.map(item => {
        if (item._id === itemId) {
          const newQty = item.quantity + delta
          return newQty > 0 ? { ...item, quantity: newQty } : item
        }
        return item
      }).filter(item => item.quantity > 0)
    })
  }

  const handleSubmit = async () => {
    if (cart.length === 0) {
      Alert.alert("Empty Cart", "Please add items to the order")
      return
    }

    const orderData = {
      tableId: table.tableId,
      items: cart.map(item => ({
        menuItemId: item._id,
        name: item.name,
        quantity: item.quantity,
        unitPrice: item.price,
        specialInstructions: notes,
      })),
      priority: "NORMAL",
      notes,
    }

    await onSubmit(orderData)
    setCart([])
    setNotes("")
    // Reload previous orders after placing new order
    await loadPreviousOrders()
  }

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0)

  const formatTimer = (seconds) => {
    if (!seconds && seconds !== 0) return null
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>📋 Table {table?.tableId}</Text>
          <Pressable onPress={onClose} style={styles.closeBtn}>
            <Text style={styles.closeBtnText}>✕</Text>
          </Pressable>
        </View>

        {/* Tab Headers */}
        <View style={styles.tabContainer}>
          <Pressable
            onPress={() => setActiveTab("takeOrder")}
            style={[styles.tab, activeTab === "takeOrder" && styles.tabActive]}
          >
            <Text style={[styles.tabText, activeTab === "takeOrder" && styles.tabTextActive]}>
              Take Order
            </Text>
          </Pressable>
          <Pressable
            onPress={() => {
              setActiveTab("previousOrders")
              loadPreviousOrders() // Refresh when switching to this tab
            }}
            style={[styles.tab, activeTab === "previousOrders" && styles.tabActive]}
          >
            <Text style={[styles.tabText, activeTab === "previousOrders" && styles.tabTextActive]}>
              Previous Orders ({previousOrders.length})
            </Text>
          </Pressable>
        </View>

        {loading && activeTab === "takeOrder" ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingText}>Loading menu...</Text>
          </View>
        ) : activeTab === "takeOrder" ? (
          <ScrollView style={styles.modalContent}>
            <Text style={styles.sectionTitle}>Menu Items</Text>
            <View style={styles.menuGrid}>
              {Array.isArray(menu) && menu.length > 0 ? (
                menu.map(item => (
                  <Pressable
                    key={item._id}
                    onPress={() => addToCart(item)}
                    style={styles.menuItem}
                  >
                    <Text style={styles.menuName}>{item.name}</Text>
                    <Text style={styles.menuPrice}>₹{item.price}</Text>
                    {item.avgPrepTimeMins > 0 && (
                      <Text style={styles.menuTime}>~{item.avgPrepTimeMins}min</Text>
                    )}
                  </Pressable>
                ))
              ) : (
                <Text style={styles.emptyText}>No menu items available</Text>
              )}
            </View>

            <Text style={styles.sectionTitle}>Cart ({cart.length} items)</Text>
            {cart.map(item => (
              <View key={item._id} style={styles.cartItem}>
                <View style={styles.cartItemInfo}>
                  <Text style={styles.cartItemName}>{item.name}</Text>
                  <Text style={styles.cartItemPrice}>₹{item.price} × {item.quantity}</Text>
                </View>
                <View style={styles.qtyControls}>
                  <Pressable onPress={() => updateQuantity(item._id, -1)} style={styles.qtyBtn}>
                    <Text style={styles.qtyBtnText}>-</Text>
                  </Pressable>
                  <Text style={styles.qtyText}>{item.quantity}</Text>
                  <Pressable onPress={() => updateQuantity(item._id, 1)} style={styles.qtyBtn}>
                    <Text style={styles.qtyBtnText}>+</Text>
                  </Pressable>
                </View>
              </View>
            ))}

            <View style={styles.notesSection}>
              <Text style={styles.inputLabel}>Special Instructions</Text>
              <TextInput
                style={styles.notesInput}
                value={notes}
                onChangeText={setNotes}
                placeholder="Allergies, preferences, etc."
                multiline
                numberOfLines={3}
              />
            </View>

            <View style={styles.totalSection}>
              <Text style={styles.totalLabel}>Total:</Text>
              <Text style={styles.totalAmount}>₹{total.toFixed(2)}</Text>
            </View>

            <View style={styles.modalActions}>
              <Pressable onPress={onClose} style={styles.cancelBtn}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </Pressable>
              <Pressable onPress={handleSubmit} style={styles.submitBtn}>
                <Text style={styles.submitBtnText}>Place Order</Text>
              </Pressable>
            </View>
          </ScrollView>
        ) : (
          <ScrollView style={styles.modalContent}>
            <Text style={styles.sectionTitle}>Previous Orders</Text>
            {previousOrders.length === 0 ? (
              <View style={styles.emptyStateContainer}>
                <Text style={styles.emptyText}>No previous orders for this table</Text>
                <Text style={styles.emptySubText}>Orders will appear here once placed</Text>
              </View>
            ) : (
              previousOrders.map(order => (
                <View key={order.orderId} style={styles.previousOrderCard}>
                  <View style={styles.previousOrderHeader}>
                    <Text style={styles.previousOrderId}>
                      Order #{order.orderId.split('_')[1]?.substring(0, 8) || 'N/A'}
                    </Text>
                    <View style={[
                      styles.statusBadge,
                      order.orderStatus === 'PENDING' && { backgroundColor: '#FEF3C7', borderColor: '#F59E0B' },
                      order.orderStatus === 'PREPARING' && { backgroundColor: '#DBEAFE', borderColor: '#3B82F6' },
                      order.orderStatus === 'READY' && { backgroundColor: '#D1FAE5', borderColor: '#10B981' },
                    ]}>
                      <Text style={[
                        styles.statusText,
                        order.orderStatus === 'PENDING' && { color: '#92400E' },
                        order.orderStatus === 'PREPARING' && { color: '#1E40AF' },
                        order.orderStatus === 'READY' && { color: '#065F46' },
                      ]}>
                        {order.orderStatus}
                      </Text>
                    </View>
                  </View>

                  {order.orderedItems && order.orderedItems.map((item, idx) => {
                    return (
                      <View key={idx} style={styles.previousOrderItem}>
                        <View style={styles.previousOrderItemInfo}>
                          <Text style={styles.previousOrderItemName}>{item.itemName || item.name}</Text>
                          <Text style={styles.previousOrderItemQty}>Qty: {item.quantity}</Text>
                        </View>
                        {/* Timer display below each dish - synchronized with cook dashboard */}
                        {/* Key uses numeric timestamp to force remount when cook presses "Start Cooking" */}
                        <ItemTimer
                          key={`${item.itemName || item.name}-${item.startedAt ? new Date(item.startedAt).getTime() : ''}-${item.cookingStartedAt ? new Date(item.cookingStartedAt).getTime() : ''}-${item.status}`}
                          item={item}
                          orderStartTime={order.orderTime?.startedPreparationAt}
                          timerUpdate={timerUpdate}
                          orderId={order.orderId}
                          itemIndex={idx}
                        />
                      </View>
                    )
                  })}
                </View>
              ))
            )}
          </ScrollView>
        )}
      </View>
    </Modal>
  )
}

export default function FloorPlanEnhanced() {
  const [tables, setTables] = useState([])
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [selectedTable, setSelectedTable] = useState(null)
  const [showOrderModal, setShowOrderModal] = useState(false)
  const [statusFilter, setStatusFilter] = useState("ALL")

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)

      const [tablesData, ordersData] = await Promise.all([
        syncService.fetchAndCacheTables(),
        syncService.fetchAndCacheOrders(),
      ])

      if (tablesData) {
        setTables(tablesData.tables || [])
      }

      if (ordersData) {
        setOrders(ordersData.orders || [])
      }
    } catch (error) {
      console.error("Error loading data:", error)
      Alert.alert("Error", "Failed to load data")
    } finally {
      setLoading(false)
    }
  }

  const onRefresh = async () => {
    setRefreshing(true)
    await loadData()
    setRefreshing(false)
  }

  const handleTakeOrder = (table) => {
    openOrderModal(table)
  }

  const handleTablePress = async (table) => {
    const currentStatus = table.status

    // Build dynamic menu based on current status
    const menuOptions = []

    // Status change options
    if (currentStatus !== "VACANT") {
      menuOptions.push({
        text: "✅ Mark as Vacant",
        onPress: () => updateTableStatus(table.tableId, "VACANT")
      })
    }

    if (currentStatus !== "OCCUPIED") {
      menuOptions.push({
        text: "🔴 Mark as Occupied",
        onPress: () => updateTableStatus(table.tableId, "OCCUPIED")
      })
    }

    if (currentStatus !== "RESERVED") {
      menuOptions.push({
        text: "🟡 Mark as Reserved",
        onPress: () => updateTableStatus(table.tableId, "RESERVED")
      })
    }

    if (currentStatus !== "MAINTENANCE") {
      menuOptions.push({
        text: "🔧 Mark as Maintenance",
        onPress: () => updateTableStatus(table.tableId, "MAINTENANCE")
      })
    }

    // Action options based on status
    if (currentStatus === "OCCUPIED" || currentStatus === "RESERVED") {
      menuOptions.unshift({
        text: "📋 Take Order",
        onPress: () => openOrderModal(table)
      })

      menuOptions.push({
        text: "👀 View Orders",
        onPress: () => viewTableOrders(table)
      })

      menuOptions.push({
        text: "🧹 Request Busser",
        onPress: () => requestBusser(table)
      })
    }

    if (currentStatus === "VACANT") {
      menuOptions.unshift({
        text: "🍽️ Seat Customer & Take Order",
        onPress: async () => {
          await updateTableStatus(table.tableId, "OCCUPIED")
          openOrderModal({ ...table, status: "OCCUPIED" })
        }
      })
    }

    // Add cancel option
    menuOptions.push({
      text: "Cancel",
      style: "cancel"
    })

    // Show alert with all options
    Alert.alert(
      `Table ${table.tableId}`,
      `Current Status: ${currentStatus}\nCapacity: ${table.capacity} seats`,
      menuOptions
    )
  }

  const handleTableLongPress = (table) => {
    Alert.alert(
      "Quick Actions",
      `Table ${table.tableId}`,
      [
        { text: "Call Cook", onPress: () => callCook(table) },
        { text: "Reprint Bill", onPress: () => reprintBill(table) },
        { text: "Mark Served", onPress: () => markServed(table) },
        { text: "Maintenance", onPress: () => updateTableStatus(table.tableId, "MAINTENANCE") },
        { text: "Cancel", style: "cancel" },
      ]
    )
  }

  const openOrderModal = (table) => {
    setSelectedTable(table)
    setShowOrderModal(true)
  }

  const updateTableStatus = async (tableId, status) => {
    try {
      const isOnline = await syncService.checkOnline()

      console.log(`🔄 Updating table ${tableId} status to ${status}`)

      if (isOnline) {
        await api.tables.updateStatus(tableId, status)
        console.log(`✅ Table ${tableId} updated to ${status} (online)`)
      } else {
        await syncService.queueOperation("UPDATE_TABLE_STATUS", { tableId, status })
        console.log(`📱 Table ${tableId} update queued (offline)`)
      }

      // Update local state immediately
      setTables(prev => prev.map(t => t.tableId === tableId ? { ...t, status } : t))

      // Show success message with emoji
      const statusEmoji = {
        VACANT: "✅",
        OCCUPIED: "🔴",
        RESERVED: "🟡",
        MAINTENANCE: "🔧"
      }

      Alert.alert(
        "Status Updated",
        `${statusEmoji[status] || "✓"} Table ${tableId} is now ${status}`,
        [{ text: "OK" }]
      )

    } catch (error) {
      console.error("❌ Error updating table status:", error)
      Alert.alert(
        "Error",
        `Failed to update table ${tableId} status. Please try again.`,
        [{ text: "OK" }]
      )
    }
  }

  const submitOrder = async (orderData) => {
    try {
      const isOnline = await syncService.checkOnline()

      // Validate order data
      if (!orderData.items || orderData.items.length === 0) {
        Alert.alert("Error", "Please add items to the order")
        return
      }

      // Transform order data to match backend API format
      const backendOrderData = {
        tableId: orderData.tableId,
        items: orderData.items.map(item => ({
          menuItemId: item.menuItemId,
          name: item.name,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          specialInstructions: item.specialInstructions || orderData.notes || ''
        })),
        priority: orderData.priority || 'NORMAL',
        notes: orderData.notes || '',
        orderType: 'DINE_IN',
        customer: {
          name: 'Walk-in Guest',
          groupSize: 1
        }
      }

      console.log('📤 Submitting order to backend:', backendOrderData)
      console.log('📊 Order details:', {
        tableId: backendOrderData.tableId,
        itemCount: backendOrderData.items.length,
        priority: backendOrderData.priority
      })

      if (isOnline) {
        const response = await api.orders.create(backendOrderData)
        console.log('✅ Order response:', response)

        if (response && response.success) {
          const orderId = response.data?.orderId || 'NEW'
          const itemCount = orderData.items.length

          // Send notification
          notificationService.sendNewOrderNotification(orderData.tableId, orderId)

          // Show success message
          Alert.alert(
            "✅ Order Placed Successfully!",
            `Table ${orderData.tableId}\n` +
            `Order ID: ${orderId.substring(0, 20)}...\n` +
            `Items: ${itemCount}\n\n` +
            `🍳 Order is now visible in Cook Dashboard`,
            [{ text: "OK" }]
          )

          console.log(`✅ Order ${orderId} sent to Cook Dashboard`)
        } else {
          throw new Error(response?.message || 'Failed to create order')
        }
      } else {
        await syncService.queueOperation("CREATE_ORDER", backendOrderData)
        Alert.alert(
          "📱 Offline Mode",
          "Order queued. Will sync when online.",
          [{ text: "OK" }]
        )
      }

      // Ensure table is marked as OCCUPIED
      await updateTableStatus(orderData.tableId, "OCCUPIED")

      // Refresh previous orders in modal if it's still open
      if (showOrderModal && selectedTable?.tableId === orderData.tableId) {
        // Small delay to ensure backend has processed the order
        setTimeout(async () => {
          if (selectedTable?.tableId === orderData.tableId) {
            // Reload previous orders - this will be handled by the OrderModal's loadPreviousOrders
          }
        }, 1000)
      }

      // Close modal and refresh data
      setShowOrderModal(false)
      await loadData()

    } catch (error) {
      console.error("❌ Error submitting order:", error)
      Alert.alert(
        "Error",
        error.message || "Failed to place order. Please try again.",
        [{ text: "OK" }]
      )
    }
  }

  const viewTableOrders = (table) => {
    try {
      if (!Array.isArray(orders) || orders.length === 0) {
        Alert.alert("No Orders", "No orders found. Please refresh.")
        return
      }

      const tableOrders = orders.filter(o => o.tableId === table.tableId && o.isActive)
      if (tableOrders.length === 0) {
        Alert.alert("No Orders", `No active orders for Table ${table.tableId}`)
        return
      }

      const orderDetails = tableOrders.map(o =>
        `Order ${o.orderId?.substring(0, 20) || 'N/A'}: ${o.orderStatus} (${o.orderedItems?.length || 0} items)`
      ).join("\n")

      Alert.alert(`Orders for Table ${table.tableId}`, orderDetails)
    } catch (error) {
      console.error("Error viewing orders:", error)
      Alert.alert("Error", "Failed to view orders")
    }
  }

  const requestBusser = (table) => {
    notificationService.sendNotification(
      "🧹 Busser Requested",
      `Table ${table.tableId} needs cleaning`,
      { type: "busser_request", tableId: table.tableId }
    )
    Alert.alert("Busser Requested", `Notification sent for Table ${table.tableId}`)
  }

  const callCook = (table) => {
    notificationService.sendNotification(
      "👨‍🍳 Cook Called",
      `Table ${table.tableId} needs kitchen attention`,
      { type: "call_cook", tableId: table.tableId }
    )
    Alert.alert("Cook Called", `Notification sent for Table ${table.tableId}`)
  }

  const reprintBill = (table) => {
    Alert.alert("Reprint Bill", `Bill reprint requested for Table ${table.tableId}`)
  }

  const markServed = async (table) => {
    const tableOrders = orders.filter(o => o.tableId === table.tableId && o.isActive)
    if (tableOrders.length === 0) {
      Alert.alert("No Orders", "No active orders to mark as served")
      return
    }

    // Mark all orders as served
    for (const order of tableOrders) {
      try {
        await api.orders.updateStatus(order.orderId, "SERVED")
      } catch (error) {
        console.error("Error marking order as served:", error)
      }
    }

    Alert.alert("Success", "Orders marked as served")
    loadData()
  }

  const filteredTables = statusFilter === "ALL"
    ? tables
    : tables.filter(t => t.status === statusFilter)

  const stats = {
    total: tables.length,
    vacant: tables.filter(t => t.status === "VACANT").length,
    occupied: tables.filter(t => t.status === "OCCUPIED").length,
    reserved: tables.filter(t => t.status === "RESERVED").length,
    maintenance: tables.filter(t => t.status === "MAINTENANCE").length,
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading floor plan...</Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      {/* Stats Bar */}
      <View style={styles.statsBar}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{stats.total}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        <View style={[styles.statItem, { backgroundColor: STATUS_COLORS.VACANT.bg }]}>
          <Text style={[styles.statValue, { color: STATUS_COLORS.VACANT.text }]}>{stats.vacant}</Text>
          <Text style={[styles.statLabel, { color: STATUS_COLORS.VACANT.text }]}>Vacant</Text>
        </View>
        <View style={[styles.statItem, { backgroundColor: STATUS_COLORS.OCCUPIED.bg }]}>
          <Text style={[styles.statValue, { color: STATUS_COLORS.OCCUPIED.text }]}>{stats.occupied}</Text>
          <Text style={[styles.statLabel, { color: STATUS_COLORS.OCCUPIED.text }]}>Occupied</Text>
        </View>
        <View style={[styles.statItem, { backgroundColor: STATUS_COLORS.RESERVED.bg }]}>
          <Text style={[styles.statValue, { color: STATUS_COLORS.RESERVED.text }]}>{stats.reserved}</Text>
          <Text style={[styles.statLabel, { color: STATUS_COLORS.RESERVED.text }]}>Reserved</Text>
        </View>
      </View>

      {/* Filter Buttons */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterBar}>
        {["ALL", "VACANT", "OCCUPIED", "RESERVED", "MAINTENANCE"].map(status => (
          <Pressable
            key={status}
            onPress={() => setStatusFilter(status)}
            style={[
              styles.filterBtn,
              statusFilter === status && styles.filterBtnActive,
            ]}
          >
            <Text style={[
              styles.filterBtnText,
              statusFilter === status && styles.filterBtnTextActive,
            ]}>
              {status}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* Tables Grid */}
      <ScrollView
        style={styles.scrollView}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={styles.tablesGrid}>
          {filteredTables.map(table => (
            <TableCard
              key={table.tableId}
              table={table}
              onPress={handleTablePress}
              onLongPress={handleTableLongPress}
              onTakeOrder={handleTakeOrder}
            />
          ))}
        </View>
      </ScrollView>

      {/* Order Modal */}
      {selectedTable && (
        <OrderModal
          visible={showOrderModal}
          table={selectedTable}
          onClose={() => setShowOrderModal(false)}
          onSubmit={submitOrder}
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.lightGray,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: COLORS.gray,
    textAlign: "center",
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.gray,
    textAlign: "center",
    padding: 20,
  },
  statsBar: {
    flexDirection: "row",
    padding: 12,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  statItem: {
    flex: 1,
    alignItems: "center",
    padding: 8,
    marginHorizontal: 4,
    borderRadius: 8,
    backgroundColor: COLORS.lightGray,
  },
  statValue: {
    fontSize: 20,
    fontWeight: "700",
    color: COLORS.black,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.gray,
    marginTop: 2,
  },
  filterBar: {
    backgroundColor: COLORS.white,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  filterBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginHorizontal: 4,
    borderRadius: 20,
    backgroundColor: COLORS.lightGray,
  },
  filterBtnActive: {
    backgroundColor: COLORS.primary,
  },
  filterBtnText: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.gray,
  },
  filterBtnTextActive: {
    color: COLORS.white,
  },
  scrollView: {
    flex: 1,
  },
  tablesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    padding: 8,
  },
  tableCard: {
    width: "48%",
    margin: "1%",
    padding: 12,
    borderRadius: 12,
    borderWidth: 2,
  },
  tableHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  tableId: {
    fontSize: 18,
    fontWeight: "700",
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  tableCapacity: {
    fontSize: 14,
    color: COLORS.gray,
    marginBottom: 4,
  },
  tableStatus: {
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 8,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: COLORS.black,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.lightGray,
    justifyContent: "center",
    alignItems: "center",
  },
  closeBtnText: {
    fontSize: 20,
    color: COLORS.gray,
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.black,
    marginTop: 16,
    marginBottom: 12,
  },
  menuGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 16,
  },
  menuItem: {
    width: "48%",
    margin: "1%",
    padding: 12,
    backgroundColor: COLORS.lightGray,
    borderRadius: 8,
  },
  menuName: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.black,
    marginBottom: 4,
  },
  menuPrice: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.primary,
    marginBottom: 2,
  },
  menuTime: {
    fontSize: 12,
    color: COLORS.gray,
  },
  cartItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
    backgroundColor: COLORS.lightGray,
    borderRadius: 8,
    marginBottom: 8,
  },
  cartItemInfo: {
    flex: 1,
  },
  cartItemName: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.black,
  },
  cartItemPrice: {
    fontSize: 12,
    color: COLORS.gray,
  },
  qtyControls: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  qtyBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  qtyBtnText: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.white,
  },
  qtyText: {
    fontSize: 16,
    fontWeight: "700",
    minWidth: 24,
    textAlign: "center",
  },
  notesSection: {
    marginTop: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.black,
    marginBottom: 8,
  },
  notesInput: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    minHeight: 80,
    textAlignVertical: "top",
  },
  totalSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    backgroundColor: COLORS.lightGray,
    borderRadius: 8,
    marginTop: 16,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.black,
  },
  totalAmount: {
    fontSize: 24,
    fontWeight: "700",
    color: COLORS.primary,
  },
  modalActions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 16,
    marginBottom: 32,
  },
  cancelBtn: {
    flex: 1,
    padding: 16,
    backgroundColor: COLORS.gray,
    borderRadius: 8,
    alignItems: "center",
  },
  cancelBtnText: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.white,
  },
  submitBtn: {
    flex: 1,
    padding: 16,
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    alignItems: "center",
  },
  submitBtnText: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.white,
  },
  takeOrderButton: {
    marginTop: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  takeOrderButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.white,
  },
  tabContainer: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    backgroundColor: COLORS.white,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: "center",
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  tabActive: {
    borderBottomColor: COLORS.primary,
  },
  tabText: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.gray,
  },
  tabTextActive: {
    color: COLORS.primary,
    fontWeight: "700",
  },
  previousOrderCard: {
    backgroundColor: COLORS.lightGray,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  previousOrderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  previousOrderId: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.black,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
  },
  previousOrderItem: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  previousOrderItemInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  previousOrderItemName: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.black,
    flex: 1,
  },
  previousOrderItemQty: {
    fontSize: 12,
    color: COLORS.gray,
  },
  timerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
    paddingVertical: 4,
    paddingHorizontal: 8,
    backgroundColor: "#DBEAFE",
    borderRadius: 4,
    alignSelf: "flex-start",
  },
  timerLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#1E40AF",
    marginRight: 4,
  },
  timerValue: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1E40AF",
    fontFamily: "monospace",
  },
  emptyStateContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
  },
  emptySubText: {
    fontSize: 12,
    color: COLORS.gray,
    marginTop: 4,
  },
})
