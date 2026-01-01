import { View, Text, StyleSheet, Pressable, Alert, Modal, ScrollView } from "react-native"
import { useState } from "react"
import { COLORS } from "../../store/app-store"

const RANGES = ["Today", "7d", "30d"]

// Safe function to capitalize text
const safeCapitalize = (str) => {
  if (!str || typeof str !== 'string') return 'Unknown'
  return str.charAt(0).toUpperCase() + str.slice(1)
}

function KPI({ label, value, tone = "blue", note, onPress }) {
  return (
    <Pressable onPress={onPress} style={styles.kpi}>
      <View style={styles.kpiHeader}>
        <View style={[styles.dot, { backgroundColor: tone === "blue" ? COLORS.primary : COLORS.red }]} />
        <Text style={styles.kpiLabel}>{label}</Text>
        {note && (
          <Text
            style={[
              styles.kpiBadge,
              {
                color: tone === "blue" ? COLORS.primary : COLORS.red,
                backgroundColor: tone === "blue" ? COLORS.primary + "20" : COLORS.red + "20",
              },
            ]}
          >
            {note}
          </Text>
        )}
      </View>
      <Text style={styles.kpiValue}>{value}</Text>
    </Pressable>
  )
}

function TableStatusModal({ visible, onClose, tables }) {
  const getStatusColor = (status) => {
    if (!status) return COLORS.muted
    switch (status) {
      case "vacant":
        return COLORS.green
      case "occupied":
        return COLORS.primary
      case "reserved":
        return COLORS.yellow
      case "cleaning":
        return COLORS.gray
      default:
        return COLORS.muted
    }
  }

  const getStatusIcon = (status) => {
    if (!status) return "❓"
    switch (status) {
      case "vacant":
        return "✅"
      case "occupied":
        return "👥"
      case "reserved":
        return "📅"
      case "cleaning":
        return "🧹"
      default:
        return "❓"
    }
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Table Status Overview</Text>
          <Pressable onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>✕</Text>
          </Pressable>
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.tableGrid}>
            {tables.map((table) => (
              <View key={table.id} style={styles.tableCard}>
                <View style={styles.tableHeader}>
                  <Text style={styles.tableNumber}>Table {table.number}</Text>
                  <Text style={styles.tableIcon}>{getStatusIcon(table.status)}</Text>
                </View>

                <View style={styles.tableInfo}>
                  <View style={[
                    styles.statusBadge,
                    { backgroundColor: getStatusColor(table.status) + "20" }
                  ]}>
                    <Text style={[
                      styles.statusText,
                      { color: getStatusColor(table.status) }
                    ]}>
                      {safeCapitalize(table.status)}
                    </Text>
                  </View>

                  <Text style={styles.tableSeats}>{table.seats} seats</Text>
                </View>

                {table.order && (
                  <View style={styles.orderInfo}>
                    <Text style={styles.orderText}>Order: ₹{table.order.total || 0}</Text>
                    <Text style={styles.orderStatus}>{safeCapitalize(table.order.status)}</Text>
                  </View>
                )}

                {table.customer && (
                  <Text style={styles.customerText}>Customer: {table.customer}</Text>
                )}
              </View>
            ))}
          </View>

          <View style={styles.modalStats}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{tables.filter(t => t.status === "vacant").length}</Text>
              <Text style={styles.statLabel}>Vacant</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{tables.filter(t => t.status === "occupied").length}</Text>
              <Text style={styles.statLabel}>Occupied</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{tables.filter(t => t.status === "reserved").length}</Text>
              <Text style={styles.statLabel}>Reserved</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{tables.filter(t => t.status === "cleaning").length}</Text>
              <Text style={styles.statLabel}>Cleaning</Text>
            </View>
          </View>
        </ScrollView>
      </View>
    </Modal>
  )
}

function RevenueHistoryModal({ visible, onClose, completedOrders, range }) {
  const formatDate = (timestamp) => {
    if (!timestamp) return 'Unknown time'
    const date = new Date(timestamp)
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  const getOrderStatusColor = (status) => {
    if (!status) return COLORS.muted
    switch (status) {
      case "completed":
        return COLORS.green
      case "served":
        return COLORS.primary
      default:
        return COLORS.muted
    }
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Revenue History ({range})</Text>
          <Pressable onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>✕</Text>
          </Pressable>
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.transactionsList}>
            {completedOrders && completedOrders.length > 0 ? (
              completedOrders.map((order, index) => (
                <View key={index} style={styles.transactionCard}>
                  <View style={styles.transactionHeader}>
                    <View>
                      <Text style={styles.transactionTable}>Table {order.tableNumber || 'Unknown'}</Text>
                      <Text style={styles.transactionDate}>{formatDate(order.finishedAt)}</Text>
                    </View>
                    <View style={styles.transactionAmount}>
                      <Text style={styles.transactionValue}>₹{(order.total || 0).toFixed(2)}</Text>
                      <View style={[
                        styles.transactionStatus,
                        { backgroundColor: getOrderStatusColor(order.status) + "20" }
                      ]}>
                        <Text style={[
                          styles.transactionStatusText,
                          { color: getOrderStatusColor(order.status) }
                        ]}>
                          {safeCapitalize(order.status) || 'Completed'}
                        </Text>
                      </View>
                    </View>
                  </View>

                  {order.items && order.items.length > 0 && (
                    <View style={styles.transactionItems}>
                      <Text style={styles.itemsHeader}>Items:</Text>
                      {order.items.map((item, itemIndex) => (
                        <View key={itemIndex} style={styles.itemRow}>
                          <Text style={styles.itemName}>{item.name || 'Unknown item'}</Text>
                          <Text style={styles.itemDetails}>x{item.quantity || 0} - ₹{((item.price || 0) * (item.quantity || 0)).toFixed(2)}</Text>
                        </View>
                      ))}
                    </View>
                  )}

                  {order.customer && (
                    <Text style={styles.transactionCustomer}>Customer: {order.customer}</Text>
                  )}
                </View>
              ))
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>No transactions found for {range.toLowerCase()}</Text>
              </View>
            )}
          </View>

          <View style={styles.revenueSummary}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>{completedOrders ? completedOrders.length : 0}</Text>
              <Text style={styles.summaryLabel}>Total Orders</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>
                ₹{completedOrders ? completedOrders.reduce((sum, order) => sum + (order.total || 0), 0).toFixed(2) : '0.00'}
              </Text>
              <Text style={styles.summaryLabel}>Total Revenue</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>
                ₹{completedOrders && completedOrders.length > 0 ? (completedOrders.reduce((sum, order) => sum + (order.total || 0), 0) / completedOrders.length).toFixed(2) : '0.00'}
              </Text>
              <Text style={styles.summaryLabel}>Avg Order</Text>
            </View>
          </View>
        </ScrollView>
      </View>
    </Modal>
  )
}

function PendingOrdersModal({ visible, onClose, tables }) {
  const safeTables = tables || []
  const pendingOrderTables = safeTables.filter(table =>
    table &&
    table.order &&
    table.order.status &&
    table.order.status !== "served"
  )

  const getOrderStatusColor = (status) => {
    if (!status) return COLORS.muted
    switch (status) {
      case "preparing":
        return COLORS.yellow
      case "ready":
        return COLORS.green
      case "ordered":
        return COLORS.primary
      default:
        return COLORS.muted
    }
  }

  const getOrderPriority = (order) => {
    if (!order) return { priority: "Normal", color: COLORS.green }
    const now = Date.now()
    const orderTime = order.startedAt || now
    const waitTime = (now - orderTime) / 60000 // minutes

    if (waitTime > 30) return { priority: "High", color: COLORS.red }
    if (waitTime > 15) return { priority: "Medium", color: COLORS.yellow }
    return { priority: "Normal", color: COLORS.green }
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Pending Orders</Text>
          <Pressable onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>✕</Text>
          </Pressable>
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.pendingOrdersList}>
            {pendingOrderTables.length > 0 ? (
              pendingOrderTables.map((table) => {
                const priority = getOrderPriority(table.order)
                return (
                  <View key={table.id} style={styles.pendingOrderCard}>
                    <View style={styles.pendingOrderHeader}>
                      <View>
                        <Text style={styles.pendingTableNumber}>Table {table.number || 'Unknown'}</Text>
                        {table.customer && (
                          <Text style={styles.pendingCustomer}>{table.customer}</Text>
                        )}
                      </View>
                      <View style={styles.pendingOrderMeta}>
                        <Text style={styles.pendingOrderTotal}>₹{(table.order?.total || 0).toFixed(2)}</Text>
                        <View style={[
                          styles.priorityBadge,
                          { backgroundColor: priority.color + "20" }
                        ]}>
                          <Text style={[
                            styles.priorityText,
                            { color: priority.color }
                          ]}>
                            {priority.priority}
                          </Text>
                        </View>
                      </View>
                    </View>

                    <View style={styles.pendingOrderStatus}>
                      <View style={[
                        styles.orderStatusBadge,
                        { backgroundColor: getOrderStatusColor(table.order?.status) + "20" }
                      ]}>
                        <Text style={[
                          styles.orderStatusText,
                          { color: getOrderStatusColor(table.order?.status) }
                        ]}>
                          {safeCapitalize(table.order?.status) || 'Pending'}
                        </Text>
                      </View>
                      <Text style={styles.orderTime}>
                        {table.order?.startedAt ?
                          `${Math.round((Date.now() - table.order.startedAt) / 60000)} mins ago` :
                          'Just now'
                        }
                      </Text>
                    </View>

                    {table.order?.items && table.order.items.length > 0 && (
                      <View style={styles.pendingOrderItems}>
                        {table.order.items.map((item, index) => (
                          <View key={index} style={styles.pendingItemRow}>
                            <Text style={styles.pendingItemName}>{item.name || 'Unknown item'}</Text>
                            <Text style={styles.pendingItemQuantity}>x{item.quantity || 0}</Text>
                          </View>
                        ))}
                      </View>
                    )}

                    {table.order?.notes && (
                      <Text style={styles.orderNotes}>Notes: {table.order.notes}</Text>
                    )}
                  </View>
                )
              })
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>No pending orders</Text>
                <Text style={styles.emptyStateSubtext}>All orders are up to date! 🎉</Text>
              </View>
            )}
          </View>

          {pendingOrderTables.length > 0 && (
            <View style={styles.pendingSummary}>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryValue}>{pendingOrderTables.length}</Text>
                <Text style={styles.summaryLabel}>Pending Orders</Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryValue}>
                  ₹{pendingOrderTables.reduce((sum, table) => sum + (table.order?.total || 0), 0).toFixed(2)}
                </Text>
                <Text style={styles.summaryLabel}>Pending Value</Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryValue}>
                  {pendingOrderTables.filter(table => {
                    const priority = getOrderPriority(table.order)
                    return priority.priority === "High"
                  }).length}
                </Text>
                <Text style={styles.summaryLabel}>High Priority</Text>
              </View>
            </View>
          )}
        </ScrollView>
      </View>
    </Modal>
  )
}

export default function OverviewTab({ state }) {
  const [range, setRange] = useState("Today")
  const [showTableModal, setShowTableModal] = useState(false)
  const [showRevenueModal, setShowRevenueModal] = useState(false)
  const [showPendingModal, setShowPendingModal] = useState(false)

  const safeTables = state?.tables || []
  const safeCompletedOrders = state?.completedOrders || []

  const activeTables = safeTables.filter((t) => t?.status && t.status !== "vacant").length
  const totalTables = safeTables.length
  const pendingOrders = safeTables.filter((t) => t?.order && t.order.status && t.order.status !== "served").length
  const totalCollection = safeCompletedOrders.reduce((sum, order) => sum + (order?.total || 0), 0)
  const avgTurnaround =
    safeCompletedOrders.length > 0
      ? safeCompletedOrders.reduce((sum, order) => {
          const start = order?.startedAt || 0
          const finish = order?.finishedAt || 0
          return sum + (finish - start)
        }, 0) / safeCompletedOrders.length / 60000
      : 0

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Business Overview</Text>

      <View style={styles.rangeSelector}>
        {RANGES.map((r) => (
          <Pressable
            key={r}
            onPress={() => setRange(r)}
            style={[
              styles.rangeBadge,
              { backgroundColor: range === r ? COLORS.primary + "20" : COLORS.border }
            ]}
          >
            <Text style={[
              styles.rangeBadgeText,
              { color: range === r ? COLORS.primary : COLORS.muted }
            ]}>
              {r}
            </Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.kpiGrid}>
        <KPI
          label="Active Tables"
          value={`${activeTables}/${totalTables}`}
          tone={activeTables > totalTables * 0.7 ? "red" : "blue"}
          note={activeTables > totalTables * 0.7 ? "High" : "Normal"}
          onPress={() => setShowTableModal(true)}
        />
        <KPI
          label="Pending Orders"
          value={pendingOrders}
          tone={pendingOrders > 5 ? "red" : "blue"}
          note={pendingOrders > 5 ? "Urgent" : "Normal"}
          onPress={() => setShowPendingModal(true)}
        />
        <KPI
          label="Today's Revenue"
          value={`₹${totalCollection.toFixed(0)}`}
          tone="blue"
          note="Good"
          onPress={() => setShowRevenueModal(true)}
        />
        <KPI
          label="Avg Turnaround"
          value={`${Math.round(avgTurnaround)} mins`}
          tone={avgTurnaround > 30 ? "red" : "blue"}
          note={avgTurnaround > 30 ? "Slow" : "Efficient"}
          onPress={() => Alert.alert("Turnaround", "Average time from order to serve.")}
        />
      </View>

      <TableStatusModal
        visible={showTableModal}
        onClose={() => setShowTableModal(false)}
        tables={safeTables}
      />

      <RevenueHistoryModal
        visible={showRevenueModal}
        onClose={() => setShowRevenueModal(false)}
        completedOrders={safeCompletedOrders}
        range={range}
      />

      <PendingOrdersModal
        visible={showPendingModal}
        onClose={() => setShowPendingModal(false)}
        tables={safeTables}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: COLORS.fg,
    marginBottom: 16,
  },
  rangeSelector: {
    flexDirection: "row",
    marginBottom: 16,
    gap: 8,
  },
  rangeBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.border,
  },
  rangeBadgeText: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.muted,
  },
  kpiGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  kpi: {
    flex: 1,
    minWidth: "47%",
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  kpiHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
  },
  kpiLabel: {
    flex: 1,
    fontSize: 14,
    color: COLORS.muted,
    fontWeight: "500",
  },
  kpiBadge: {
    fontSize: 12,
    fontWeight: "600",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    color: COLORS.primary,
    backgroundColor: COLORS.primary + "20",
  },
  kpiValue: {
    fontSize: 28,
    fontWeight: "800",
    color: COLORS.fg,
  },

  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: COLORS.bg,
    padding: 16,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    paddingTop: 10,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: COLORS.fg,
  },
  closeButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: COLORS.gray + "20",
    alignItems: "center",
    justifyContent: "center",
  },
  closeButtonText: {
    fontSize: 16,
    color: COLORS.gray,
    fontWeight: "600",
  },

  // Table grid styles
  tableGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 20,
  },
  tableCard: {
    flex: 1,
    minWidth: "45%",
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  tableHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  tableNumber: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.fg,
  },
  tableIcon: {
    fontSize: 18,
  },
  tableInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "600",
  },
  tableSeats: {
    fontSize: 12,
    color: COLORS.muted,
  },
  orderInfo: {
    marginTop: 4,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  orderText: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.fg,
  },
  orderStatus: {
    fontSize: 11,
    color: COLORS.muted,
    marginTop: 2,
  },
  customerText: {
    fontSize: 11,
    color: COLORS.muted,
    marginTop: 4,
  },

  // Modal stats styles
  modalStats: {
    flexDirection: "row",
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statValue: {
    fontSize: 24,
    fontWeight: "800",
    color: COLORS.fg,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.muted,
    fontWeight: "500",
  },

  // Revenue History Modal styles
  transactionsList: {
    marginBottom: 20,
  },
  transactionCard: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  transactionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  transactionTable: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.fg,
  },
  transactionDate: {
    fontSize: 12,
    color: COLORS.muted,
    marginTop: 2,
  },
  transactionAmount: {
    alignItems: "flex-end",
  },
  transactionValue: {
    fontSize: 18,
    fontWeight: "800",
    color: COLORS.fg,
    marginBottom: 4,
  },
  transactionStatus: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  transactionStatusText: {
    fontSize: 11,
    fontWeight: "600",
  },
  transactionItems: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  itemsHeader: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.muted,
    marginBottom: 4,
  },
  itemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 2,
  },
  itemName: {
    fontSize: 12,
    color: COLORS.fg,
    flex: 1,
  },
  itemDetails: {
    fontSize: 12,
    color: COLORS.muted,
  },
  transactionCustomer: {
    fontSize: 11,
    color: COLORS.muted,
    marginTop: 4,
  },
  revenueSummary: {
    flexDirection: "row",
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  summaryItem: {
    flex: 1,
    alignItems: "center",
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: "800",
    color: COLORS.fg,
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 11,
    color: COLORS.muted,
    fontWeight: "500",
  },

  // Pending Orders Modal styles
  pendingOrdersList: {
    marginBottom: 20,
  },
  pendingOrderCard: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  pendingOrderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  pendingTableNumber: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.fg,
  },
  pendingCustomer: {
    fontSize: 12,
    color: COLORS.muted,
    marginTop: 2,
  },
  pendingOrderMeta: {
    alignItems: "flex-end",
  },
  pendingOrderTotal: {
    fontSize: 18,
    fontWeight: "800",
    color: COLORS.fg,
    marginBottom: 4,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  priorityText: {
    fontSize: 11,
    fontWeight: "600",
  },
  pendingOrderStatus: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  orderStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  orderStatusText: {
    fontSize: 11,
    fontWeight: "600",
  },
  orderTime: {
    fontSize: 12,
    color: COLORS.muted,
  },
  pendingOrderItems: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  pendingItemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  pendingItemName: {
    fontSize: 12,
    color: COLORS.fg,
    flex: 1,
  },
  pendingItemQuantity: {
    fontSize: 12,
    color: COLORS.muted,
    fontWeight: "600",
  },
  orderNotes: {
    fontSize: 11,
    color: COLORS.muted,
    marginTop: 6,
    fontStyle: "italic",
  },
  pendingSummary: {
    flexDirection: "row",
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },

  // Empty state styles
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.muted,
    textAlign: "center",
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: COLORS.muted,
    textAlign: "center",
    marginTop: 4,
  },
})