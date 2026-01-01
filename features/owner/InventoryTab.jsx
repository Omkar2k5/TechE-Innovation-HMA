import { View, Text, StyleSheet, Pressable, Alert } from "react-native"
import { COLORS } from "../../store/app-store"

function InventoryItem({ name, inStock, min, unit, consumption, cost, onInc, onDec, onOrder }) {
  const pct = Math.max(0, Math.min(100, (inStock / Math.max(min, 1)) * 100))
  const lowStock = inStock < min

  return (
    <View style={styles.inventoryCard}>
      <Text style={styles.cardTitle}>{name}</Text>
      <View style={styles.inventoryInfo}>
        <Text style={styles.stockText}>{inStock} {unit} available</Text>
        <Text style={styles.consumptionText}>Used: {consumption} {unit}</Text>
      </View>
      <View style={styles.inventoryDetails}>
        <Text style={styles.detailText}>Cost: ${cost}/{unit}</Text>
        <Text style={styles.detailText}>Min: {min} {unit}</Text>
      </View>

      <View style={styles.progressContainer}>
        <View style={styles.progressTrack}>
          <View
            style={[
              styles.progressBar,
              {
                width: `${pct}%`,
                backgroundColor: lowStock ? COLORS.red : COLORS.green,
              },
            ]}
          />
        </View>
        <Text style={styles.progressText}>{pct.toFixed(0)}%</Text>
      </View>

      {lowStock && (
        <Text style={styles.alertText}>⚠️ Low stock - Reorder needed!</Text>
      )}

      <View style={styles.inventoryActions}>
        <Pressable onPress={onDec} style={styles.adjustButton}>
          <Text style={styles.adjustButtonText}>−</Text>
        </Pressable>
        <Pressable onPress={onInc} style={[styles.adjustButton, styles.primaryButton]}>
          <Text style={styles.primaryButtonText}>+</Text>
        </Pressable>
        {lowStock && (
          <Pressable onPress={onOrder} style={[styles.adjustButton, styles.orderButton]}>
            <Text style={styles.primaryButtonText}>Order</Text>
          </Pressable>
        )}
      </View>
    </View>
  )
}

export default function InventoryTab({ state, dispatch }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Inventory & Procurement</Text>
      <View style={styles.inventoryGrid}>
        {state.inventory.map((item) => (
          <InventoryItem
            key={item.id}
            name={item.name}
            inStock={item.stock}
            min={item.min}
            unit={item.unit}
            consumption={item.consumption}
            cost={item.costPerUnit}
            onInc={() => dispatch({ type: "ADJUST_INVENTORY", id: item.id, delta: 1 })}
            onDec={() => dispatch({ type: "ADJUST_INVENTORY", id: item.id, delta: -1 })}
            onOrder={() => {
              const supplier = state.suppliers.find((s) => s.items.includes(item.id))
              if (supplier) {
                dispatch({
                  type: "CREATE_PO",
                  supplierId: supplier.id,
                  items: [{ inventoryId: item.id, qty: item.min - item.stock }],
                })
                Alert.alert("Purchase Order", `Created PO for ${item.name} from ${supplier.name}`)
              } else {
                Alert.alert("No Supplier", `No supplier found for ${item.name}`)
              }
            }}
          />
        ))}
      </View>

      {state.purchaseOrders.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Recent Purchase Orders</Text>
          {state.purchaseOrders.slice(-3).map((po) => {
            const supplier = state.suppliers.find((s) => s.id === po.supplierId)
            return (
              <View key={po.id} style={styles.poItem}>
                <Text style={styles.poId}>{po.id}</Text>
                <Text style={styles.poSupplier}>{supplier?.name || 'Unknown'}</Text>
                <Text style={[
                  styles.poStatus,
                  { color: po.status === "ordered" ? COLORS.primary : COLORS.green }
                ]}>
                  {po.status}
                </Text>
              </View>
            )
          })}
        </View>
      )}
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
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.fg,
    marginBottom: 12,
  },
  inventoryGrid: {
    gap: 12,
  },
  inventoryCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  inventoryInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
    marginBottom: 4,
  },
  stockText: {
    fontSize: 14,
    color: COLORS.fg,
    fontWeight: "600",
  },
  consumptionText: {
    fontSize: 14,
    color: COLORS.muted,
  },
  inventoryDetails: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  detailText: {
    fontSize: 12,
    color: COLORS.muted,
  },
  progressContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  progressTrack: {
    flex: 1,
    height: 8,
    backgroundColor: "#f1f5f9",
    borderRadius: 4,
    overflow: "hidden",
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.green,
  },
  progressText: {
    fontSize: 12,
    color: COLORS.muted,
    fontWeight: "600",
    minWidth: 35,
  },
  alertText: {
    color: COLORS.red,
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 12,
  },
  inventoryActions: {
    flexDirection: "row",
    gap: 8,
  },
  adjustButton: {
    flex: 1,
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  adjustButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.fg,
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  primaryButtonText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: "600",
  },
  orderButton: {
    backgroundColor: COLORS.red,
    borderColor: COLORS.red,
  },
  poItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  poId: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.fg,
    flex: 1,
  },
  poSupplier: {
    fontSize: 14,
    color: COLORS.muted,
    flex: 1,
    textAlign: "center",
  },
  poStatus: {
    fontSize: 12,
    fontWeight: "600",
    flex: 1,
    textAlign: "right",
  },
})