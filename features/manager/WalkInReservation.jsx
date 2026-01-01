import { useState, useEffect } from "react"
import { 
  View, Text, StyleSheet, ScrollView, Pressable, Alert, 
  TextInput, Modal, ActivityIndicator 
} from "react-native"
import api from "../../services/api"

const COLORS = {
  primary: "#2F6FED",
  green: "#10B981",
  red: "#EF4444",
  gray: "#6B7280",
  white: "#FFFFFF",
  black: "#0E141B",
  lightGray: "#F3F4F6",
}

const WalkInModal = ({ visible, onClose, onSubmit }) => {
  const [persons, setPersons] = useState("2")
  const [tables, setTables] = useState([])
  const [selectedTableId, setSelectedTableId] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (visible) {
      setPersons("2")
      setSelectedTableId(null)
      fetchTables(2)
    }
  }, [visible])

  const fetchTables = async (guests) => {
    try {
      setLoading(true)
      console.log('🔍 Fetching tables for', guests, 'guests')
      
      const response = await api.tables.getAll()
      console.log('📋 Tables API response:', response)
      
      if (response && response.success && response.data) {
        // Backend returns tables inside data object
        const allTables = response.data.tables || []
        console.log('✅ Total tables:', allTables.length)
        
        // Filter available tables with enough capacity
        const availableTables = allTables.filter(t => {
          const hasCapacity = t.capacity >= guests
          const isAvailable = t.status === 'AVAILABLE' || t.status === 'VACANT'
          return hasCapacity && isAvailable
        })
        
        console.log('✅ Available tables:', availableTables.length)
        setTables(availableTables)
      } else {
        console.log('⚠️ No tables data in response')
        setTables([])
      }
    } catch (error) {
      console.error('❌ Error fetching tables:', error)
      Alert.alert('Error', 'Failed to load tables. Please check connection.')
    } finally {
      setLoading(false)
    }
  }

  const handlePersonsChange = (text) => {
    setPersons(text)
    const n = parseInt(text) || 1
    if (n > 0) {
      setSelectedTableId(null)
      fetchTables(n)
    }
  }

  const handleSubmit = () => {
    if (!selectedTableId || !persons) {
      Alert.alert('Required', 'Please select a table and number of persons')
      return
    }

    const table = tables.find(t => t.tableId === selectedTableId)
    if (!table) return

    // Format time as HH:MM (24-hour format) for backend
    const now = new Date()
    const hours = String(now.getHours()).padStart(2, '0')
    const minutes = String(now.getMinutes()).padStart(2, '0')
    const timeStr = `${hours}:${minutes}`

    const reservationData = {
      reservationType: 'walkin',
      customerDetails: {
        name: 'Walk-in Guest',
        email: '',
        phone: 'N/A',
        guests: parseInt(persons) || 2
      },
      tableId: selectedTableId,
      tableNumber: table.tableId,
      reservationTime: timeStr,
      reservationDate: new Date().toISOString(),
      specialRequests: '',
      notes: ''
    }

    onSubmit(reservationData)
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>🚶 Walk-in Guest</Text>
          <Pressable onPress={onClose} style={styles.closeBtn}>
            <Text style={styles.closeBtnText}>✕</Text>
          </Pressable>
        </View>

        <ScrollView style={styles.modalContent}>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Number of Persons *</Text>
            <TextInput
              style={styles.input}
              value={persons}
              onChangeText={handlePersonsChange}
              keyboardType="numeric"
              placeholder="2"
            />
          </View>

          <View style={styles.tablesSection}>
            <Text style={styles.sectionTitle}>
              Available Tables (capacity ≥ {persons || 0})
            </Text>
            
            {loading ? (
              <ActivityIndicator size="small" color={COLORS.primary} />
            ) : tables.length === 0 ? (
              <Text style={styles.emptyText}>No available tables for {persons} persons</Text>
            ) : (
              <View style={styles.tablesGrid}>
                {tables.map(table => {
                  const selected = table.tableId === selectedTableId
                  return (
                    <Pressable
                      key={table.tableId}
                      onPress={() => setSelectedTableId(table.tableId)}
                      style={[
                        styles.tableCard,
                        selected && styles.tableCardSelected,
                      ]}
                    >
                      <Text style={styles.tableCardId}>Table {table.tableId}</Text>
                      <Text style={styles.tableCardCapacity}>Cap: {table.capacity}</Text>
                      <Text style={styles.tableCardStatus}>{table.status}</Text>
                    </Pressable>
                  )
                })}
              </View>
            )}
          </View>

          <View style={styles.modalActions}>
            <Pressable onPress={onClose} style={styles.modalCancelBtn}>
              <Text style={styles.modalCancelBtnText}>Cancel</Text>
            </Pressable>
            <Pressable
              onPress={handleSubmit}
              disabled={!selectedTableId || !persons}
              style={[
                styles.modalSubmitBtn,
                (!selectedTableId || !persons) && styles.disabledBtn
              ]}
            >
              <Text style={styles.modalSubmitBtnText}>Confirm Walk-in</Text>
            </Pressable>
          </View>
        </ScrollView>
      </View>
    </Modal>
  )
}

export default function WalkInReservation() {
  const [showModal, setShowModal] = useState(false)

  const createWalkIn = async (reservationData) => {
    try {
      console.log('🚶 Creating walk-in reservation:', reservationData)
      const response = await api.reservations.create(reservationData)
      
      if (response && response.success) {
        console.log('✅ Walk-in reservation created successfully')
        
        // Update table status to OCCUPIED for walk-in
        try {
          console.log('🔄 Updating table status to OCCUPIED:', reservationData.tableId)
          await api.tables.updateStatus(reservationData.tableId, 'OCCUPIED')
          console.log('✅ Table status updated to OCCUPIED')
        } catch (err) {
          console.error('❌ Failed to update table status:', err)
          // Don't fail the whole operation if table update fails
        }
        
        setShowModal(false)
        Alert.alert('Success', `Walk-in created for Table ${reservationData.tableId}`)
      } else {
        console.error('❌ Failed to create walk-in:', response?.message)
        Alert.alert('Error', response?.message || 'Failed to create walk-in')
      }
    } catch (error) {
      console.error('❌ Error creating walk-in:', error)
      const errorMessage = error?.message || error?.response?.data?.message || 'Failed to create walk-in'
      Alert.alert('Error', errorMessage)
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Walk-in Reservations</Text>
        <Pressable onPress={() => setShowModal(true)} style={styles.addBtn}>
          <Text style={styles.addBtnText}>+ New Walk-in</Text>
        </Pressable>
      </View>

      <View style={styles.content}>
        <Text style={styles.infoText}>
          Quick table assignment for walk-in guests.{'\n'}
          Select number of persons and available table.
        </Text>
      </View>

      <WalkInModal
        visible={showModal}
        onClose={() => setShowModal(false)}
        onSubmit={createWalkIn}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.lightGray,
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
  addBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: COLORS.green,
    borderRadius: 8,
  },
  addBtnText: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.white,
  },
  content: {
    padding: 16,
  },
  infoText: {
    fontSize: 14,
    color: COLORS.gray,
    textAlign: "center",
    lineHeight: 20,
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
    marginBottom: 24,
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
  tablesSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.gray,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.gray,
    textAlign: "center",
    padding: 20,
  },
  tablesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  tableCard: {
    width: "30%",
    padding: 12,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "#E5E7EB",
    backgroundColor: COLORS.green + "10",
  },
  tableCardSelected: {
    borderColor: COLORS.black,
    backgroundColor: COLORS.green + "30",
  },
  tableCardId: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.black,
    marginBottom: 4,
  },
  tableCardCapacity: {
    fontSize: 12,
    color: COLORS.gray,
    marginBottom: 4,
  },
  tableCardStatus: {
    fontSize: 10,
    fontWeight: "600",
    color: COLORS.green,
    textTransform: "uppercase",
  },
  modalActions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 24,
    marginBottom: 32,
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 8,
    alignItems: "center",
  },
  modalCancelBtnText: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.gray,
  },
  modalSubmitBtn: {
    flex: 1,
    paddingVertical: 14,
    backgroundColor: COLORS.green,
    borderRadius: 8,
    alignItems: "center",
  },
  modalSubmitBtnText: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.white,
  },
  disabledBtn: {
    opacity: 0.5,
  },
})
