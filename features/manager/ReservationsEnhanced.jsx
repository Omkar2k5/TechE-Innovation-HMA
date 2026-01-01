"use client"

import { useState, useEffect, useMemo } from "react"
import { 
  View, Text, StyleSheet, ScrollView, Pressable, Alert, 
  TextInput, Modal, RefreshControl, ActivityIndicator 
} from "react-native"
import api from "../../services/api"
import syncService from "../../services/syncService"

const COLORS = {
  primary: "#2F6FED",
  green: "#10B981",
  red: "#EF4444",
  yellow: "#F59E0B",
  blue: "#3B82F6",
  gray: "#6B7280",
  white: "#FFFFFF",
  black: "#0E141B",
  lightGray: "#F3F4F6",
}

const ReservationCard = ({ reservation, onUpdateStatus }) => {
  const isWalkIn = reservation.reservationType === 'walkin' || reservation.reservationType === 'walk-in'
  const isOnline = reservation.reservationType === 'reservation' || reservation.reservationType === 'online'
  
  return (
    <View style={styles.reservationCard}>
      <View style={styles.cardHeader}>
        <View style={styles.cardHeaderLeft}>
          <Text style={styles.customerName}>{reservation.customerDetails.name}</Text>
          <Text style={styles.customerPhone}>({reservation.customerDetails.phone})</Text>
        </View>
        <View style={[
          styles.typeBadge,
          { backgroundColor: isWalkIn ? COLORS.green + "20" : COLORS.blue + "20" }
        ]}>
          <Text style={[
            styles.typeBadgeText,
            { color: isWalkIn ? COLORS.green : COLORS.blue }
          ]}>
            {isWalkIn ? 'Walk-in' : 'Online'}
          </Text>
        </View>
      </View>

      <View style={styles.cardDetails}>
        <Text style={styles.detailText}>
          {reservation.reservationTime} • Table {reservation.tableId} • {reservation.customerDetails.guests} guests
        </Text>
        <Text style={styles.statusText}>Status: {reservation.status}</Text>
      </View>

      {/* Only show actions for online reservations */}
      {isOnline && (
        <View style={styles.cardActions}>
          <Pressable
            onPress={() => onUpdateStatus(reservation.reservationId, 'seated')}
            disabled={reservation.status === 'seated' || reservation.status === 'completed' || reservation.status === 'cancelled'}
            style={[
              styles.actionBtn,
              styles.seatBtn,
              (reservation.status === 'seated' || reservation.status === 'completed' || reservation.status === 'cancelled') && styles.disabledBtn
            ]}
          >
            <Text style={styles.actionBtnText}>Seat</Text>
          </Pressable>
          <Pressable
            onPress={() => onUpdateStatus(reservation.reservationId, 'cancelled')}
            disabled={reservation.status === 'cancelled' || reservation.status === 'completed'}
            style={[
              styles.actionBtn,
              styles.cancelBtn,
              (reservation.status === 'cancelled' || reservation.status === 'completed') && styles.disabledBtn
            ]}
          >
            <Text style={styles.actionBtnText}>Cancel</Text>
          </Pressable>
        </View>
      )}
    </View>
  )
}

const ReservationModal = ({ visible, onClose, onSubmit, mode }) => {
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    persons: 2,
    time: '20:00'
  })
  const [tables, setTables] = useState([])
  const [selectedTableId, setSelectedTableId] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (visible) {
      resetForm()
      fetchTables(2)
    }
  }, [visible])

  useEffect(() => {
    if (form.persons > 0 && visible) {
      fetchTables(form.persons)
    }
  }, [form.persons, visible])

  const resetForm = () => {
    setForm({ name: '', email: '', phone: '', persons: 2, time: '20:00' })
    setSelectedTableId(null)
  }

  const fetchTables = async (guests) => {
    try {
      setLoading(true)
      const response = await api.get(`/reservations/available-tables?guests=${guests}`)
      if (response.success) {
        setTables(response.data || [])
      }
    } catch (error) {
      console.error('Error fetching tables:', error)
    } finally {
      setLoading(false)
    }
  }

  const matchingTables = useMemo(() => {
    return tables.filter(t => {
      const hasCapacity = t.capacity >= form.persons
      const isAvailable = t.status === 'AVAILABLE' || t.status === 'VACANT'
      return hasCapacity && isAvailable
    })
  }, [tables, form.persons])

  const handleSubmit = () => {
    if (mode === 'walkin') {
      if (!selectedTableId || !form.persons) {
        Alert.alert('Required', 'Please select a table and number of persons')
        return
      }
    } else {
      if (!form.name || !form.phone || !selectedTableId) {
        Alert.alert('Required', 'Please fill in name, phone, and select a table')
        return
      }
    }

    const table = tables.find(t => t.tableId === selectedTableId)
    if (!table) return

    const reservationData = {
      reservationType: mode,
      customerDetails: {
        name: mode === 'walkin' ? 'Walk-in Guest' : form.name,
        email: mode === 'walkin' ? '' : form.email,
        phone: mode === 'walkin' ? 'N/A' : form.phone,
        guests: form.persons
      },
      tableId: selectedTableId,
      tableNumber: table.tableId,
      reservationTime: form.time,
      reservationDate: new Date().toISOString(),
      specialRequests: '',
      notes: ''
    }

    onSubmit(reservationData, mode)
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>
            {mode === 'walkin' ? '🚶 Walk-in' : '📅 New Reservation'}
          </Text>
          <Pressable onPress={onClose} style={styles.closeBtn}>
            <Text style={styles.closeBtnText}>✕</Text>
          </Pressable>
        </View>

        <ScrollView style={styles.modalContent}>
          <View style={styles.formSection}>
            {mode !== 'walkin' && (
              <>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Name *</Text>
                  <TextInput
                    style={styles.input}
                    value={form.name}
                    onChangeText={(text) => setForm({ ...form, name: text })}
                    placeholder="Customer name"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Email</Text>
                  <TextInput
                    style={styles.input}
                    value={form.email}
                    onChangeText={(text) => setForm({ ...form, email: text })}
                    placeholder="customer@email.com"
                    keyboardType="email-address"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Phone *</Text>
                  <TextInput
                    style={styles.input}
                    value={form.phone}
                    onChangeText={(text) => setForm({ ...form, phone: text })}
                    placeholder="Phone number"
                    keyboardType="phone-pad"
                  />
                </View>
              </>
            )}

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Number of Persons *</Text>
              <TextInput
                style={styles.input}
                value={form.persons.toString()}
                onChangeText={(text) => {
                  const n = Math.max(1, parseInt(text) || 1)
                  setForm({ ...form, persons: n })
                  setSelectedTableId(null)
                }}
                keyboardType="numeric"
              />
            </View>

            {mode !== 'walkin' && (
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Reservation Time</Text>
                <TextInput
                  style={styles.input}
                  value={form.time}
                  onChangeText={(text) => setForm({ ...form, time: text })}
                  placeholder="20:00"
                />
              </View>
            )}
          </View>

          <View style={styles.tablesSection}>
            <Text style={styles.sectionTitle}>
              Matching Tables (capacity ≥ {form.persons})
            </Text>
            
            {loading ? (
              <ActivityIndicator size="small" color={COLORS.primary} />
            ) : matchingTables.length === 0 ? (
              <Text style={styles.emptyText}>No available tables match this party size</Text>
            ) : (
              <View style={styles.tablesGrid}>
                {matchingTables.map(table => {
                  const selected = table.tableId === selectedTableId
                  return (
                    <Pressable
                      key={table.tableId}
                      onPress={() => setSelectedTableId(table.tableId)}
                      style={[
                        styles.tableCard,
                        selected && styles.tableCardSelected,
                        { backgroundColor: table.status === 'VACANT' || table.status === 'AVAILABLE' ? COLORS.green + "10" : COLORS.lightGray }
                      ]}
                    >
                      <Text style={styles.tableCardId}>Table {table.tableId}</Text>
                      <Text style={styles.tableCardCapacity}>Capacity: {table.capacity}</Text>
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
              disabled={mode === 'walkin' ? !selectedTableId || !form.persons : !form.name || !form.phone || !selectedTableId}
              style={[
                styles.modalSubmitBtn,
                (mode === 'walkin' ? !selectedTableId || !form.persons : !form.name || !form.phone || !selectedTableId) && styles.disabledBtn
              ]}
            >
              <Text style={styles.modalSubmitBtnText}>
                {mode === 'walkin' ? 'Confirm Walk-in' : 'Confirm Reservation'}
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </View>
    </Modal>
  )
}

export default function ReservationsEnhanced() {
  const [reservations, setReservations] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [modalMode, setModalMode] = useState('reservation')
  const [typeFilter, setTypeFilter] = useState('all')
  const [dateFilter, setDateFilter] = useState(new Date().toISOString().split('T')[0])

  useEffect(() => {
    loadReservations()
  }, [])

  const loadReservations = async () => {
    try {
      setLoading(true)
      const response = await syncService.fetchAndCache('reservations', '/reservations')
      if (response) {
        setReservations(response || [])
      }
    } catch (error) {
      console.error('Error loading reservations:', error)
      Alert.alert('Error', 'Failed to load reservations')
    } finally {
      setLoading(false)
    }
  }

  const onRefresh = async () => {
    setRefreshing(true)
    await loadReservations()
    setRefreshing(false)
  }

  const openModal = (mode) => {
    setModalMode(mode)
    setShowModal(true)
  }

  const createReservation = async (reservationData, mode) => {
    try {
      const response = await api.post('/reservations', reservationData)
      
      if (response.success) {
        // For walk-in, update table status to OCCUPIED
        if (mode === 'walkin') {
          try {
            await api.put(`/tables/${reservationData.tableId}/status`, { status: 'OCCUPIED' })
          } catch (err) {
            console.error('Failed to update table status:', err)
          }
        }
        
        setShowModal(false)
        Alert.alert('Success', `${mode === 'walkin' ? 'Walk-in' : 'Reservation'} created successfully`)
        loadReservations()
      } else {
        Alert.alert('Error', response.message || 'Failed to create reservation')
      }
    } catch (error) {
      console.error('Error creating reservation:', error)
      Alert.alert('Error', 'Failed to create reservation')
    }
  }

  const updateReservationStatus = async (reservationId, newStatus) => {
    try {
      const response = await api.patch(`/reservations/${reservationId}/status`, { status: newStatus })
      
      if (response.success) {
        if (newStatus === 'cancelled') {
          Alert.alert('Cancelled', 'Reservation has been cancelled and removed')
        } else {
          Alert.alert('Success', `Reservation status updated to ${newStatus}`)
        }
        loadReservations()
      } else {
        Alert.alert('Error', response.message || 'Failed to update status')
      }
    } catch (error) {
      console.error('Error updating reservation status:', error)
      Alert.alert('Error', 'Failed to update reservation status')
    }
  }

  const filteredReservations = useMemo(() => {
    return reservations.filter(r => {
      // Filter by type
      let matchesType = true
      if (typeFilter === 'walkin') {
        matchesType = r.reservationType === 'walkin' || r.reservationType === 'walk-in'
      } else if (typeFilter === 'online') {
        matchesType = r.reservationType === 'reservation' || r.reservationType === 'online'
      }

      // Filter by date
      let matchesDate = true
      if (dateFilter && r.reservationDate) {
        const reservationDate = new Date(r.reservationDate).toISOString().split('T')[0]
        matchesDate = reservationDate === dateFilter
      }

      return matchesType && matchesDate
    })
  }, [reservations, typeFilter, dateFilter])

  const upcomingCount = reservations.filter(r => r.status === 'pending' || r.status === 'reserved').length
  const walkinCount = reservations.filter(r => r.reservationType === 'walkin' || r.reservationType === 'walk-in').length
  const onlineCount = reservations.filter(r => r.reservationType === 'reservation' || r.reservationType === 'online').length

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading reservations...</Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Reservations</Text>
          {upcomingCount > 0 && (
            <Text style={styles.headerSubtitle}>Upcoming: {upcomingCount}</Text>
          )}
        </View>
        <View style={styles.headerActions}>
          <Pressable onPress={() => openModal('reservation')} style={styles.addBtn}>
            <Text style={styles.addBtnText}>+ Online</Text>
          </Pressable>
          <Pressable onPress={() => openModal('walkin')} style={[styles.addBtn, { backgroundColor: COLORS.green }]}>
            <Text style={styles.addBtnText}>+ Walk-in</Text>
          </Pressable>
        </View>
      </View>

      {/* Date Filter */}
      <View style={styles.filterSection}>
        <Text style={styles.filterLabel}>Date:</Text>
        <TextInput
          style={styles.dateInput}
          value={dateFilter}
          onChangeText={setDateFilter}
          placeholder="YYYY-MM-DD"
        />
        <Pressable
          onPress={() => setDateFilter(new Date().toISOString().split('T')[0])}
          style={styles.todayBtn}
        >
          <Text style={styles.todayBtnText}>Today</Text>
        </Pressable>
        <Pressable
          onPress={() => setDateFilter('')}
          style={styles.allBtn}
        >
          <Text style={styles.allBtnText}>All</Text>
        </Pressable>
      </View>

      {/* Type Filter */}
      <View style={styles.typeFilterSection}>
        <Pressable
          onPress={() => setTypeFilter('walkin')}
          style={[styles.typeFilterBtn, typeFilter === 'walkin' && styles.typeFilterBtnActive]}
        >
          <Text style={[styles.typeFilterBtnText, typeFilter === 'walkin' && styles.typeFilterBtnTextActive]}>
            Walk-ins ({walkinCount})
          </Text>
        </Pressable>
        <Pressable
          onPress={() => setTypeFilter('online')}
          style={[styles.typeFilterBtn, typeFilter === 'online' && styles.typeFilterBtnActive]}
        >
          <Text style={[styles.typeFilterBtnText, typeFilter === 'online' && styles.typeFilterBtnTextActive]}>
            Online ({onlineCount})
          </Text>
        </Pressable>
        <Pressable
          onPress={() => setTypeFilter('all')}
          style={[styles.typeFilterBtn, typeFilter === 'all' && styles.typeFilterBtnActive]}
        >
          <Text style={[styles.typeFilterBtnText, typeFilter === 'all' && styles.typeFilterBtnTextActive]}>
            Show All
          </Text>
        </Pressable>
      </View>

      {/* Reservations List */}
      <ScrollView
        style={styles.scrollView}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {filteredReservations.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No reservations found</Text>
          </View>
        ) : (
          filteredReservations.map(reservation => (
            <ReservationCard
              key={reservation.reservationId}
              reservation={reservation}
              onUpdateStatus={updateReservationStatus}
            />
          ))
        )}
      </ScrollView>

      {/* Reservation Modal */}
      <ReservationModal
        visible={showModal}
        onClose={() => setShowModal(false)}
        onSubmit={createReservation}
        mode={modalMode}
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
  headerActions: {
    flexDirection: "row",
    gap: 8,
  },
  addBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: COLORS.primary,
    borderRadius: 8,
  },
  addBtnText: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.white,
  },
  filterSection: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    gap: 8,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.gray,
  },
  dateInput: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 8,
    fontSize: 14,
  },
  todayBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: COLORS.lightGray,
    borderRadius: 8,
  },
  todayBtnText: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.gray,
  },
  allBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: COLORS.primary,
    borderRadius: 8,
  },
  allBtnText: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.white,
  },
  typeFilterSection: {
    flexDirection: "row",
    padding: 12,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    gap: 8,
  },
  typeFilterBtn: {
    flex: 1,
    paddingVertical: 8,
    backgroundColor: COLORS.lightGray,
    borderRadius: 8,
    alignItems: "center",
  },
  typeFilterBtnActive: {
    backgroundColor: COLORS.black,
  },
  typeFilterBtnText: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.gray,
  },
  typeFilterBtnTextActive: {
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
  reservationCard: {
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
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  cardHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  customerName: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.black,
  },
  customerPhone: {
    fontSize: 12,
    color: COLORS.gray,
  },
  typeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  typeBadgeText: {
    fontSize: 10,
    fontWeight: "700",
  },
  cardDetails: {
    marginBottom: 12,
  },
  detailText: {
    fontSize: 14,
    color: COLORS.gray,
    marginBottom: 4,
  },
  statusText: {
    fontSize: 12,
    color: COLORS.gray,
  },
  cardActions: {
    flexDirection: "row",
    gap: 8,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  seatBtn: {
    backgroundColor: COLORS.blue,
  },
  cancelBtn: {
    backgroundColor: COLORS.red,
  },
  actionBtnText: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.white,
  },
  disabledBtn: {
    opacity: 0.5,
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
  formSection: {
    marginBottom: 24,
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
  tablesSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.gray,
    marginBottom: 12,
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
  },
  tableCardSelected: {
    borderColor: COLORS.black,
    borderWidth: 2,
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
    color: COLORS.gray,
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
    backgroundColor: COLORS.black,
    borderRadius: 8,
    alignItems: "center",
  },
  modalSubmitBtnText: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.white,
  },
})
