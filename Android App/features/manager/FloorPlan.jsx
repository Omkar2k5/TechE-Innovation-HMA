"use client"

import { useEffect, useRef, useState } from "react"
import { ScrollView, View, Text, StyleSheet, Pressable, Alert, TextInput, Modal } from "react-native"
import { useApp, COLORS } from "../../store/app-store"
import TimerBadge from "../../components/timer-badge"


const ReservationModal = ({ visible, onClose, onConfirm }) => {
  const [customerName, setCustomerName] = useState("")
  const [partySize, setPartySize] = useState("2")
  const [specialRequests, setSpecialRequests] = useState("")
  const [phoneNumber, setPhoneNumber] = useState("")

  const resetForm = () => {
    setCustomerName("")
    setPartySize("2")
    setSpecialRequests("")
    setPhoneNumber("")
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  const handleConfirm = () => {
    if (!customerName.trim()) {
      Alert.alert("Required Field", "Please enter customer name")
      return
    }
    onConfirm({ customerName, partySize: Number.parseInt(partySize), specialRequests, phoneNumber })
    resetForm()
    onClose()
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>✨ New Reservation</Text>
          <Pressable onPress={handleClose} style={styles.closeBtn}>
            <Text style={styles.closeBtnText}>✕</Text>
          </Pressable>
        </View>
        <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>👤 Customer Name *</Text>
            <TextInput
              style={[styles.textInput, !customerName.trim() && styles.textInputRequired]}
              value={customerName}
              onChangeText={setCustomerName}
              placeholder="Enter customer name"
              placeholderTextColor={COLORS.gray}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>👥 Party Size</Text>
            <View style={styles.partySizeRow}>
              {[1, 2, 3, 4, 5, 6, 8].map((size) => (
                <Pressable
                  key={size}
                  onPress={() => setPartySize(size.toString())}
                  style={[styles.sizeBtn, partySize === size.toString() && styles.sizeBtnActive]}
                >
                  <Text style={[styles.sizeBtnText, partySize === size.toString() && styles.sizeBtnTextActive]}>
                    {size}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>📞 Phone Number</Text>
            <TextInput
              style={styles.textInput}
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              placeholder="Customer phone number"
              placeholderTextColor={COLORS.gray}
              keyboardType="phone-pad"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>📝 Special Requests</Text>
            <TextInput
              style={[styles.textInput, styles.multilineInput]}
              value={specialRequests}
              onChangeText={setSpecialRequests}
              placeholder="Allergies, dietary preferences, special occasions, seating requests..."
              placeholderTextColor={COLORS.gray}
              multiline
              numberOfLines={4}
            />
          </View>

          <View style={styles.modalActions}>
            <Pressable onPress={handleClose} style={styles.cancelBtn}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </Pressable>
            <Pressable onPress={handleConfirm} style={styles.confirmBtn}>
              <Text style={styles.confirmBtnText}>✓ Confirm Reservation</Text>
            </Pressable>
          </View>
        </ScrollView>
      </View>
    </Modal>
  )
}

const StatusChip = ({ label, active, count, onPress, color }) => (
  <Pressable onPress={onPress} style={[styles.statusChip, active && styles.statusChipActive, active && { borderColor: color }]} accessibilityRole="button">
    <View style={[styles.statusDot, { backgroundColor: color }]} />
    <Text style={[styles.statusChipText, active && styles.statusChipTextActive]}>{label}</Text>
    {count > 0 && (
      <View style={[styles.countBadge, { backgroundColor: color }]}>
        <Text style={styles.countBadgeText}>{count}</Text>
      </View>
    )}
  </Pressable>
)

export default function FloorPlan() {
  const { state, dispatch } = useApp()
  const [selectedTable, setSelectedTable] = useState(null)
  const [orderNotes, setOrderNotes] = useState("")
  const [statusFilter, setStatusFilter] = useState("All")
  const [detailsFor, setDetailsFor] = useState(null)
  const [prepTimers, setPrepTimers] = useState({})
  const [showReservation, setShowReservation] = useState(false)
  const intervalRef = useRef()
  const prepIntervalRef = useRef(null)

  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current)
    const runningTables = state.tables.filter((t) => t.timer.running)
    if (runningTables.length > 0) {
      intervalRef.current = setInterval(() => {
        runningTables.forEach((t) => {
          const elapsedSec = Math.floor((Date.now() - t.timer.startedAt) / 1000)
          dispatch({ type: "TIMER_TICK", tableId: t.id, elapsedSec })

          if (elapsedSec > 0 && elapsedSec % 900 === 0 && elapsedSec / 900 > t.timer.reminders) {
            Alert.alert(
              "⏰ Table Reminder",
              `Table ${t.id} needs attention - ${Math.floor(elapsedSec / 60)} minutes elapsed`,
            )
          }
        })
      }, 1000)
    }
    return () => clearInterval(intervalRef.current)
  }, [state.tables, dispatch])

  useEffect(() => {
    if (prepIntervalRef.current) clearInterval(prepIntervalRef.current)
    prepIntervalRef.current = setInterval(() => {
      setPrepTimers((prev) => {
        const next = { ...prev }
        Object.keys(next).forEach((k) => {
          if (next[k]?.running) next[k].seconds += 1
        })
        return next
      })
    }, 1000)
    return () => clearInterval(prepIntervalRef.current)
  }, [])

  const tableStatusCycle = {
    vacant: "occupied",
    occupied: "ordering",
    ordering: "served",
    served: "bill_pending",
    bill_pending: "vacant",
  }

  const statusConfig = {
    vacant: { color: COLORS.green, icon: "🟢", label: "Available" },
    occupied: { color: COLORS.primary, icon: "🔵", label: "Seated" },
    ordering: { color: "#f59e0b", icon: "🟡", label: "Ordering" },
    served: { color: "#10b981", icon: "🟢", label: "Served" },
    bill_pending: { color: COLORS.red, icon: "🔴", label: "Billing" }
  }

  const getStatusCounts = () => {
    const counts = {}
    Object.keys(statusConfig).forEach(status => {
      counts[status] = state.tables.filter(t => t.status === status).length
    })
    return counts
  }

  const statusCounts = getStatusCounts()

  const toggleTableStatus = (tableId) => {
    const table = state.tables.find((t) => t.id === tableId)
    const next = tableStatusCycle[table.status]
    dispatch({ type: "TOGGLE_TABLE_STATUS", id: tableId, next })

    if (next === "ordering") {
      dispatch({ type: "START_ORDER", tableId, notes: orderNotes })
      setOrderNotes("")
    }
  }

  const assignWaiter = (tableId) => {
    const availableWaiters = state.staff.filter((s) => s.role.includes("Waiter") && s.active)
    if (availableWaiters.length === 0) {
      Alert.alert("❌ No Available Waiters", "All waiters are currently inactive or unavailable.")
      return
    }

    Alert.alert(
      "👨‍💼 Assign Waiter",
      "Select a waiter for this table:",
      availableWaiters
        .map((w) => ({
          text: `${w.name} ${w.active ? "✓" : ""}`,
          onPress: () => dispatch({ type: "ASSIGN_WAITER", tableId, waiterId: w.id }),
        }))
        .concat([{ text: "Cancel", style: "cancel" }]),
    )
  }

  const quickActions = (tableId) => {
    const table = state.tables.find((t) => t.id === tableId)
    Alert.alert(`🍽️ Table ${tableId} Actions`, `Status: ${statusConfig[table.status]?.label || table.status}`, [
      { text: "👨‍💼 Assign Waiter", onPress: () => assignWaiter(tableId) },
      {
        text: "🧹 Request Busser",
        onPress: () => Alert.alert("✅ Busser Requested", `Busser has been notified for table ${tableId}`),
      },
      { text: "👨‍🍳 Call Cook", onPress: () => Alert.alert("✅ Cook Notified", `Kitchen has been notified about table ${tableId}`) },
      { text: "💳 Complete & Bill", onPress: () => dispatch({ type: "COMPLETE_AND_BILL", tableId }) },
      { text: "Cancel", style: "cancel" },
    ])
  }

  const allocateWalkIn = () => {
    const vacant = state.tables.find((t) => t.status === "vacant")
    if (!vacant) return Alert.alert("❌ No Vacant Tables", "All tables are currently occupied or in use.")
    dispatch({ type: "TOGGLE_TABLE_STATUS", id: vacant.id, next: "occupied" })
    Alert.alert("✅ Table Allocated", `Walk-in guest assigned to Table ${vacant.id}`)
  }

  const handleReservation = (reservationData) => {
    const vacant = state.tables.find((t) => t.status === "vacant")
    if (!vacant) {
      Alert.alert("❌ No Vacant Tables", "All tables are currently occupied. Please check availability.")
      return
    }

    dispatch({
      type: "CREATE_RESERVATION",
      tableId: vacant.id,
      customerData: reservationData,
      estimatedArrival: Date.now() + 30 * 60 * 1000,
    })

    Alert.alert(
      "✅ Reservation Confirmed",
      `Table ${vacant.id} reserved for ${reservationData.customerName}\nParty size: ${reservationData.partySize} guests\nETA: 30 minutes`,
    )
  }

  const keyFor = (tableId, menuId) => `${tableId}:${menuId}`
  const getPrep = (tableId, menuId) => prepTimers[keyFor(tableId, menuId)] || { seconds: 0, running: false }
  const togglePrep = (tableId, menuId) =>
    setPrepTimers((prev) => {
      const k = keyFor(tableId, menuId)
      const cur = prev[k] || { seconds: 0, running: false }
      return { ...prev, [k]: { ...cur, running: !cur.running } }
    })
  const resetPrep = (tableId, menuId) =>
    setPrepTimers((prev) => {
      const k = keyFor(tableId, menuId)
      const cur = prev[k] || { seconds: 0, running: false }
      return { ...prev, [k]: { ...cur, seconds: 0, running: false } }
    })

  const filteredTables = state.tables.filter((t) => (statusFilter === "All" ? true : t.status === statusFilter))

  return (
    <View style={styles.container}>
      {/* Header Section */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🍽️ Floor Plan</Text>
        <Text style={styles.headerSubtitle}>{filteredTables.length} of {state.tables.length} tables</Text>
      </View>

      {/* Quick Actions */}
      <View style={styles.quickActionsSection}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.quickRow}>
          <Pressable onPress={allocateWalkIn} style={[styles.actionBtn, styles.walkInBtn]}>
            <Text style={styles.actionBtnIcon}>🚶‍♂️</Text>
            <Text style={styles.actionBtnText}>Walk-in</Text>
          </Pressable>
          <Pressable onPress={() => setShowReservation(true)} style={[styles.actionBtn, styles.reservationBtn]}>
            <Text style={styles.actionBtnIcon}>📅</Text>
            <Text style={styles.actionBtnText}>Reservation</Text>
          </Pressable>
        </View>
      </View>

      {/* Status Filter */}
      <View style={styles.filterSection}>
        <Text style={styles.sectionTitle}>Filter by Status</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.statusFilterScroll}>
          <View style={styles.statusRow}>
            <StatusChip
              label="All Tables"
              active={statusFilter === "All"}
              count={state.tables.length}
              onPress={() => setStatusFilter("All")}
              color={COLORS.gray}
            />
            {Object.entries(statusConfig).map(([status, config]) => (
              <StatusChip
                key={status}
                label={config.label}
                active={statusFilter === status}
                count={statusCounts[status]}
                onPress={() => setStatusFilter(status)}
                color={config.color}
              />
            ))}
          </View>
        </ScrollView>
      </View>

      {/* Table Grid */}
      <View style={styles.tableSection}>
        <Text style={styles.sectionTitle}>
          Tables {statusFilter !== "All" && `(${statusConfig[statusFilter]?.label})`}
        </Text>
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.tableGrid}>
            {filteredTables.map((table) => {
              const config = statusConfig[table.status]
              const waiter = state.staff.find((s) => s.id === table.waiterId)
              const orderTotal = table.order ? table.order.items.reduce((sum, it) => sum + it.price * it.qty, 0) : 0

              return (
                <Pressable
                  key={table.id}
                  onPress={() => {
                    toggleTableStatus(table.id)
                    setDetailsFor(table.id)
                  }}
                  onLongPress={() => quickActions(table.id)}
                  style={[
                    styles.tableCard,
                    { borderColor: config?.color || COLORS.gray },
                    detailsFor === table.id && styles.tableCardSelected
                  ]}
                >
                  <View style={styles.tableHeader}>
                    <Text style={styles.tableNumber}>#{table.id}</Text>
                    <Text style={styles.tableIcon}>{config?.icon || "⚪"}</Text>
                  </View>

                  <Text style={[styles.tableStatus, { color: config?.color }]}>
                    {config?.label || table.status}
                  </Text>

                  {waiter && (
                    <Text style={styles.waiterBadge}>👨‍💼 {waiter.name.split(" ")[0]}</Text>
                  )}

                  {orderTotal > 0 && (
                    <Text style={styles.orderTotal}>💰 ${orderTotal}</Text>
                  )}

                  {table.timer.running && (
                    <View style={styles.timerContainer}>
                      <TimerBadge seconds={table.timer.elapsedSec} />
                    </View>
                  )}

                  {table.customerData && (
                    <Text style={styles.customerName}>
                      👤 {table.customerData.customerName.split(" ")[0]}
                    </Text>
                  )}
                </Pressable>
              )
            })}
          </View>
        </ScrollView>
      </View>

      {/* Table Details Drawer */}
      {detailsFor != null && (
        <View style={styles.drawer}>
          {(() => {
            const t = state.tables.find((x) => x.id === detailsFor)
            const waiter = t?.waiterId ? state.staff.find((s) => s.id === t.waiterId) : null
            const hasOrder = !!t?.order
            const total = hasOrder ? t.order.items.reduce((sum, it) => sum + it.price * it.qty, 0) : 0
            const config = statusConfig[t?.status]

            return (
              <>
                <View style={styles.drawerHeader}>
                  <View style={styles.drawerTitleRow}>
                    <Text style={styles.drawerTitle}>🍽️ Table {detailsFor}</Text>
                    <View style={[styles.statusBadge, { backgroundColor: config?.color + "22", borderColor: config?.color }]}>
                      <Text style={[styles.statusBadgeText, { color: config?.color }]}>{config?.label}</Text>
                    </View>
                  </View>
                  <Pressable onPress={() => setDetailsFor(null)} style={styles.drawerCloseBtn}>
                    <Text style={styles.drawerCloseBtnText}>✕</Text>
                  </Pressable>
                </View>

                <Text style={styles.drawerInfo}>
                  👨‍💼 Waiter: {waiter?.name || "Unassigned"} • ⏱️ {t?.timer.running ? "Active" : "Inactive"}
                </Text>

                <View style={styles.drawerActions}>
                  <Pressable onPress={() => assignWaiter(detailsFor)} style={styles.drawerActionBtn}>
                    <Text style={styles.drawerActionText}>👨‍💼 Assign</Text>
                  </Pressable>
                  <Pressable
                    onPress={() =>
                      dispatch({
                        type: t?.timer.running ? "STOP_TIMER" : "START_ORDER",
                        tableId: detailsFor,
                        notes: "Quick start",
                      })
                    }
                    style={styles.drawerActionBtn}
                  >
                    <Text style={styles.drawerActionText}>
                      {t?.timer.running ? "⏸️ Pause" : "▶️ Start"}
                    </Text>
                  </Pressable>
                  <Pressable
                    onPress={() => dispatch({ type: "RESET_TIMER", tableId: detailsFor })}
                    style={styles.drawerActionBtn}
                  >
                    <Text style={styles.drawerActionText}>🔄 Reset</Text>
                  </Pressable>
                </View>

                {hasOrder ? (
                  <View style={styles.orderSection}>
                    <Text style={styles.orderTitle}>📋 Current Order</Text>
                    <View style={styles.itemsList}>
                      {state.menu.map((m) => {
                        const it = t.order.items.find((i) => i.menuId === m.id)
                        const qty = it?.qty || 0
                        const prep = getPrep(detailsFor, m.id)
                        const mm = String(Math.floor(prep.seconds / 60)).padStart(2, "0")
                        const ss = String(prep.seconds % 60).padStart(2, "0")

                        return (
                          <View key={m.id} style={styles.menuItem}>
                            <View style={styles.menuItemInfo}>
                              <Text style={styles.menuName}>{m.name}</Text>
                              <Text style={styles.menuPrice}>${m.price}</Text>
                            </View>

                            <View style={styles.menuItemControls}>
                              <Pressable
                                onPress={() => togglePrep(detailsFor, m.id)}
                                onLongPress={() => resetPrep(detailsFor, m.id)}
                                style={[styles.prepBtn, { backgroundColor: prep.running ? COLORS.red : COLORS.green }]}
                              >
                                <Text style={styles.prepBtnText}>{prep.running ? "⏸️" : "▶️"}</Text>
                              </Pressable>
                              <Text style={styles.prepTime}>{mm}:{ss}</Text>
                            </View>

                            <View style={styles.qtyControls}>
                              <Pressable
                                onPress={() =>
                                  dispatch({
                                    type: "UPDATE_ORDER_ITEM",
                                    tableId: detailsFor,
                                    menuId: m.id,
                                    delta: -1,
                                  })
                                }
                                style={styles.qtyBtn}
                              >
                                <Text style={styles.qtyBtnText}>−</Text>
                              </Pressable>
                              <Text style={styles.qtyText}>{qty}</Text>
                              <Pressable
                                onPress={() =>
                                  dispatch({
                                    type: "UPDATE_ORDER_ITEM",
                                    tableId: detailsFor,
                                    menuId: m.id,
                                    delta: 1,
                                  })
                                }
                                style={styles.qtyBtn}
                              >
                                <Text style={styles.qtyBtnText}>+</Text>
                              </Pressable>
                            </View>
                          </View>
                        )
                      })}
                    </View>

                    <View style={styles.orderFooter}>
                      <Text style={styles.totalText}>💰 Total: ${total}</Text>
                      <Pressable
                        onPress={() => {
                          const nextStatus = t.order.status === "placed" ? "in_progress" : "served"
                          dispatch({ type: "SET_ORDER_STATUS", tableId: detailsFor, status: nextStatus })
                        }}
                        style={styles.orderActionBtn}
                      >
                        <Text style={styles.orderActionText}>
                          {t.order.status === "placed" ? "👨‍🍳 Start Cooking" : "✅ Mark Served"}
                        </Text>
                      </Pressable>
                    </View>
                  </View>
                ) : (
                  <View style={styles.noOrderSection}>
                    <Text style={styles.noOrderText}>📝 No items ordered yet</Text>
                    <Text style={styles.noOrderHint}>Change status to "Ordering" to start taking orders</Text>
                  </View>
                )}
              </>
            )
          })()}
        </View>
      )}

      <ReservationModal
        visible={showReservation}
        onClose={() => setShowReservation(false)}
        onConfirm={handleReservation}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    padding: 16,
  },
  header: {
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: COLORS.fg,
  },
  headerSubtitle: {
    fontSize: 14,
    color: COLORS.gray,
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.fg,
    marginBottom: 12,
  },
  quickActionsSection: {
    marginBottom: 20,
  },
  quickRow: {
    flexDirection: "row",
    gap: 12,
  },
  actionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    gap: 8,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  walkInBtn: {
    backgroundColor: COLORS.primary,
  },
  reservationBtn: {
    backgroundColor: COLORS.green,
  },
  actionBtnIcon: {
    fontSize: 18,
  },
  actionBtnText: {
    color: COLORS.white,
    fontWeight: "600",
    fontSize: 16,
  },
  filterSection: {
    marginBottom: 20,
  },
  statusFilterScroll: {
    marginBottom: 8,
  },
  statusRow: {
    flexDirection: "row",
    gap: 12,
    paddingRight: 16,
  },
  statusChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: "#e5e7eb",
    backgroundColor: COLORS.white,
    gap: 8,
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  statusChipActive: {
    backgroundColor: COLORS.white,
    borderWidth: 2,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusChipText: {
    color: COLORS.gray,
    fontWeight: "600",
    fontSize: 13,
  },
  statusChipTextActive: {
    color: COLORS.fg,
  },
  countBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
  },
  countBadgeText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: "700",
  },
  tableSection: {
    flex: 1,
  },
  tableGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
    paddingBottom: 100,
  },
  tableCard: {
    width: 100,
    height: 120,
    borderRadius: 16,
    borderWidth: 2,
    backgroundColor: COLORS.white,
    padding: 12,
    alignItems: "center",
    justifyContent: "space-between",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  tableCardSelected: {
    borderWidth: 3,
    borderColor: COLORS.primary,
  },
  tableHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
  },
  tableNumber: {
    fontSize: 18,
    fontWeight: "800",
    color: COLORS.black,
  },
  tableIcon: {
    fontSize: 16,
  },
  tableStatus: {
    fontSize: 11,
    fontWeight: "600",
    textAlign: "center",
  },
  waiterBadge: {
    fontSize: 9,
    color: COLORS.gray,
    backgroundColor: COLORS.gray + "22",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  orderTotal: {
    fontSize: 10,
    color: COLORS.green,
    fontWeight: "700",
    backgroundColor: COLORS.green + "22",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  customerName: {
    fontSize: 9,
    color: COLORS.primary,
    fontWeight: "600",
    backgroundColor: COLORS.primary + "22",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    textAlign: "center",
  },
  timerContainer: {
    position: "absolute",
    top: -8,
    right: -8,
  },
  drawer: {
    position: "absolute",
    bottom: 0,
    left: 16,
    right: 16,
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: "60%",
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  drawerHeader: {
    marginBottom: 16,
  },
  drawerTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  drawerTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: COLORS.fg,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: "600",
  },
  drawerCloseBtn: {
    position: "absolute",
    top: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.gray + "22",
    alignItems: "center",
    justifyContent: "center",
  },
  drawerCloseBtnText: {
    color: COLORS.gray,
    fontWeight: "600",
    fontSize: 16,
  },
  drawerInfo: {
    fontSize: 14,
    color: COLORS.gray,
    marginBottom: 16,
  },
  drawerActions: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 20,
  },
  drawerActionBtn: {
    flex: 1,
    backgroundColor: COLORS.gray + "11",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
  },
  drawerActionText: {
    color: COLORS.fg,
    fontWeight: "600",
    fontSize: 13,
  },
  orderSection: {
    flex: 1,
  },
  orderTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.fg,
    marginBottom: 12,
  },
  itemsList: {
    gap: 12,
    marginBottom: 16,
    maxHeight: 200,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.gray + "11",
    padding: 12,
    borderRadius: 12,
    gap: 12,
  },
  menuItemInfo: {
    flex: 1,
  },
  menuName: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.black,
  },
  menuPrice: {
    fontSize: 12,
    color: COLORS.gray,
    marginTop: 2,
  },
  menuItemControls: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  prepBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  prepBtnText: {
    fontSize: 12,
  },
  prepTime: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.gray,
    minWidth: 45,
    textAlign: "center",
    fontFamily: "monospace",
  },
  qtyControls: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  qtyBtn: {
    width: 32,
    height: 32,
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  qtyBtnText: {
    color: COLORS.white,
    fontWeight: "600",
    fontSize: 16,
  },
  qtyText: {
    fontSize: 16,
    fontWeight: "700",
    minWidth: 24,
    textAlign: "center",
    color: COLORS.fg,
  },
  orderFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  totalText: {
    fontSize: 18,
    fontWeight: "800",
    color: COLORS.green,
  },
  orderActionBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
  },
  orderActionText: {
    color: COLORS.white,
    fontWeight: "600",
    fontSize: 14,
  },
  noOrderSection: {
    alignItems: "center",
    padding: 20,
  },
  noOrderText: {
    fontSize: 16,
    color: COLORS.gray,
    marginBottom: 8,
  },
  noOrderHint: {
    fontSize: 14,
    color: COLORS.gray,
    textAlign: "center",
    fontStyle: "italic",
  },
  modalContainer: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.gray + "11",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: COLORS.black,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.gray + "22",
    alignItems: "center",
    justifyContent: "center",
  },
  closeBtnText: {
    color: COLORS.gray,
    fontWeight: "600",
    fontSize: 16,
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.black,
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 2,
    borderColor: COLORS.border,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    backgroundColor: COLORS.white,
  },
  textInputRequired: {
    borderColor: COLORS.red + "66",
  },
  multilineInput: {
    height: 100,
    textAlignVertical: "top",
  },
  partySizeRow: {
    flexDirection: "row",
    gap: 12,
    flexWrap: "wrap",
  },
  sizeBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: COLORS.border,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.white,
  },
  sizeBtnActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  sizeBtnText: {
    color: COLORS.gray,
    fontWeight: "700",
    fontSize: 16,
  },
  sizeBtnTextActive: {
    color: COLORS.white,
  },
  modalActions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 20,
  },
  cancelBtn: {
    flex: 1,
    backgroundColor: COLORS.gray + "22",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  cancelBtnText: {
    color: COLORS.gray,
    fontWeight: "600",
    fontSize: 16,
  },
  confirmBtn: {
    flex: 2,
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  confirmBtnText: {
    color: COLORS.white,
    fontWeight: "700",
    fontSize: 16,
  },
  numberInput: {
    textAlign: "center",
    fontSize: 18,
    fontWeight: "600",
  },
  inputHint: {
    fontSize: 14,
    color: COLORS.gray,
    marginTop: 8,
    textAlign: "center",
    fontStyle: "italic",
  },
})
