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
  { label: "Starters", value: "Starters" },
  { label: "Main Course", value: "Main Course" },
  { label: "Desserts", value: "Desserts" },
  { label: "Beverages", value: "Beverages" },
  { label: "Other", value: "Other" },
]

export default function MenuManagement() {
  const [menuItems, setMenuItems] = useState([])
  const [ingredients, setIngredients] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingItem, setEditingItem] = useState(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      console.log('📋 Loading menu items...')
      
      const [menuResponse, ingredientsResponse] = await Promise.all([
        api.menu.getAll(),
        api.menu.getIngredients()
      ])

      console.log('✅ Menu response:', menuResponse)

      // Backend returns data wrapped in success/data structure
      if (menuResponse && menuResponse.success && menuResponse.data) {
        setMenuItems(menuResponse.data.menuItems || [])
      } else if (Array.isArray(menuResponse)) {
        // Fallback for array response
        setMenuItems(menuResponse)
      } else {
        setMenuItems([])
      }

      // Backend returns data wrapped in success/data structure
      if (ingredientsResponse && ingredientsResponse.success && ingredientsResponse.data) {
        setIngredients(ingredientsResponse.data.ingredients || [])
      } else if (Array.isArray(ingredientsResponse)) {
        // Fallback for array response
        setIngredients(ingredientsResponse)
      } else {
        setIngredients([])
      }
    } catch (error) {
      console.error('❌ Failed to load data:', error)
      Alert.alert('Error', 'Failed to load menu data')
    } finally {
      setLoading(false)
    }
  }

  const onRefresh = async () => {
    setRefreshing(true)
    await loadData()
    setRefreshing(false)
  }

  const openAddModal = () => {
    setEditingItem(null)
    setShowAddModal(true)
  }

  const openEditModal = (item) => {
    setEditingItem(item)
    setShowAddModal(true)
  }

  const deleteMenuItem = (item) => {
    Alert.alert(
      'Delete Menu Item',
      `Are you sure you want to delete "${item.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              // Use itemId instead of _id for deletion
              const itemIdToDelete = item.itemId || item._id
              console.log('🗑️ Deleting item with ID:', itemIdToDelete)
              await api.menu.deleteItem(itemIdToDelete)
              Alert.alert('Success', 'Menu item deleted')
              loadData()
            } catch (error) {
              console.error('❌ Failed to delete:', error)
              Alert.alert('Error', 'Failed to delete menu item')
            }
          }
        }
      ]
    )
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading menu...</Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Menu Management</Text>
          <Text style={styles.headerSubtitle}>Manage menu items and dishes</Text>
        </View>
        <Pressable style={styles.addButton} onPress={openAddModal}>
          <Text style={styles.addButtonText}>+ Add Item</Text>
        </Pressable>
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {menuItems.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No menu items yet</Text>
            <Text style={styles.emptySubtext}>Add your first menu item to get started</Text>
          </View>
        ) : (
          menuItems.map((item, idx) => (
            <View key={idx} style={styles.menuCard}>
              <View style={styles.menuHeader}>
                <View style={styles.menuInfo}>
                  <Text style={styles.menuName}>{item.name}</Text>
                  <View style={styles.categoryBadge}>
                    <Text style={styles.categoryText}>{item.category || 'Other'}</Text>
                  </View>
                </View>
                <Text style={styles.menuPrice}>₹{item.price || 0}</Text>
              </View>

              <View style={styles.menuDetails}>
                <Text style={styles.detailLabel}>Prep Time: {item.preparationTime || item.avgPrepTimeMins || 15} min</Text>
                {item.ingredients && item.ingredients.length > 0 && (
                  <Text style={styles.detailLabel}>
                    Ingredients: {item.ingredients.slice(0, 3).map(ing => 
                      typeof ing === 'string' ? ing : `${ing.name || ing}`
                    ).join(', ')}
                    {item.ingredients.length > 3 && ` +${item.ingredients.length - 3} more`}
                  </Text>
                )}
              </View>

              <View style={styles.menuActions}>
                <Pressable
                  style={[styles.actionBtn, styles.editBtn]}
                  onPress={() => openEditModal(item)}
                >
                  <Text style={styles.actionBtnText}>Edit</Text>
                </Pressable>
                <Pressable
                  style={[styles.actionBtn, styles.deleteBtn]}
                  onPress={() => deleteMenuItem(item)}
                >
                  <Text style={styles.actionBtnText}>Delete</Text>
                </Pressable>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* Add/Edit Modal */}
      <AddEditMenuModal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSave={loadData}
        editingItem={editingItem}
        availableIngredients={ingredients}
      />
    </View>
  )
}

const AddEditMenuModal = ({ visible, onClose, onSave, editingItem, availableIngredients }) => {
  const [form, setForm] = useState({
    name: '',
    category: 'Main Course',
    price: '',
    avgPrepTimeMins: '15',
    ingredients: [],
    description: ''
  })
  const [showCategoryPicker, setShowCategoryPicker] = useState(false)

  useEffect(() => {
    if (editingItem) {
      // Normalize ingredients to objects with name, quantity, unit
      const normalizedIngredients = (editingItem.ingredients || []).map(ing => 
        typeof ing === 'string' 
          ? { name: ing, quantity: '', unit: 'grams' }
          : { name: ing.name || ing, quantity: ing.quantity || '', unit: ing.unit || 'grams' }
      )
      
      setForm({
        name: editingItem.name || '',
        category: editingItem.category || 'Main Course',
        price: (editingItem.price || '').toString(),
        avgPrepTimeMins: ((editingItem.preparationTime || editingItem.avgPrepTimeMins) || 15).toString(),
        ingredients: normalizedIngredients,
        description: editingItem.description || ''
      })
    } else {
      setForm({
        name: '',
        category: 'Main Course',
        price: '',
        avgPrepTimeMins: '15',
        ingredients: [{ name: '', quantity: '', unit: 'grams' }],
        description: ''
      })
    }
  }, [editingItem, visible])

  const addIngredient = () => {
    setForm({
      ...form,
      ingredients: [...form.ingredients, { name: '', quantity: '', unit: 'grams' }]
    })
  }

  const updateIngredient = (index, field, value) => {
    const updated = form.ingredients.map((ing, i) => 
      i === index ? { ...ing, [field]: value } : ing
    )
    setForm({ ...form, ingredients: updated })
  }

  const removeIngredient = (index) => {
    setForm({
      ...form,
      ingredients: form.ingredients.filter((_, i) => i !== index)
    })
  }

  const handleSave = async () => {
    if (!form.name.trim()) {
      Alert.alert('Required', 'Menu name is required')
      return
    }

    if (!form.price || parseFloat(form.price) <= 0) {
      Alert.alert('Required', 'Valid price is required')
      return
    }

    // Clean ingredients - backend expects array of objects with name, quantity, unit
    console.log('🔍 Raw ingredients:', form.ingredients)
    
    const cleanedIngredients = form.ingredients
      .filter(ing => {
        // Make sure ing is an object and has a name property that's a string
        if (!ing || typeof ing !== 'object') return false
        if (!ing.name || typeof ing.name !== 'string') return false
        return ing.name.trim().length > 0
      })
      .map(ing => {
        // Return object with name, quantity, and unit
        return {
          name: String(ing.name).trim(),
          quantity: parseFloat(ing.quantity) || 0,
          unit: ing.unit || 'grams'
        }
      })

    console.log('✅ Cleaned ingredients:', cleanedIngredients)

    if (cleanedIngredients.length === 0) {
      Alert.alert('Required', 'At least one ingredient is required')
      return
    }

    try {
      // Ensure category is valid
      const validCategories = ['Starters', 'Main Course', 'Desserts', 'Beverages', 'Other']
      let category = form.category || 'Main Course'
      
      // If category is not in valid list, default to 'Other'
      if (!validCategories.includes(category)) {
        console.warn('⚠️ Invalid category:', form.category, '- defaulting to "Other"')
        category = 'Other'
      }

      const menuData = {
        name: form.name.trim(),
        description: form.description?.trim() || '',
        ingredients: cleanedIngredients,
        price: parseFloat(form.price) || 0,
        category: category,
        preparationTime: parseInt(form.avgPrepTimeMins) || 15
      }

      console.log('💾 Saving menu item:', JSON.stringify(menuData, null, 2))
      console.log('📋 Category being sent:', category)

      if (editingItem) {
        // Use itemId instead of _id for update
        const itemIdToUpdate = editingItem.itemId || editingItem._id
        console.log('📝 Updating item:', itemIdToUpdate)
        const response = await api.menu.updateItem(itemIdToUpdate, menuData)
        console.log('✅ Update response:', response)
        Alert.alert('Success', 'Menu item updated successfully!')
      } else {
        console.log('➕ Creating new item')
        const response = await api.menu.createItem(menuData)
        console.log('✅ Create response:', response)
        Alert.alert('Success', 'Menu item added successfully!')
      }

      onClose()
      onSave()
    } catch (error) {
      console.error('❌ Failed to save menu item:', error)
      console.error('❌ Error response:', error.response)
      console.error('❌ Error data:', error.response?.data)
      
      const errorMessage = error.response?.data?.message || error.message || 'Failed to save menu item'
      Alert.alert('Error', errorMessage)
    }
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>
            {editingItem ? 'Edit Menu Item' : 'Add Menu Item'}
          </Text>
          <Pressable onPress={onClose} style={styles.closeBtn}>
            <Text style={styles.closeBtnText}>✕</Text>
          </Pressable>
        </View>

        <ScrollView style={styles.modalContent}>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Menu Name *</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter dish name..."
              value={form.name}
              onChangeText={(text) => setForm({ ...form, name: text })}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Category *</Text>
            <Pressable
              style={styles.pickerButton}
              onPress={() => setShowCategoryPicker(true)}
            >
              <Text style={styles.pickerButtonText}>
                {form.category || 'Main Course'}
              </Text>
            </Pressable>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Price (₹) *</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter price..."
              value={form.price}
              onChangeText={(text) => setForm({ ...form, price: text })}
              keyboardType="numeric"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Prep Time (minutes)</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter prep time..."
              value={form.avgPrepTimeMins}
              onChangeText={(text) => setForm({ ...form, avgPrepTimeMins: text })}
              keyboardType="numeric"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Description (optional)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Enter description..."
              value={form.description}
              onChangeText={(text) => setForm({ ...form, description: text })}
              multiline
              numberOfLines={3}
            />
          </View>

          <View style={styles.ingredientsSection}>
            <View style={styles.ingredientsHeader}>
              <Text style={styles.sectionTitle}>Ingredients</Text>
              <Pressable
                style={styles.addIngredientBtn}
                onPress={addIngredient}
              >
                <Text style={styles.addIngredientBtnText}>+ Add</Text>
              </Pressable>
            </View>

            {form.ingredients.length === 0 ? (
              <View style={styles.emptyIngredients}>
                <Text style={styles.emptyIngredientsText}>No ingredients added yet</Text>
              </View>
            ) : (
              form.ingredients.map((ing, idx) => (
                <View key={idx} style={styles.ingredientRow}>
                  <TextInput
                    style={[styles.ingredientInput, styles.ingredientNameInput]}
                    placeholder="Ingredient name *"
                    value={ing?.name || ''}
                    onChangeText={(text) => updateIngredient(idx, 'name', text)}
                  />
                  <TextInput
                    style={[styles.ingredientInput, styles.ingredientQtyInput]}
                    placeholder="Qty"
                    value={ing?.quantity ? String(ing.quantity) : ''}
                    onChangeText={(text) => updateIngredient(idx, 'quantity', text)}
                    keyboardType="numeric"
                  />
                  <Pressable
                    style={styles.unitPicker}
                    onPress={() => {
                      Alert.alert(
                        'Select Unit',
                        '',
                        [
                          { text: 'grams', onPress: () => updateIngredient(idx, 'unit', 'grams') },
                          { text: 'kg', onPress: () => updateIngredient(idx, 'unit', 'kg') },
                          { text: 'ml', onPress: () => updateIngredient(idx, 'unit', 'ml') },
                          { text: 'liters', onPress: () => updateIngredient(idx, 'unit', 'liters') },
                          { text: 'pieces', onPress: () => updateIngredient(idx, 'unit', 'pieces') },
                          { text: 'cups', onPress: () => updateIngredient(idx, 'unit', 'cups') },
                          { text: 'tbsp', onPress: () => updateIngredient(idx, 'unit', 'tbsp') },
                          { text: 'tsp', onPress: () => updateIngredient(idx, 'unit', 'tsp') },
                          { text: 'Cancel', style: 'cancel' }
                        ]
                      )
                    }}
                  >
                    <Text style={styles.unitText}>{ing?.unit || 'grams'}</Text>
                  </Pressable>
                  <Pressable onPress={() => removeIngredient(idx)} style={styles.removeIngredientBtn}>
                    <Text style={styles.removeBtn}>✕</Text>
                  </Pressable>
                </View>
              ))
            )}
          </View>

          <View style={styles.modalActions}>
            <Pressable onPress={onClose} style={styles.cancelBtn}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </Pressable>
            <Pressable onPress={handleSave} style={styles.saveBtn}>
              <Text style={styles.saveBtnText}>Save</Text>
            </Pressable>
          </View>
        </ScrollView>

        {/* Category Picker */}
        <Modal visible={showCategoryPicker} transparent animationType="slide">
          <Pressable style={styles.pickerOverlay} onPress={() => setShowCategoryPicker(false)}>
            <View style={styles.pickerModal}>
              <Text style={styles.pickerTitle}>Select Category</Text>
              {CATEGORIES.map(cat => (
                <Pressable
                  key={cat.value}
                  onPress={() => {
                    setForm({ ...form, category: cat.value })
                    setShowCategoryPicker(false)
                  }}
                  style={styles.pickerItem}
                >
                  <Text style={styles.pickerItemText}>{cat.label}</Text>
                </Pressable>
              ))}
            </View>
          </Pressable>
        </Modal>
      </View>
    </Modal>
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
  addButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: COLORS.primary,
    borderRadius: 8,
  },
  addButtonText: {
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
  },
  emptySubtext: {
    fontSize: 12,
    color: COLORS.gray,
    marginTop: 8,
  },
  menuCard: {
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
  menuHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  menuInfo: {
    flex: 1,
  },
  menuName: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.black,
    marginBottom: 4,
  },
  categoryBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: COLORS.primary + "20",
    borderRadius: 12,
  },
  categoryText: {
    fontSize: 10,
    color: COLORS.primary,
    fontWeight: "600",
  },
  menuPrice: {
    fontSize: 20,
    fontWeight: "700",
    color: COLORS.green,
  },
  menuDetails: {
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 12,
    color: COLORS.gray,
    marginBottom: 4,
  },
  menuActions: {
    flexDirection: "row",
    gap: 8,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  editBtn: {
    backgroundColor: COLORS.primary,
  },
  deleteBtn: {
    backgroundColor: COLORS.red,
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
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: COLORS.white,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: "top",
  },
  pickerButton: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 8,
    padding: 12,
    backgroundColor: COLORS.white,
  },
  pickerButtonText: {
    fontSize: 16,
    color: COLORS.black,
  },
  ingredientsSection: {
    marginBottom: 16,
  },
  ingredientsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.black,
  },
  addIngredientBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: COLORS.green,
    borderRadius: 6,
  },
  addIngredientBtnText: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.white,
  },
  emptyIngredients: {
    padding: 24,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#E5E7EB",
    borderStyle: "dashed",
    borderRadius: 8,
    marginBottom: 16,
  },
  emptyIngredientsText: {
    fontSize: 14,
    color: COLORS.gray,
  },
  ingredientRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 8,
  },
  ingredientInput: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 8,
    padding: 10,
    fontSize: 14,
  },
  ingredientNameInput: {
    flex: 3,
  },
  ingredientQtyInput: {
    flex: 1.5,
  },
  unitPicker: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 8,
    padding: 10,
    alignItems: "center",
  },
  unitText: {
    fontSize: 12,
    color: COLORS.black,
  },
  removeIngredientBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.red,
    justifyContent: "center",
    alignItems: "center",
  },
  removeBtn: {
    fontSize: 18,
    color: COLORS.white,
    fontWeight: "700",
  },
  modalActions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 24,
    marginBottom: 32,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 8,
    alignItems: "center",
  },
  cancelBtnText: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.gray,
  },
  saveBtn: {
    flex: 1,
    paddingVertical: 14,
    backgroundColor: COLORS.green,
    borderRadius: 8,
    alignItems: "center",
  },
  saveBtnText: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.white,
  },
  pickerOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  pickerModal: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: "60%",
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
  pickerItemText: {
    fontSize: 16,
    color: COLORS.black,
  },
})
