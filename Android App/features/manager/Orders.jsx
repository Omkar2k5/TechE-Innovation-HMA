"use client"

import { useState } from "react"
import { View, Text, StyleSheet, Pressable, Alert } from "react-native"
import { useApp, COLORS } from "../../store/app-store"

export default function Orders() {
  const { state, dispatch } = useApp()
  const [prepTimers, setPrepTimers] = useState({})

  const getStatusColor = (status) => {
    switch (status) {
      case "placed":
        return COLORS.primary + "33"
      case "in_progress":
        return "#f59e0b33"
      case "served":
        return COLORS.green + "33"
      default:
        return COLORS.gray + "33"
    }
  }

  const assignWaiter = (tableId) => {
    const availableWaiters = state.staff.filter((s) => s.role.includes("Waiter") && s.active)
    if (availableWaiters.length === 0) {
      Alert.alert("No Available Waiters", "All waiters are inactive or unavailable.")
      return
    }

    Alert.alert(
      "Assign Waiter",
      "Select a waiter for this table:",
      availableWaiters
        .map((w) => ({
          text: w.name,
          onPress: () => dispatch({ type: "ASSIGN_WAITER", tableId, waiterId: w.id }),
        }))
        .concat([{ text: "Cancel", style: "cancel" }]),
    )
  }

  const keyFor = (tableId, menuId) => `${tableId}:${menuId}`
  const getPrep = (tableId, menuId) => prepTimers[keyFor(tableId, menuId)] || { seconds: 0, running: false }

  return (
    <View>
      <View style={styles.ordersHeader}>
        <Text style={styles.sectionTitle}>Active Orders</Text>
        <Pressable
          onPress={() => Alert.alert("Kitchen Status", "All orders synced with kitchen display system")}
          style={styles.syncBtn}
        >
          <Text style={styles.syncBtnText}>🔄 Sync Kitchen</Text>
        </Pressable>
      </View>

      {state.tables
        .filter((t) => t.order)
        .map((table) => {
          const waiter = state.staff.find((s) => s.id === table.waiterId)
          const total = table.order.items.reduce((sum, item) => sum + item.price * item.qty, 0)
          const estimatedCompletion = table.order.estimatedMinutes || 25

          return (
            <View key={table.id} style={styles.orderCard}>
              <View style={styles.orderHeader}>
                <View>
                  <Text style={styles.cardTitle}>Table {table.id}</Text>
                  <Text style={styles.caption}>Waiter: {waiter?.name || "Unassigned"}</Text>
                  {table.customerData && (
                    <Text style={styles.caption}>Customer: {table.customerData.customerName}</Text>
                  )}
                </View>
                <View>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(table.order.status) }]}>
                    <Text style={styles.statusText}>{table.order.status}</Text>
                  </View>
                  <Text style={styles.estimateText}>~{estimatedCompletion}min</Text>
                </View>
              </View>

              <View style={styles.itemsList}>
                {state.menu.map((menuItem) => {
                  const orderItem = table.order.items.find((i) => i.menuId === menuItem.id)
                  const qty = orderItem?.qty || 0
                  const prep = getPrep(table.id, menuItem.id)
                  const mm = String(Math.floor(prep.seconds / 60)).padStart(2, "0")
                  const ss = String(prep.seconds % 60).padStart(2, "0")

                  return (
                    <View key={menuItem.id} style={styles.menuItem}>
                      <Text style={styles.menuName}>
                        {menuItem.name} - ${menuItem.price}
                      </Text>
                      <View style={styles.qtyControls}>
                        <Pressable
                          onPress={() =>
                            dispatch({ type: "UPDATE_ORDER_ITEM", tableId: table.id, menuId: menuItem.id, delta: -1 })
                          }
                          style={styles.qtyBtn}
                        >
                          <Text style={styles.qtyBtnText}>-</Text>
                        </Pressable>
                        <Text style={styles.qtyText}>{qty}</Text>
                        <Pressable
                          onPress={() =>
                            dispatch({ type: "UPDATE_ORDER_ITEM", tableId: table.id, menuId: menuItem.id, delta: 1 })
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

              <View style={styles.orderActions}>
                <Text style={styles.totalText}>Total: ${total}</Text>
                <View style={{ flexDirection: "row", gap: 8 }}>
                  <Pressable
                    onPress={() => assignWaiter(table.id)}
                    style={[styles.actionBtn, { backgroundColor: COLORS.gray }]}
                  >
                    <Text style={styles.actionBtnText}>Assign Waiter</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => {
                      const nextStatus = table.order.status === "placed" ? "in_progress" : "served"
                      dispatch({ type: "SET_ORDER_STATUS", tableId: table.id, status: nextStatus })
                    }}
                    style={styles.actionBtn}
                  >
                    <Text style={styles.actionBtnText}>
                      {table.order.status === "placed" ? "Start Cooking" : "Mark Served"}
                    </Text>
                  </Pressable>
                  <Pressable
                    onPress={() => dispatch({ type: "TOGGLE_TABLE_STATUS", id: table.id, next: "bill_pending" })}
                    style={[styles.actionBtn, { backgroundColor: COLORS.red }]}
                  >
                    <Text style={styles.actionBtnText}>Bill</Text>
                  </Pressable>
                </View>
              </View>
            </View>
          )
        })}
    </View>
  )
}

const styles = StyleSheet.create({
  ordersHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: { fontSize: 16, fontWeight: "600", marginBottom: 8 },
  syncBtn: {
    backgroundColor: COLORS.green + "22",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  syncBtnText: { color: COLORS.green, fontWeight: "600", fontSize: 12 },
  orderCard: {
    marginBottom: 16,
    padding: 12,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  orderHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  cardTitle: { fontSize: 16, fontWeight: "600", color: COLORS.black },
  caption: { fontSize: 12, color: COLORS.gray },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  statusText: { fontSize: 12, fontWeight: "600", color: COLORS.white },
  estimateText: { fontSize: 10, color: COLORS.gray, textAlign: "center", marginTop: 4 },
  itemsList: { gap: 8, marginBottom: 12 },
  menuItem: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  menuName: { flex: 1, fontSize: 14, color: COLORS.black },
  qtyControls: { flexDirection: "row", alignItems: "center", gap: 12 },
  qtyBtn: {
    width: 32,
    height: 32,
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  qtyBtnText: { color: COLORS.white, fontWeight: "600" },
  qtyText: { fontSize: 16, fontWeight: "600", minWidth: 20, textAlign: "center" },
  orderActions: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  totalText: { fontSize: 16, fontWeight: "700", color: COLORS.black },
  actionBtn: { backgroundColor: COLORS.primary, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  actionBtnText: { color: COLORS.white, fontWeight: "600" },
})
