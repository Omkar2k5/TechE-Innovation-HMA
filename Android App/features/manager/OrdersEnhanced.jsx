"use client"

import { useState, useEffect } from "react"
import { 
  View, Text, StyleSheet, Pressable, Alert, ScrollView, 
  RefreshControl, ActivityIndicator, Modal, TextInput 
} from "react-native"
import AsyncStorage from '@react-native-async-storage/async-storage'
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
  PENDING: { bg: "#DBEAFE", text: "#1E40AF", icon: "⏳" },
  PREPARING: { bg: "#FEF3C7", text: "#92400E", icon: "👨‍🍳" },
  READY: { bg: "#D1FAE5", text: "#065F46", icon: "✅" },
  SERVED: { bg: "#F3F4F6", text: "#374151", icon: "🍽️" },
}

const formatTime = (seconds) => {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`
}

const getTimerColor = (seconds) => {
  if (seconds < 900) return COLORS.green // < 15 min
  if (seconds < 1800) return COLORS.yellow // 15-30 min
  return COLORS.red // > 30 min
}

const OrderCard = ({ order, onUpdateStatus, onAssignWaiter, onViewDetails }) => {
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  
  useEffect(() => {
    const placedAt = new Date(order.orderTime?.placedAt || order.createdAt)
    const updateTimer = () => {
      const elapsed = Math.floor((Date.now() - placedAt.getTime()) / 1000)
      setElapsedSeconds(elapsed)
    }
    
    updateTimer()
    const interval = setInterval(updateTimer, 1000)
    
    return () => clearInterval(interval)
  }, [order])

  const statusColor = STATUS_COLORS[order.orderStatus] || STATUS_COLORS.PENDING
  const timerColor = getTimerColor(elapsedSeconds)
  const totalItems = order.orderedItems?.reduce((sum, item) => sum + item.quantity, 0) || 0

  return (
    <View style={[styles.orderCard, { borderLeftColor: statusColor.text, borderLeftWidth: 4 }]}>
      <View style={styles.orderHeader}>
        <View>
          <Text style={styles.tableId}>Table {order.tableId}</Text>
          <Text style={styles.orderId}>Order #{order.orderId}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: statusColor.bg }]}>
          <Text style={[styles.statusText, { color: statusColor.text }]}>
            {statusColor.icon} {order.orderStatus}
          </Text>
        </View>
      </View>

      <View style={styles.orderInfo}>
        <Text style={styles.infoText}>👨‍💼 Waiter: {order.waiterAssigned || "Unassigned"}</Text>
        <Text style={styles.infoText}>🍽️ Items: {totalItems}</Text>
        <View style={[styles.timerBadge, { backgroundColor: timerColor + "20", borderColor: timerColor }]}>
          <Text style={[styles.timerText, { color: timerColor }]}>
            ⏱️ {formatTime(elapsedSeconds)}
          </Text>
        </View>
      </View>

      <View style={styles.itemsList}>
        {order.orderedItems?.slice(0, 3).map((item, idx) => (
          <View key={idx} style={styles.itemRow}>
            <Text style={styles.itemName}>{item.itemName}</Text>
            <Text style={styles.itemQty}>×{item.quantity}</Text>
            <View style={[styles.itemStatusBadge, { backgroundColor: STATUS_COLORS[item.status]?.bg || COLORS.lightGray }]}>
              <Text style={[styles.itemStatusText, { color: STATUS_COLORS[item.status]?.text || COLORS.gray }]}>
                {item.status}
              </Text>
            </View>
          </View>
        ))}
        {order.orderedItems?.length > 3 && (
          <Text style={styles.moreItems}>+{order.orderedItems.length - 3} more items</Text>
        )}
      </View>

      {order.notes && (
        <View style={styles.notesSection}>
          <Text style={styles.notesLabel}>📝 Notes:</Text>
          <Text style={styles.notesText}>{order.notes}</Text>
        </View>
      )}

      <View style={styles.orderActions}>
        <Pressable onPress={() => onViewDetails(order)} style={styles.actionBtn}>
          <Text style={styles.actionBtnText}>Details</Text>
        </Pressable>
        <Pressable onPress={() => onAssignWaiter(order)} style={[styles.actionBtn, { backgroundColor: COLORS.yellow }]}>
          <Text style={styles.actionBtnText}>Assign</Text>
        </Pressable>
        <Pressable 
          onPress={() => onUpdateStatus(order)} 
          style={[styles.actionBtn, { backgroundColor: COLORS.green }]}
        >
          <Text style={styles.actionBtnText}>
            {order.orderStatus === "PENDING" ? "Start" : order.orderStatus === "PREPARING" ? "Ready" : "Serve"}
          </Text>
        </Pressable>
      </View>
    </View>
  )
}

const OrderDetailsModal = ({ visible, order, onClose, onUpdateItemStatus }) => {
  if (!order) return null

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Order #{order.orderId}</Text>
          <Pressable onPress={onClose} style={styles.closeBtn}>
            <Text style={styles.closeBtnText}>✕</Text>
          </Pressable>
        </View>

        <ScrollView style={styles.modalContent}>
          <View style={styles.detailSection}>
            <Text style={styles.detailLabel}>Table:</Text>
            <Text style={styles.detailValue}>{order.tableId}</Text>
          </View>

          <View style={styles.detailSection}>
            <Text style={styles.detailLabel}>Status:</Text>
            <Text style={styles.detailValue}>{order.orderStatus}</Text>
          </View>

          <View style={styles.detailSection}>
            <Text style={styles.detailLabel}>Waiter:</Text>
            <Text style={styles.detailValue}>{order.waiterAssigned || "Unassigned"}</Text>
          </View>

          <View style={styles.detailSection}>
            <Text style={styles.detailLabel}>Priority:</Text>
            <Text style={styles.detailValue}>{order.priority || "NORMAL"}</Text>
          </View>

          <Text style={styles.sectionTitle}>Order Items</Text>
          {order.orderedItems?.map((item, idx) => (
            <View key={idx} style={styles.detailItem}>
              <View style={styles.detailItemHeader}>
                <Text style={styles.detailItemName}>{item.itemName}</Text>
                <Text style={styles.detailItemQty}>×{item.quantity}</Text>
              </View>
              <Text style={styles.detailItemTime}>Prep time: {item.preparationTimeMinutes} min</Text>
              {item.specialInstructions && (
                <Text style={styles.detailItemNotes}>Note: {item.specialInstructions}</Text>
              )}
              <View style={styles.itemStatusRow}>
                <Text style={styles.itemStatusLabel}>Status: {item.status}</Text>
                <Pressable 
                  onPress={() => onUpdateItemStatus(order.orderId, item, idx)}
                  style={styles.updateItemBtn}
                >
                  <Text style={styles.updateItemBtnText}>Update</Text>
                </Pressable>
              </View>
            </View>
          ))}

          {order.notes && (
            <View style={styles.detailNotesSection}>
              <Text style={styles.sectionTitle}>Order Notes</Text>
              <Text style={styles.detailNotesText}>{order.notes}</Text>
            </View>
          )}

          <View style={styles.detailTimeline}>
            <Text style={styles.sectionTitle}>Timeline</Text>
            {order.orderTime?.placedAt && (
              <Text style={styles.timelineItem}>
                📝 Placed: {new Date(order.orderTime.placedAt).toLocaleTimeString()}
              </Text>
            )}
            {order.orderTime?.startedPreparationAt && (
              <Text style={styles.timelineItem}>
                👨‍🍳 Started: {new Date(order.orderTime.startedPreparationAt).toLocaleTimeString()}
              </Text>
            )}
            {order.orderTime?.allItemsReadyAt && (
              <Text style={styles.timelineItem}>
                ✅ Ready: {new Date(order.orderTime.allItemsReadyAt).toLocaleTimeString()}
              </Text>
            )}
            {order.orderTime?.servedAt && (
              <Text style={styles.timelineItem}>
                🍽️ Served: {new Date(order.orderTime.servedAt).toLocaleTimeString()}
              </Text>
            )}
          </View>
        </ScrollView>
      </View>
    </Modal>
  )
}

export default function OrdersEnhanced() {
  const [orders, setOrders] = useState([])
  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [statusFilter, setStatusFilter] = useState("ALL")
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [notifiedOrders, setNotifiedOrders] = useState(new Set())

  useEffect(() => {
    loadNotifiedOrders()
    loadData()
    
    // No auto-refresh - user can pull to refresh manually
  }, [])

  const loadNotifiedOrders = async () => {
    try {
      const stored = await AsyncStorage.getItem('notifiedOrders')
      if (stored) {
        setNotifiedOrders(new Set(JSON.parse(stored)))
        console.log('📂 Loaded notified orders from storage')
      }
    } catch (error) {
      console.error('Error loading notified orders:', error)
    }
  }

  const saveNotifiedOrders = async (orders) => {
    try {
      await AsyncStorage.setItem('notifiedOrders', JSON.stringify([...orders]))
      console.log('💾 Saved notified orders to storage')
    } catch (error) {
      console.error('Error saving notified orders:', error)
    }
  }

  useEffect(() => {
    saveNotifiedOrders(notifiedOrders)
  }, [notifiedOrders])

  const loadData = async () => {
    try {
      if (!loading) {
        // Silent refresh - don't show loading spinner
      } else {
        setLoading(true)
      }
      console.log('📋 Loading orders data...')
      
      const ordersData = await syncService.fetchAndCacheOrders().catch(err => {
        console.error('❌ Orders fetch error:', err)
        return null
      })

      console.log('✅ Orders data:', ordersData)
      
      if (ordersData) {
        const ordersList = ordersData.orders || []
        console.log('📦 Orders count:', ordersList.length)
        setOrders(ordersList)
        
        // Check for READY items and show notifications (only once per item)
        ordersList.forEach(order => {
          if (order.orderedItems && Array.isArray(order.orderedItems)) {
            order.orderedItems.forEach((item, index) => {
              const itemKey = `${order.orderId}_${index}`
              if (item.status === 'READY' && !notifiedOrders.has(itemKey)) {
                console.log('🔔 New READY item detected:', item.itemName, 'for table', order.tableId)
                
                // Create notification with dish name
                const dishName = item.itemName || 'Dish'
                notificationService.sendNotification(
                  `✅ Table ${order.tableId} Ready!`,
                  `${dishName} is ready to serve`,
                  { type: "order_ready", tableId: order.tableId, orderId: order.orderId, itemName: dishName }
                )
                
                // Mark this item as notified
                setNotifiedOrders(prev => new Set([...prev, itemKey]))
              }
            })
          }
        })
        
        // Clean up notified orders that are no longer READY (served/cancelled)
        setNotifiedOrders(prev => {
          const newSet = new Set(prev)
          newSet.forEach(orderId => {
            const order = ordersList.find(o => o.orderId === orderId)
            if (!order || order.orderStatus !== 'READY') {
              newSet.delete(orderId)
            }
          })
          return newSet
        })
      }

    } catch (error) {
      console.error("❌ Error loading orders:", error)
      // Don't show alert on auto-refresh errors
      if (loading) {
        Alert.alert("Error", "Failed to load orders. Please check connection.")
      }
    } finally {
      if (loading) {
        setLoading(false)
      }
    }
  }

  const onRefresh = async () => {
    setRefreshing(true)
    await loadData()
    setRefreshing(false)
  }

  const updateOrderStatus = async (order) => {
    const nextStatus = 
      order.orderStatus === "PENDING" ? "PREPARING" :
      order.orderStatus === "PREPARING" ? "READY" :
      order.orderStatus === "READY" ? "SERVED" : order.orderStatus

    try {
      const isOnline = await syncService.checkOnline()
      
      if (isOnline) {
        await api.orders.updateStatus(order.orderId, nextStatus)
        
        if (nextStatus === "READY") {
          notificationService.sendOrderReadyNotification(order.tableId, order.orderId)
        }
      } else {
        await syncService.queueOperation("UPDATE_ORDER_STATUS", {
          orderId: order.orderId,
          status: nextStatus,
        })
      }

      setOrders(prev => prev.map(o => 
        o.orderId === order.orderId ? { ...o, orderStatus: nextStatus } : o
      ))
      
      // Clear notification tracking when order is served
      if (nextStatus === "SERVED") {
        notificationService.clearNotification(order.orderId)
        setNotifiedOrders(prev => {
          const newSet = new Set(prev)
          // Remove all item notifications for this order
          newSet.forEach(key => {
            if (key.startsWith(order.orderId)) {
              newSet.delete(key)
            }
          })
          return newSet
        })
      }

      Alert.alert("Success", `Order status updated to ${nextStatus}`)
    } catch (error) {
      console.error("Error updating order status:", error)
      Alert.alert("Error", "Failed to update order status")
    }
  }

  const assignWaiter = (order) => {
    const waiters = employees.filter(e => 
      e.role?.toLowerCase().includes("waiter") && e.isActive
    )

    if (waiters.length === 0) {
      Alert.alert("No Waiters", "No active waiters available")
      return
    }

    Alert.alert(
      "Assign Waiter",
      `Select waiter for Table ${order.tableId}`,
      [
        ...waiters.map(w => ({
          text: w.name,
          onPress: () => performWaiterAssignment(order.orderId, w.employeeId, w.name),
        })),
        { text: "Cancel", style: "cancel" },
      ]
    )
  }

  const performWaiterAssignment = async (orderId, waiterId, waiterName) => {
    try {
      const isOnline = await syncService.checkOnline()
      
      if (isOnline) {
        await api.orders.assignWaiter(orderId, waiterId)
      } else {
        await syncService.queueOperation("ASSIGN_WAITER", { orderId, waiterId })
      }

      setOrders(prev => prev.map(o => 
        o.orderId === orderId ? { ...o, waiterAssigned: waiterName } : o
      ))

      Alert.alert("Success", `${waiterName} assigned to order`)
    } catch (error) {
      console.error("Error assigning waiter:", error)
      Alert.alert("Error", "Failed to assign waiter")
    }
  }

  const viewOrderDetails = (order) => {
    setSelectedOrder(order)
    setShowDetailsModal(true)
  }

  const updateItemStatus = (orderId, item, itemIndex) => {
    const nextStatus = 
      item.status === "PENDING" ? "PREPARING" :
      item.status === "PREPARING" ? "READY" :
      item.status === "READY" ? "SERVED" : item.status

    Alert.alert(
      "Update Item Status",
      `Change ${item.itemName} to ${nextStatus}?`,
      [
        {
          text: "Confirm",
          onPress: async () => {
            try {
              const isOnline = await syncService.checkOnline()
              
              if (isOnline) {
                await api.orders.updateItemStatus(orderId, itemIndex, nextStatus)
              } else {
                await syncService.queueOperation("UPDATE_ITEM_STATUS", {
                  orderId,
                  itemId: itemIndex,
                  status: nextStatus,
                })
              }

              setOrders(prev => prev.map(o => {
                if (o.orderId === orderId) {
                  const updatedItems = [...o.orderedItems]
                  updatedItems[itemIndex] = { ...updatedItems[itemIndex], status: nextStatus }
                  return { ...o, orderedItems: updatedItems }
                }
                return o
              }))

              Alert.alert("Success", "Item status updated")
            } catch (error) {
              console.error("Error updating item status:", error)
              Alert.alert("Error", "Failed to update item status")
            }
          },
        },
        { text: "Cancel", style: "cancel" },
      ]
    )
  }

  const filteredOrders = statusFilter === "ALL"
    ? orders.filter(o => o.isActive && o.orderStatus !== "SERVED")
    : orders.filter(o => o.isActive && o.orderStatus === statusFilter)

  const stats = {
    pending: orders.filter(o => o.orderStatus === "PENDING" && o.isActive).length,
    preparing: orders.filter(o => o.orderStatus === "PREPARING" && o.isActive).length,
    ready: orders.filter(o => o.orderStatus === "READY" && o.isActive).length,
    served: orders.filter(o => o.orderStatus === "SERVED" && o.isActive).length,
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading orders...</Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      {/* Stats Bar */}
      <View style={styles.statsBar}>
        <View style={[styles.statItem, { backgroundColor: STATUS_COLORS.PENDING.bg }]}>
          <Text style={[styles.statValue, { color: STATUS_COLORS.PENDING.text }]}>{stats.pending}</Text>
          <Text style={[styles.statLabel, { color: STATUS_COLORS.PENDING.text }]}>Pending</Text>
        </View>
        <View style={[styles.statItem, { backgroundColor: STATUS_COLORS.PREPARING.bg }]}>
          <Text style={[styles.statValue, { color: STATUS_COLORS.PREPARING.text }]}>{stats.preparing}</Text>
          <Text style={[styles.statLabel, { color: STATUS_COLORS.PREPARING.text }]}>Preparing</Text>
        </View>
        <View style={[styles.statItem, { backgroundColor: STATUS_COLORS.READY.bg }]}>
          <Text style={[styles.statValue, { color: STATUS_COLORS.READY.text }]}>{stats.ready}</Text>
          <Text style={[styles.statLabel, { color: STATUS_COLORS.READY.text }]}>Ready</Text>
        </View>
      </View>

      {/* Filter Buttons */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterBar}>
        {["ALL", "PENDING", "PREPARING", "READY"].map(status => (
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

      {/* Orders List */}
      <ScrollView
        style={styles.scrollView}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {filteredOrders.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No active orders</Text>
          </View>
        ) : (
          filteredOrders.map(order => (
            <OrderCard
              key={order.orderId}
              order={order}
              onUpdateStatus={updateOrderStatus}
              onAssignWaiter={assignWaiter}
              onViewDetails={viewOrderDetails}
            />
          ))
        )}
      </ScrollView>

      {/* Order Details Modal */}
      <OrderDetailsModal
        visible={showDetailsModal}
        order={selectedOrder}
        onClose={() => setShowDetailsModal(false)}
        onUpdateItemStatus={updateItemStatus}
      />
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
    padding: 12,
    marginHorizontal: 4,
    borderRadius: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: "700",
  },
  statLabel: {
    fontSize: 12,
    marginTop: 4,
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
  emptyState: {
    padding: 48,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.gray,
  },
  orderCard: {
    margin: 12,
    padding: 16,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  orderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  tableId: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.black,
  },
  orderId: {
    fontSize: 12,
    color: COLORS.gray,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "700",
  },
  orderInfo: {
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    color: COLORS.gray,
    marginBottom: 4,
  },
  timerBadge: {
    marginTop: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignSelf: "flex-start",
  },
  timerText: {
    fontSize: 14,
    fontWeight: "700",
  },
  itemsList: {
    marginBottom: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  itemName: {
    flex: 1,
    fontSize: 14,
    color: COLORS.black,
  },
  itemQty: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.gray,
    marginRight: 8,
  },
  itemStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  itemStatusText: {
    fontSize: 10,
    fontWeight: "600",
  },
  moreItems: {
    fontSize: 12,
    color: COLORS.gray,
    fontStyle: "italic",
  },
  notesSection: {
    marginTop: 8,
    padding: 12,
    backgroundColor: COLORS.lightGray,
    borderRadius: 8,
  },
  notesLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.black,
    marginBottom: 4,
  },
  notesText: {
    fontSize: 12,
    color: COLORS.gray,
  },
  orderActions: {
    flexDirection: "row",
    gap: 8,
    marginTop: 12,
  },
  actionBtn: {
    flex: 1,
    padding: 12,
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    alignItems: "center",
  },
  actionBtnText: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.white,
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
  detailSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.gray,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.black,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.black,
    marginTop: 24,
    marginBottom: 12,
  },
  detailItem: {
    padding: 12,
    backgroundColor: COLORS.lightGray,
    borderRadius: 8,
    marginBottom: 12,
  },
  detailItemHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  detailItemName: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.black,
  },
  detailItemQty: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.primary,
  },
  detailItemTime: {
    fontSize: 12,
    color: COLORS.gray,
    marginBottom: 4,
  },
  detailItemNotes: {
    fontSize: 12,
    color: COLORS.gray,
    fontStyle: "italic",
    marginBottom: 8,
  },
  itemStatusRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  itemStatusLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.black,
  },
  updateItemBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: COLORS.primary,
    borderRadius: 6,
  },
  updateItemBtnText: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.white,
  },
  detailNotesSection: {
    marginTop: 16,
  },
  detailNotesText: {
    fontSize: 14,
    color: COLORS.gray,
    padding: 12,
    backgroundColor: COLORS.lightGray,
    borderRadius: 8,
  },
  detailTimeline: {
    marginTop: 16,
    marginBottom: 32,
  },
  timelineItem: {
    fontSize: 14,
    color: COLORS.gray,
    marginBottom: 8,
    paddingLeft: 8,
  },
})
