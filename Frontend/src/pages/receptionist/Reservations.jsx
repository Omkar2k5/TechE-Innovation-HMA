import React, { useEffect, useMemo, useState } from 'react'
import api from '../../lib/api'
import reservationStore from '../../lib/reservationStore'

// Small dropdown component used in header
function ReservationDropdown({ openModal }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="relative">
      <button onClick={() => setOpen((s) => !s)} className="px-3 py-2 rounded-md bg-slate-800 text-white">
        New Reservation ▾
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-40 bg-white border border-gray-200 rounded-md shadow-lg z-50">
          <button
            onClick={() => { setOpen(false); openModal('reservation'); }}
            className="w-full text-left px-3 py-2 hover:bg-gray-50"
          >
            Online Reservation
          </button>
          <button
            onClick={() => { setOpen(false); openModal('walkin'); }}
            className="w-full text-left px-3 py-2 hover:bg-gray-50"
          >
            Walk-in
          </button>
        </div>
      )}
    </div>
  )
}

export default function ReservationsPage({ allowCreate = true }) {
  const [reservations, setReservations] = useState([])
  const [tables, setTables] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const upcomingCount = useMemo(
    () => reservations.filter((r) => r.status === 'pending' || r.status === 'reserved').length,
    [reservations]
  )

  const walkinCount = useMemo(() => reservations.filter((r) => r.reservationType === 'walkin' || r.reservationType === 'walk-in').length, [reservations])
  const onlineCount = useMemo(() => reservations.filter((r) => r.reservationType === 'reservation' || r.reservationType === 'online').length, [reservations])

  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', phone: '', persons: 2, time: '20:00' })
  // modal mode: 'reservation' or 'walkin'
  const [mode, setMode] = useState('reservation')
  const [selectedTableId, setSelectedTableId] = useState(null)
  const [showList, setShowList] = useState(true) // Default to showing list
  // reservation type filter: 'all' | 'walkin' | 'online'
  const [typeFilter, setTypeFilter] = useState('all') // Default to 'all'
  // date filter - default to today
  const getTodayDateString = () => {
    const today = new Date();
    return today.toISOString().split('T')[0]; // Format: YYYY-MM-DD
  }
  const [dateFilter, setDateFilter] = useState(getTodayDateString())

  const matchingTables = useMemo(() => {
    console.log('🔄 Calculating matching tables...')
    console.log('📊 Total tables:', tables.length)
    console.log('👥 Required persons:', form.persons)
    
    const filtered = tables.filter((t) => {
      const hasCapacity = t.capacity >= form.persons
      const isAvailable = t.status === 'AVAILABLE' || t.status === 'VACANT'
      console.log(`Table ${t.tableId}: capacity=${t.capacity}, status=${t.status}, hasCapacity=${hasCapacity}, isAvailable=${isAvailable}`)
      return hasCapacity && isAvailable
    })
    
    console.log('✅ Matching tables:', filtered.length)
    return filtered
  }, [tables, form.persons])

  const resetModal = (modeParam = 'reservation') => {
    setForm({ name: '', email: '', phone: '', persons: 2, time: '20:00' })
    setSelectedTableId(null)
    setMode(modeParam)
  }

  const openModal = (modeParam = 'reservation') => {
    resetModal(modeParam)
    setOpen(true)
  }

  const closeModal = () => setOpen(false)

  // Fetch reservations from API
  const fetchReservations = async () => {
    try {
      console.log('🔍 Fetching reservations...');
      const response = await api.get('/reservations')
      console.log('📋 Reservations API response:', response);
      
      if (response.success) {
        console.log('✅ Reservations loaded:', response.data.length, 'reservations');
        console.log('📊 Reservation data:', response.data);
        setReservations(response.data)
      } else {
        console.error('❌ Failed to load reservations:', response.message);
        setError(response.message)
      }
    } catch (error) {
      console.error('💥 Error fetching reservations:', error);
      setError('Failed to fetch reservations')
    }
  }

  // Fetch all reservations from all dates
  const fetchAllReservations = async () => {
    try {
      console.log('🔍 Fetching all reservations from all dates...');
      const response = await api.get('/reservations/all')
      console.log('📋 All Reservations API response:', response);
      
      if (response.success) {
        console.log('✅ All reservations loaded:', response.data.length, 'reservations');
        console.log('📊 All reservation data:', response.data);
        setReservations(response.data)
        // Clear date filter to show all dates
        setDateFilter('')
      } else {
        console.error('❌ Failed to load all reservations:', response.message);
        setError(response.message)
      }
    } catch (error) {
      console.error('💥 Error fetching all reservations:', error);
      setError('Failed to fetch all reservations')
    }
  }

  // Fetch available tables from API
  const fetchTables = async (guests = 1) => {
    try {
      console.log('🔍 Fetching tables for guests:', guests)
      const response = await api.get(`/reservations/available-tables?guests=${guests}`)
      console.log('📋 Tables API response:', response)
      console.log('🔍 Response type:', typeof response)
      console.log('🔍 Response keys:', Object.keys(response))
      
      if (response && response.success) {
        console.log('✅ Tables loaded:', response.data?.length || 0, 'tables')
        console.log('📊 Table data:', response.data)
        setTables(response.data || [])
      } else {
        console.error('❌ Failed to load tables:', response?.message || 'Unknown error')
        console.error('❌ Full response:', response)
        setError(response?.message || 'Failed to load tables')
      }
    } catch (error) {
      console.error('💥 Error fetching tables:', error)
      setError('Failed to fetch tables')
    }
  }

  const confirmReservation = async () => {
    // For walk-in: only require persons and table selection
    // For online reservation: require name, phone, and table
    if (mode === 'walkin') {
      if (!selectedTableId || !form.persons) return
    } else {
      if (!form.name || !form.phone || !selectedTableId) return
    }
    
    const table = tables.find((t) => t.tableId === selectedTableId)
    if (!table) return

    try {
      // For walk-in, use default values for customer details
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

      const response = await api.post('/reservations', reservationData)
      if (response.success) {
        // For walk-in, update table status to OCCUPIED instead of RESERVED
        if (mode === 'walkin') {
          try {
            await api.put(`/tables/${selectedTableId}/status`, { status: 'OCCUPIED' })
          } catch (err) {
            console.error('Failed to update table status to occupied:', err)
          }
        }
        
        // Refresh reservations and tables
        await fetchReservations()
        await fetchTables(form.persons)
        
        // Show the list (already default true)
        setShowList(true)
        
        closeModal()
      } else {
        setError(response.message || 'Failed to create reservation')
      }
    } catch (error) {
      setError('Failed to create reservation')
      console.error('Error creating reservation:', error)
    }
  }

  // Update reservation status
  const updateReservationStatus = async (reservationId, newStatus) => {
    try {
      console.log(`🔄 Updating reservation ${reservationId} to status: ${newStatus}`);
      const response = await api.patch(`/reservations/${reservationId}/status`, { status: newStatus })
      console.log('📋 Status update response:', response);
      
      if (response.success) {
        if (newStatus === 'cancelled') {
          console.log('🗑️ Reservation cancelled - it has been deleted from database');
        }
        // Refresh data to reflect changes
        await fetchReservations()
        await fetchTables(form.persons)
        console.log('✅ Data refreshed after status update');
      } else {
        console.error('❌ Failed to update status:', response.message);
        setError(response.message || 'Failed to update reservation status')
      }
    } catch (error) {
      console.error('💥 Error updating reservation status:', error);
      setError('Failed to update reservation status')
    }
  }

  // Load data on component mount
  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      await fetchReservations()
      await fetchTables()
      setLoading(false)
    }
    loadData()
  }, [])

  // Update tables when person count changes
  useEffect(() => {
    if (form.persons > 0) {
      fetchTables(form.persons)
    }
  }, [form.persons])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-600">Loading reservations...</div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
          <button 
            onClick={() => setError(null)}
            className="ml-2 text-red-500 hover:text-red-700"
          >
            ×
          </button>
        </div>
      )}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-slate-800">Reservations</h1>
        <div className="flex items-center gap-2">
          {/* New Reservation dropdown - hidden when allowCreate is false (admin view) */}
          {allowCreate && <ReservationDropdown openModal={openModal} />}
        </div>
      </div>

      {upcomingCount > 0 && (
        <div className="text-sm text-slate-600">Upcoming: {upcomingCount}</div>
      )}

      {/* Filter section: type and date */}
      <div className="space-y-3">
        {/* Date filter */}
        <div className="flex items-center gap-2">
          <label className="text-sm text-slate-600 font-medium">Filter by Date:</label>
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => {
              console.log('📅 Date filter changed to:', e.target.value);
              setDateFilter(e.target.value);
            }}
            className="px-3 py-1 rounded-md border border-slate-300 focus:border-slate-500 focus:ring-slate-500"
          />
          <button
            onClick={() => {
              const today = getTodayDateString();
              console.log('📅 Reset to today:', today);
              setDateFilter(today);
            }}
            className="px-3 py-1 rounded-md bg-slate-200 text-slate-700 hover:bg-slate-300"
          >
            Today
          </button>
          <button
            onClick={() => {
              console.log('📅 Fetching all reservations from all dates');
              fetchAllReservations();
            }}
            className="px-3 py-1 rounded-md bg-blue-600 text-white hover:bg-blue-700"
          >
            Show All Dates
          </button>
        </div>

        {/* Reservation type filter buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              console.log('🔘 Walk-ins filter clicked');
              setTypeFilter('walkin');
              setShowList(true);
            }}
            className={`px-3 py-1 rounded-md ${typeFilter === 'walkin' ? 'bg-slate-800 text-white' : 'bg-white border border-slate-300 text-slate-800 hover:bg-slate-50'}`}
          >
            Walk-ins ({walkinCount})
          </button>
          <button
            onClick={() => {
              console.log('🔘 Online filter clicked');
              setTypeFilter('online');
              setShowList(true);
            }}
            className={`px-3 py-1 rounded-md ${typeFilter === 'online' ? 'bg-slate-800 text-white' : 'bg-white border border-slate-300 text-slate-800 hover:bg-slate-50'}`}
          >
            Online ({onlineCount})
          </button>
          <button
            onClick={() => {
              console.log('🔘 Show All filter clicked');
              setTypeFilter('all');
              setShowList(true);
            }}
            className={`px-3 py-1 rounded-md ${typeFilter === 'all' ? 'bg-slate-800 text-white' : 'bg-white border border-slate-300 text-slate-800 hover:bg-slate-50'}`}
          >
            Show All
          </button>
        </div>
      </div>

      {showList && (
        <div id="reservations-list" className="grid gap-3">
          {(() => {
            console.log('🔎 Filtering reservations...');
            console.log('📊 Total reservations:', reservations.length);
            console.log('🔘 Current filter:', typeFilter);
            console.log('📊 Show list:', showList);
            
            const filtered = reservations.filter((r) => {
              // Filter by type
              let matchesType = true;
              if (typeFilter === 'walkin') {
                matchesType = r.reservationType === 'walkin' || r.reservationType === 'walk-in';
              } else if (typeFilter === 'online') {
                matchesType = r.reservationType === 'reservation' || r.reservationType === 'online';
              }
              
              // Filter by date (skip if dateFilter is empty)
              let matchesDate = true;
              if (dateFilter && r.reservationDate) {
                const reservationDate = new Date(r.reservationDate).toISOString().split('T')[0];
                matchesDate = reservationDate === dateFilter;
              }
              
              return matchesType && matchesDate;
            });
            
            console.log('✅ Filtered reservations:', filtered.length);
            console.log('📊 Filtered data:', filtered);
            
            return filtered;
          })()
            .map((r) => (
          <div
            key={r.reservationId}
            className="rounded-lg border p-3 flex items-center justify-between bg-white"
          >
            <div>
              <div className="flex items-center gap-2">
                <div className="font-medium">{r.customerDetails.name} <span className="text-xs text-slate-500">({r.customerDetails.phone})</span></div>
                <div className={`text-xs px-2 py-0.5 rounded-full ${r.reservationType === 'walkin' || r.reservationType === 'walk-in' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>
                  {r.reservationType === 'walkin' || r.reservationType === 'walk-in' ? 'Walk-in' : 'Online'}
                </div>
              </div>
              <div className="text-sm text-slate-600">
                {r.reservationTime} • Table {r.tableId} • {r.customerDetails.guests} guests
              </div>
              <div className="text-xs text-slate-500">Status: {r.status}</div>
            </div>
            {/* Only show Seat/Cancel buttons for online reservations, not walk-ins */}
            {(r.reservationType !== 'walkin' && r.reservationType !== 'walk-in') && (
              <div className="flex gap-2">
                <button
                  onClick={() => updateReservationStatus(r.reservationId, 'seated')}
                  disabled={r.status === 'seated' || r.status === 'completed' || r.status === 'cancelled'}
                  className="px-3 py-1 rounded-md bg-blue-600 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Seat
                </button>
                <button
                  onClick={() => updateReservationStatus(r.reservationId, 'cancelled')}
                  disabled={r.status === 'cancelled' || r.status === 'completed'}
                  className="px-3 py-1 rounded-md bg-red-600 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        ))}
        </div>
      )}

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={closeModal} />
          <div className="relative z-10 w-full max-w-3xl bg-white rounded-xl shadow-lg p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-800">{mode === 'walkin' ? 'Walk-in' : 'New Reservation'}</h2>
              <button
                onClick={closeModal}
                className="px-2 py-1 text-slate-500 hover:text-slate-700"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                {/* For walk-in: only show persons field */}
                {/* For online reservation: show all fields */}
                {mode !== 'walkin' && (
                  <>
                    <div>
                      <label className="block text-sm text-slate-600 mb-1">Name *</label>
                      <input
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        className="w-full rounded-md border-slate-300 focus:border-slate-500 focus:ring-slate-500"
                        placeholder="Customer name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-slate-600 mb-1">Email</label>
                      <input
                        type="email"
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                        className="w-full rounded-md border-slate-300 focus:border-slate-500 focus:ring-slate-500"
                        placeholder="customer@email.com"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-slate-600 mb-1">Phone number *</label>
                      <input
                        value={form.phone}
                        onChange={(e) => setForm({ ...form, phone: e.target.value })}
                        className="w-full rounded-md border-slate-300 focus:border-slate-500 focus:ring-slate-500"
                        placeholder="Phone number"
                      />
                    </div>
                  </>
                )}
                
                <div>
                  <label className="block text-sm text-slate-600 mb-1">Number of persons *</label>
                  <input
                    type="number"
                    min={1}
                    value={form.persons}
                    onChange={(e) => {
                      const n = Math.max(1, Number(e.target.value) || 1)
                      setForm({ ...form, persons: n })
                      setSelectedTableId(null)
                    }}
                    className="w-full rounded-md border-slate-300 focus:border-slate-500 focus:ring-slate-500"
                  />
                </div>
                {mode !== 'walkin' && (
                  <div>
                    <label className="block text-sm text-slate-600 mb-1">Reservation time</label>
                    <input
                      type="time"
                      value={form.time}
                      onChange={(e) => setForm({ ...form, time: e.target.value })}
                      className="w-full rounded-md border-slate-300 focus:border-slate-500 focus:ring-slate-500"
                    />
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <div className="text-sm text-slate-600">
                  Matching tables (capacity ≥ {form.persons})
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-h-72 overflow-auto pr-1">
                  {matchingTables.length === 0 && (
                    <div className="text-sm text-slate-500">
                      No available tables match this party size.
                    </div>
                  )}
                  {matchingTables.map((t) => {
                    const selected = t.tableId === selectedTableId
                    return (
                      <button
                        key={t.tableId}
                        onClick={() => setSelectedTableId(t.tableId)}
                        className={`rounded-lg border p-3 text-left transition-colors ${
                          selected
                            ? 'border-slate-800 ring-2 ring-slate-800'
                            : 'border-slate-200 hover:border-slate-300'
                        } ${
                          t.status === 'VACANT' || t.status === 'AVAILABLE'
                            ? 'bg-green-50'
                            : 'bg-slate-50'
                        }`}
                      >
                        <div className="font-semibold">Table {t.tableId}</div>
                        <div className="text-sm text-slate-600">
                          Capacity: {t.capacity}
                        </div>
                        <div className="mt-1 text-xs uppercase tracking-wide">
                          {t.status}
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>

            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                onClick={closeModal}
                className="px-3 py-2 rounded-md border border-slate-300 bg-white hover:bg-slate-50"
              >
                Cancel
              </button>
              {/* View Reservations removed per request */}
              <button
                onClick={confirmReservation}
                disabled={
                  mode === 'walkin' 
                    ? !selectedTableId || !form.persons
                    : !form.name || !form.phone || !selectedTableId
                }
                className="px-3 py-2 rounded-md bg-slate-800 text-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {mode === 'walkin' ? 'Confirm Walk-in' : 'Confirm Reservation'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
