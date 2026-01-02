import { useState, useEffect } from "react"
import {
  View, Text, StyleSheet, ScrollView, TextInput, Pressable,
  Alert, ActivityIndicator, RefreshControl, Modal
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

const CATEGORIES = [
  { label: "Other", value: "other" },
  { label: "Vegetables", value: "vegetables" },
  { label: "Spices", value: "spices" },
  { label: "Dairy", value: "dairy" },
  { label: "Meat", value: "meat" },
  { label: "Grains", value: "grains" },
]

const UNITS = [
  { label: "Grams", value: "grams" },
  { label: "Kilograms", value: "kg" },
  { label: "Milliliters", value: "ml" },
  { label: "Liters", value: "liters" },
  { label: "Pieces", value: "pcs" },
  { label: "Cups", value: "cups" },
]

const CategoryPicker = ({ visible, onClose, onSelect, selected }) => (
  <Modal visible={visible} transparent animationType="slide">
    <Pressable style={styles.modalOverlay} onPress={onClose}>
      <View style={styles.pickerModal}>
        <Text style={styles.pickerTitle}>Select Category</Text>
        {CATEGORIES.map(cat => (
          <Pressable
            key={cat.value}
            onPress={() => {
              onSelect(cat.value)
              onClose()
            }}
            style={[styles.pickerItem, selected === cat.value && styles.pickerItemSelected]}
          >
            <Text style={[styles.pickerItemText, selected === cat.value && styles.pickerItemTextSelected]}>
              {cat.label}
            </Text>
          </Pressable>
        ))}
      </View>
    </Pressable>
  </Modal>
)

const UnitPicker = ({ visible, onClose, onSelect, selected }) => (
  <Modal visible={visible} transparent animationType="slide">
    <Pressable style={styles.modalOverlay} onPress={onClose}>
      <View style={styles.pickerModal}>
        <Text style={styles.pickerTitle}>Select Unit</Text>
        {UNITS.map(unit => (
          <Pressable
            key={unit.value}
            onPress={() => {
              onSelect(unit.value)
              onClose()
            }}
            style={[styles.pickerItem, selected === unit.value && styles.pickerItemSelected]}
          >
            <Text style={[styles.pickerItemText, selected === unit.value && styles.pickerItemTextSelected]}>
              {unit.label}
            </Text>
          </Pressable>
        ))}
      </View>
    </Pressable>
  </Modal>
)

export default function InventoryManagement() {
  const [ingredients, setIngredients] = useState([])
  const [form, setForm] = useState({ name: '', unit: 'grams', category: 'other', stock: '0' })
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [showCategoryPicker, setShowCategoryPicker] = useState(false)
  const [showUnitPicker, setShowUnitPicker] = useState(false)

  useEffect(() => {
    fetchIngredients()
  }, [])

  const fetchIngredients = async () => {
    try {
      setLoading(true)
      console.log('📦 Fetching ingredients...')
      const response = await api.menu.getIngredients()
      console.log('✅ Ingredients response:', response)
      
      // Backend returns array directly
      if (Array.isArray(response)) {
        setIngredients(response)
      } else if (response && response.success) {
        setIngredients(response.data.ingredients || [])
      } else {
        console.log('⚠️ No ingredients data')
        setIngredients([])
      }
    } catch (error) {
      console.error('❌ Failed to fetch ingredients:', error)
      Alert.alert('Error', 'Failed to load ingredients. Please check connection.')
    } finally {
      setLoading(false)
    }
  }

  const onRefresh = async () => {
    setRefreshing(true)
    await fetchIngredients()
    setRefreshing(false)
  }

  const addIngredient = async () => {
    if (!form.name.trim()) {
      Alert.alert('Required', 'Ingredient name is required')
      return
    }

    try {
      const response = await api.menu.addIngredient({
        name: form.name,
        unit: form.unit,
        category: form.category,
        stock: parseInt(form.stock) || 0,
        lowStockThreshold: 100
      })

      // Backend returns the created item directly or with a message
      if (response) {
        setForm({ name: '', unit: 'grams', category: 'other', stock: '0' })
        Alert.alert('Success', response.message || 'Ingredient added successfully!')
        fetchIngredients()
      }
    } catch (error) {
      console.error('Failed to add ingredient:', error)
      Alert.alert('Error', error.response?.data?.error || error.message || 'Failed to add ingredient')
    }
  }

  const adjustStock = async (ingredientName, adjustment) => {
    try {
      await api.menu.updateIngredientStock(ingredientName, adjustment)
      fetchIngredients()
    } catch (error) {
      console.error('Failed to update stock:', error)
      Alert.alert('Error', 'Failed to update stock')
    }
  }

  const deleteIngredient = (ingredientName) => {
    Alert.alert(
      'Delete Ingredient',
      `Are you sure you want to delete "${ingredientName}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.menu.deleteIngredient(ingredientName)
              fetchIngredients()
            } catch (error) {
              console.error('Failed to delete ingredient:', error)
              Alert.alert('Error', 'Failed to delete ingredient')
            }
          }
        }
      ]
    )
  }

  const getStockColor = (stock) => {
    if (stock < 50) return COLORS.red
    if (stock < 100) return COLORS.yellow
    return COLORS.green
  }

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
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Inventory Management</Text>
          <Text style={styles.headerSubtitle}>Manage ingredients and stock levels</Text>
        </View>
        <View style={styles.headerStats}>
          <Text style={styles.statsLabel}>Total Ingredients</Text>
          <Text style={styles.statsValue}>{ingredients.length}</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Add New Ingredient Form */}
        <View style={styles.formCard}>
          <Text style={styles.formTitle}>Add New Ingredient</Text>
          
          <TextInput
            style={styles.input}
            placeholder="Ingredient Name"
            value={form.name}
            onChangeText={(text) => setForm({ ...form, name: text })}
          />

          <Pressable
            style={styles.pickerButton}
            onPress={() => setShowUnitPicker(true)}
          >
            <Text style={styles.pickerButtonText}>
              Unit: {UNITS.find(u => u.value === form.unit)?.label}
            </Text>
          </Pressable>

          <Pressable
            style={styles.pickerButton}
            onPress={() => setShowCategoryPicker(true)}
          >
            <Text style={styles.pickerButtonText}>
              Category: {CATEGORIES.find(c => c.value === form.category)?.label}
            </Text>
          </Pressable>

          <TextInput
            style={styles.input}
            placeholder="Initial Stock"
            value={form.stock}
            onChangeText={(text) => setForm({ ...form, stock: text })}
            keyboardType="numeric"
          />

          <Pressable style={styles.addButton} onPress={addIngredient}>
            <Text style={styles.addButtonText}>Add Ingredient</Text>
          </Pressable>
        </View>

        {/* Current Stock */}
        <View style={styles.stockCard}>
          <Text style={styles.stockTitle}>Current Stock</Text>

          {ingredients.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No ingredients added yet</Text>
              <Text style={styles.emptySubtext}>Add your first ingredient above to get started</Text>
            </View>
          ) : (
            ingredients.map((ing, idx) => (
              <View key={idx} style={styles.ingredientCard}>
                <View style={styles.ingredientHeader}>
                  <Text style={styles.ingredientName}>{ing.name}</Text>
                  <View style={styles.categoryBadge}>
                    <Text style={styles.categoryText}>{ing.category}</Text>
                  </View>
                </View>

                <View style={styles.ingredientDetails}>
                  <View style={styles.stockInfo}>
                    <Text style={styles.stockLabel}>Stock:</Text>
                    <Text style={[styles.stockValue, { color: getStockColor(ing.stock || 0) }]}>
                      {ing.stock || 0} {ing.unit}
                    </Text>
                  </View>
                </View>

                <View style={styles.ingredientActions}>
                  <Pressable
                    style={[styles.actionBtn, styles.actionBtnRed]}
                    onPress={() => adjustStock(ing.name, -10)}
                  >
                    <Text style={styles.actionBtnText}>-10</Text>
                  </Pressable>
                  <Pressable
                    style={[styles.actionBtn, styles.actionBtnYellow]}
                    onPress={() => adjustStock(ing.name, -1)}
                  >
                    <Text style={styles.actionBtnText}>-1</Text>
                  </Pressable>
                  <Pressable
                    style={[styles.actionBtn, styles.actionBtnGreen]}
                    onPress={() => adjustStock(ing.name, 1)}
                  >
                    <Text style={styles.actionBtnText}>+1</Text>
                  </Pressable>
                  <Pressable
                    style={[styles.actionBtn, styles.actionBtnGreen]}
                    onPress={() => adjustStock(ing.name, 10)}
                  >
                    <Text style={styles.actionBtnText}>+10</Text>
                  </Pressable>
                  <Pressable
                    style={[styles.actionBtn, styles.deleteBtn]}
                    onPress={() => deleteIngredient(ing.name)}
                  >
                    <Text style={styles.deleteBtnText}>Delete</Text>
                  </Pressable>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {/* Pickers */}
      <CategoryPicker
        visible={showCategoryPicker}
        onClose={() => setShowCategoryPicker(false)}
        onSelect={(value) => setForm({ ...form, category: value })}
        selected={form.category}
      />
      <UnitPicker
        visible={showUnitPicker}
        onClose={() => setShowUnitPicker(false)}
        onSelect={(value) => setForm({ ...form, unit: value })}
        selected={form.unit}
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
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: COLORS.black,
  },
  headerSubtitle: {
    fontSize: 12,
    color: COLORS.gray,
    marginTop: 2,
  },
  headerStats: {
    alignItems: "flex-end",
  },
  statsLabel: {
    fontSize: 12,
    color: COLORS.gray,
  },
  statsValue: {
    fontSize: 24,
    fontWeight: "700",
    color: COLORS.primary,
  },
  scrollView: {
    flex: 1,
  },
  formCard: {
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
  formTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.black,
    marginBottom: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 12,
  },
  pickerButton: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  pickerButtonText: {
    fontSize: 16,
    color: COLORS.black,
  },
  addButton: {
    backgroundColor: COLORS.primary,
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 4,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.white,
  },
  stockCard: {
    margin: 12,
    marginTop: 0,
    padding: 16,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  stockTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.black,
    marginBottom: 16,
  },
  emptyState: {
    paddingVertical: 48,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.gray,
  },
  emptySubtext: {
    fontSize: 12,
    color: COLORS.gray,
    marginTop: 8,
  },
  ingredientCard: {
    padding: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 8,
    marginBottom: 12,
  },
  ingredientHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  ingredientName: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.black,
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: COLORS.lightGray,
    borderRadius: 12,
  },
  categoryText: {
    fontSize: 10,
    color: COLORS.gray,
    textTransform: "capitalize",
  },
  ingredientDetails: {
    marginBottom: 12,
  },
  stockInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  stockLabel: {
    fontSize: 14,
    color: COLORS.gray,
    marginRight: 8,
  },
  stockValue: {
    fontSize: 16,
    fontWeight: "700",
  },
  ingredientActions: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
  },
  actionBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    minWidth: 50,
    alignItems: "center",
  },
  actionBtnRed: {
    backgroundColor: COLORS.red + "20",
  },
  actionBtnYellow: {
    backgroundColor: COLORS.yellow + "20",
  },
  actionBtnGreen: {
    backgroundColor: COLORS.green + "20",
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.black,
  },
  deleteBtn: {
    backgroundColor: COLORS.red,
    marginLeft: 8,
  },
  deleteBtnText: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.white,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  pickerModal: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: "50%",
  },
  pickerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.black,
    marginBottom: 16,
    textAlign: "center",
  },
  pickerItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  pickerItemSelected: {
    backgroundColor: COLORS.primary + "10",
  },
  pickerItemText: {
    fontSize: 16,
    color: COLORS.black,
  },
  pickerItemTextSelected: {
    color: COLORS.primary,
    fontWeight: "700",
  },
})
