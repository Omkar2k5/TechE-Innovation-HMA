"use client"

import { useState, useEffect } from "react"
import { 
  View, Text, StyleSheet, ScrollView, Pressable, Alert, 
  TextInput, Modal, RefreshControl, ActivityIndicator 
} from "react-native"
import api from "../../services/api"

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

const InventoryCard = ({ item, onPress }) => {
  const stockPercentage = (item.currentStock / item.maxStock) * 100
  const stockColor = stockPercentage < 20 ? COLORS.red : stockPercentage < 50 ? COLORS.yellow : COLORS.green

  return (
    <Pressable onPress={() => onPress(item)} style={styles.inventoryCard}>
      <View style={styles.inventoryHeader}>
        <Text style={styles.inventoryName}>{item.name}</Text>
        <View style={[styles.stockBadge, { backgroundColor: stockColor + "20", borderColor: stockColor }]}>
          <Text style={[styles.stockBadgeText, { color: stockColor }]}>
            {stockPercentage.toFixed(0)}%
          </Text>
        </View>
      </View>

      <Text style={styles.inventoryCategory}>{item.category}</Text>
      
      <View style={styles.inventoryDetails}>
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>Current Stock</Text>
          <Text style={styles.detailValue}>{item.currentStock} {item.unit}</Text>
        </View>
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>Min Stock</Text>
          <Text style={styles.detailValue}>{item.minStock} {item.unit}</Text>
        </View>
      </View>

      <View style={styles.inventoryFooter}>
        <Text style={styles.costText}>₹{item.costPerUnit}/{item.unit}</Text>
        {item.currentStock < item.minStock && (
          <Text style={styles.lowStockWarning}>⚠️ Low Stock</Text>
        )}
      </View>
    </Pressable>
  )
}

const AddInventoryModal = ({ visible, onClose, onSubmit, editItem }) => {
  const [formData, setFormData] = useState({
    name: "",
    category: "Raw Material",
    unit: "kg",
    currentStock: "",
    minStock: "",
    maxStock: "",
    costPerUnit: "",
  })

  useEffect(() => {
    if (editItem) {
      setFormData({
        name: editItem.name || "",
        category: editItem.category || "Raw Material",
        unit: editItem.unit || "kg",
        currentStock: editItem.currentStock?.toString() || "",
        minStock: editItem.minStock?.toString() || "",
        maxStock: editItem.maxStock?.toString() || "",
        costPerUnit: editItem.costPerUnit?.toString() || "",
      })
    } else {
      setFormData({
        name: "",
        category: "Raw Material",
        unit: "kg",
        currentStock: "",
        minStock: "",
        maxStock: "",
        costPerUnit: "",
      })
    }
  }, [editItem, visible])

  const handleSubmit = () => {
    if (!formData.name.trim()) {
      Alert.alert("Required", "Please enter item name")
      return
    }

    const data = {
      ...formData,
      currentStock: parseFloat(formData.currentStock) || 0,
      minStock: parseFloat(formData.minStock) || 0,
      maxStock: parseFloat(formData.maxStock) || 0,
      costPerUnit: parseFloat(formData.costPerUnit) || 0,
    }

    onSubmit(data)
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>{editItem ? "Edit" : "Add"} Inventory Item</Text>
          <Pressable onPress={onClose} style={styles.closeBtn}>
            <Text style={styles.closeBtnText}>✕</Text>
          </Pressable>
        </View>

        <ScrollView style={styles.modalContent}>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Item Name *</Text>
            <TextInput
              style={styles.input}
              value={formData.name}
              onChangeText={(text) => setFormData(prev => ({ ...prev, name: text }))}
              placeholder="e.g., Tomatoes, Rice, Oil"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Category</Text>
            <View style={styles.categoryButtons}>
              {["Raw Material", "Packaged", "Beverage", "Other"].map(cat => (
                <Pressable
                  key={cat}
                  onPress={() => setFormData(prev => ({ ...prev, category: cat }))}
                  style={[
                    styles.categoryBtn,
                    formData.category === cat && styles.categoryBtnActive,
                  ]}
                >
                  <Text style={[
                    styles.categoryBtnText,
                    formData.category === cat && styles.categoryBtnTextActive,
                  ]}>
                    {cat}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Unit</Text>
            <View style={styles.categoryButtons}>
              {["kg", "ltr", "pcs", "box"].map(u => (
                <Pressable
                  key={u}
                  onPress={() => setFormData(prev => ({ ...prev, unit: u }))}
                  style={[
                    styles.unitBtn,
                    formData.unit === u && styles.unitBtnActive,
                  ]}
                >
                  <Text style={[
                    styles.unitBtnText,
                    formData.unit === u && styles.unitBtnTextActive,
                  ]}>
                    {u}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          <View style={styles.inputRow}>
            <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
              <Text style={styles.inputLabel}>Current Stock</Text>
              <TextInput
                style={styles.input}
                value={formData.currentStock}
                onChangeText={(text) => setFormData(prev => ({ ...prev, currentStock: text }))}
                placeholder="0"
                keyboardType="numeric"
              />
            </View>
            <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
              <Text style={styles.inputLabel}>Min Stock</Text>
              <TextInput
                style={styles.input}
                value={formData.minStock}
                onChangeText={(text) => setFormData(prev => ({ ...prev, minStock: text }))}
                placeholder="0"
                keyboardType="numeric"
              />
            </View>
          </View>

          <View style={styles.inputRow}>
            <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
              <Text style={styles.inputLabel}>Max Stock</Text>
              <TextInput
                style={styles.input}
                value={formData.maxStock}
                onChangeText={(text) => setFormData(prev => ({ ...prev, maxStock: text }))}
                placeholder="0"
                keyboardType="numeric"
              />
            </View>
            <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
              <Text style={styles.inputLabel}>Cost per Unit (₹)</Text>
              <TextInput
                style={styles.input}
                value={formData.costPerUnit}
                onChangeText={(text) => setFormData(prev => ({ ...prev, costPerUnit: text }))}
                placeholder="0"
                keyboardType="numeric"
              />
            </View>
          </View>

          <View style={styles.modalActions}>
            <Pressable onPress={onClose} style={styles.cancelBtn}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </Pressable>
            <Pressable onPress={handleSubmit} style={styles.submitBtn}>
              <Text style={styles.submitBtnText}>{editItem ? "Update" : "Add"} Item</Text>
            </Pressable>
          </View>
        </ScrollView>
      </View>
    </Modal>
  )
}

export default function InventoryEnhanced() {
  const [inventory, setInventory] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [editItem, setEditItem] = useState(null)
  const [filterCategory, setFilterCategory] = useState("ALL")

  useEffect(() => {
    loadInventory()
  }, [])

  const loadInventory = async () => {
    try {
      setLoading(true)
      // Note: You'll need to implement inventory API endpoints in your backend
      // For now, using mock data
      const mockData = [
        {
          id: "1",
          name: "Tomatoes",
          category: "Raw Material",
          unit: "kg",
          currentStock: 15,
          minStock: 10,
          maxStock: 50,
          costPerUnit: 40,
        },
        {
          id: "2",
          name: "Rice",
          category: "Raw Material",
          unit: "kg",
          currentStock: 80,
          minStock: 50,
          maxStock: 200,
          costPerUnit: 60,
        },
        {
          id: "3",
          name: "Cooking Oil",
          category: "Raw Material",
          unit: "ltr",
          currentStock: 8,
          minStock: 15,
          maxStock: 50,
          costPerUnit: 150,
        },
        {
          id: "4",
          name: "Coca Cola",
          category: "Beverage",
          unit: "pcs",
          currentStock: 120,
          minStock: 50,
          maxStock: 200,
          costPerUnit: 20,
        },
      ]
      setInventory(mockData)
    } catch (error) {
      console.error("Error loading inventory:", error)
      Alert.alert("Error", "Failed to load inventory")
    } finally {
      setLoading(false)
    }
  }

  const onRefresh = async () => {
    setRefreshing(true)
    await loadInventory()
    setRefreshing(false)
  }

  const handleAddItem = (data) => {
    const newItem = {
      id: Date.now().toString(),
      ...data,
    }
    setInventory(prev => [...prev, newItem])
    setShowAddModal(false)
    Alert.alert("Success", "Inventory item added")
  }

  const handleEditItem = (data) => {
    setInventory(prev => prev.map(item => 
      item.id === editItem.id ? { ...item, ...data } : item
    ))
    setEditItem(null)
    setShowAddModal(false)
    Alert.alert("Success", "Inventory item updated")
  }

  const handleItemPress = (item) => {
    Alert.alert(
      item.name,
      "Choose an action",
      [
        { text: "Edit", onPress: () => { setEditItem(item); setShowAddModal(true) } },
        { text: "Add Stock", onPress: () => addStock(item) },
        { text: "Remove Stock", onPress: () => removeStock(item) },
        { text: "View Details", onPress: () => viewDetails(item) },
        { text: "Cancel", style: "cancel" },
      ]
    )
  }

  const addStock = (item) => {
    Alert.prompt(
      "Add Stock",
      `Enter quantity to add (${item.unit})`,
      (text) => {
        const qty = parseFloat(text)
        if (isNaN(qty) || qty <= 0) {
          Alert.alert("Invalid", "Please enter a valid quantity")
          return
        }
        setInventory(prev => prev.map(i => 
          i.id === item.id ? { ...i, currentStock: i.currentStock + qty } : i
        ))
        Alert.alert("Success", `Added ${qty} ${item.unit} to ${item.name}`)
      },
      "plain-text"
    )
  }

  const removeStock = (item) => {
    Alert.prompt(
      "Remove Stock",
      `Enter quantity to remove (${item.unit})`,
      (text) => {
        const qty = parseFloat(text)
        if (isNaN(qty) || qty <= 0) {
          Alert.alert("Invalid", "Please enter a valid quantity")
          return
        }
        if (qty > item.currentStock) {
          Alert.alert("Error", "Cannot remove more than current stock")
          return
        }
        setInventory(prev => prev.map(i => 
          i.id === item.id ? { ...i, currentStock: i.currentStock - qty } : i
        ))
        Alert.alert("Success", `Removed ${qty} ${item.unit} from ${item.name}`)
      },
      "plain-text"
    )
  }

  const viewDetails = (item) => {
    const totalValue = item.currentStock * item.costPerUnit
    const stockPercentage = ((item.currentStock / item.maxStock) * 100).toFixed(1)
    
    Alert.alert(
      item.name,
      `Category: ${item.category}\n` +
      `Current Stock: ${item.currentStock} ${item.unit}\n` +
      `Min Stock: ${item.minStock} ${item.unit}\n` +
      `Max Stock: ${item.maxStock} ${item.unit}\n` +
      `Cost per Unit: ₹${item.costPerUnit}\n` +
      `Total Value: ₹${totalValue.toFixed(2)}\n` +
      `Stock Level: ${stockPercentage}%`
    )
  }

  const filteredInventory = filterCategory === "ALL"
    ? inventory
    : inventory.filter(item => item.category === filterCategory)

  const lowStockItems = inventory.filter(item => item.currentStock < item.minStock)
  const totalValue = inventory.reduce((sum, item) => sum + (item.currentStock * item.costPerUnit), 0)

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading inventory...</Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      {/* Header Stats */}
      <View style={styles.statsBar}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{inventory.length}</Text>
          <Text style={styles.statLabel}>Total Items</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: COLORS.red + "20" }]}>
          <Text style={[styles.statValue, { color: COLORS.red }]}>{lowStockItems.length}</Text>
          <Text style={[styles.statLabel, { color: COLORS.red }]}>Low Stock</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: COLORS.green + "20" }]}>
          <Text style={[styles.statValue, { color: COLORS.green }]}>₹{totalValue.toFixed(0)}</Text>
          <Text style={[styles.statLabel, { color: COLORS.green }]}>Total Value</Text>
        </View>
      </View>

      {/* Filter Bar */}
      <View style={styles.filterBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {["ALL", "Raw Material", "Packaged", "Beverage", "Other"].map(cat => (
            <Pressable
              key={cat}
              onPress={() => setFilterCategory(cat)}
              style={[
                styles.filterBtn,
                filterCategory === cat && styles.filterBtnActive,
              ]}
            >
              <Text style={[
                styles.filterBtnText,
                filterCategory === cat && styles.filterBtnTextActive,
              ]}>
                {cat}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
        <Pressable onPress={() => setShowAddModal(true)} style={styles.addBtn}>
          <Text style={styles.addBtnText}>+ Add</Text>
        </Pressable>
      </View>

      {/* Inventory List */}
      <ScrollView
        style={styles.scrollView}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {filteredInventory.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No inventory items</Text>
            <Pressable onPress={() => setShowAddModal(true)} style={styles.emptyAddBtn}>
              <Text style={styles.emptyAddBtnText}>Add First Item</Text>
            </Pressable>
          </View>
        ) : (
          filteredInventory.map(item => (
            <InventoryCard key={item.id} item={item} onPress={handleItemPress} />
          ))
        )}
      </ScrollView>

      {/* Add/Edit Modal */}
      <AddInventoryModal
        visible={showAddModal}
        onClose={() => { setShowAddModal(false); setEditItem(null) }}
        onSubmit={editItem ? handleEditItem : handleAddItem}
        editItem={editItem}
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
  statCard: {
    flex: 1,
    alignItems: "center",
    padding: 12,
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
    fontSize: 11,
    color: COLORS.gray,
    marginTop: 4,
  },
  filterBar: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  filterBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
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
  addBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: COLORS.green,
    borderRadius: 20,
    marginLeft: 8,
  },
  addBtnText: {
    fontSize: 14,
    fontWeight: "700",
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
    marginBottom: 16,
  },
  emptyAddBtn: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: COLORS.primary,
    borderRadius: 8,
  },
  emptyAddBtnText: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.white,
  },
  inventoryCard: {
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
  inventoryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  inventoryName: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.black,
    flex: 1,
  },
  stockBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 2,
  },
  stockBadgeText: {
    fontSize: 14,
    fontWeight: "700",
  },
  inventoryCategory: {
    fontSize: 12,
    color: COLORS.gray,
    marginBottom: 12,
  },
  inventoryDetails: {
    flexDirection: "row",
    marginBottom: 12,
  },
  detailItem: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 11,
    color: COLORS.gray,
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.black,
  },
  inventoryFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  costText: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.primary,
  },
  lowStockWarning: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.red,
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
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.black,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  inputRow: {
    flexDirection: "row",
  },
  categoryButtons: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  categoryBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.lightGray,
  },
  categoryBtnActive: {
    backgroundColor: COLORS.primary,
  },
  categoryBtnText: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.gray,
  },
  categoryBtnTextActive: {
    color: COLORS.white,
  },
  unitBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.lightGray,
  },
  unitBtnActive: {
    backgroundColor: COLORS.primary,
  },
  unitBtnText: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.gray,
  },
  unitBtnTextActive: {
    color: COLORS.white,
  },
  modalActions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 24,
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
})
