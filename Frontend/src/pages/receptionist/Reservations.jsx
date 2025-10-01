import React, { useEffect, useMemo, useState } from 'react'

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

export default function ReservationsPage() {
  const [reservations, setReservations] = useState([])
  const [tables, setTables] = useState(
    Array.from({ length: 18 }, (_, i) => ({
      id: i + 1,
      number: i + 1,
      capacity: [2, 4, 6, 8][i % 4],
      status: (i % 5 === 0 ? 'occupied' : 'available'),
    }))
  )

  const upcomingCount = useMemo(
    () => reservations.filter((r) => r.status === 'pending' || r.status === 'reserved').length,
    [reservations]
  )

  const walkinCount = useMemo(() => reservations.filter((r) => r.mode === 'walkin').length, [reservations])
  const onlineCount = useMemo(() => reservations.filter((r) => r.mode === 'reservation' || r.mode === 'online').length, [reservations])

  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', phone: '', persons: 2, time: '20:00' })
  // modal mode: 'reservation' or 'walkin'
  const [mode, setMode] = useState('reservation')
  const [selectedTableId, setSelectedTableId] = useState(null)
  const [showList, setShowList] = useState(false)
  // reservation type filter: 'all' | 'walkin' | 'online'
  const [typeFilter, setTypeFilter] = useState('all')

  const matchingTables = useMemo(
    () => tables.filter((t) => t.capacity >= form.persons && t.status === 'available'),
    [tables, form.persons]
  )

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

  const confirmReservation = () => {
    if (!form.name || !form.phone || !selectedTableId) return
    const table = tables.find((t) => t.id === selectedTableId)
    if (!table) return

    const today = new Date()
    // For walk-ins, use current time; otherwise use selected time
    let timeStr = form.time
    if (mode === 'walkin') {
      const hh = String(today.getHours()).padStart(2, '0')
      const mm = String(today.getMinutes()).padStart(2, '0')
      timeStr = `${hh}:${mm}`
    }

    const [hours, minutes] = timeStr.split(':').map(Number)
    const start = new Date(today)
    start.setHours(hours, minutes, 0, 0)

    const bufferStart = new Date(start.getTime() - 2 * 60 * 60 * 1000) // 2 hours before
    const end = new Date(start.getTime() + 2 * 60 * 60 * 1000) // assume 2h duration

    setReservations((prev) => {
      const next = [
        ...prev,
        {
          id: prev.length + 1,
          name: form.name,
          email: form.email,
          phone: form.phone,
          time: timeStr,
          table: `T${table.number}`,
          guests: form.persons,
          bufferStart,
          start,
          end,
          status: 'pending', // not active until bufferStart
          mode,
        },
      ]

      // show the list and apply filter for the created reservation type
      setShowList(true)
      setTypeFilter(mode === 'walkin' ? 'walkin' : 'online')

      // scroll to the newly added reservation shortly after render
      setTimeout(() => {
        const list = document.getElementById('reservations-list')
        if (list && list.children.length) {
          const el = list.children[list.children.length - 1]
          el.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }
      }, 120)

      return next
    })

    closeModal()
  }

  // 🔥 Auto-update reservation statuses based on current time
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date()

      setReservations((prev) =>
        prev.map((r) => {
          if (r.status === 'cancelled' || r.status === 'completed' || r.status === 'seated') {
            return r
          }
          if (now >= r.bufferStart && now < r.start) {
            // within buffer window → reserved
            return { ...r, status: 'reserved' }
          }
          if (now >= r.end) {
            // past end time → completed
            return { ...r, status: 'completed' }
          }
          return r
        })
      )

      // update table statuses based on active reservations
      setTables((prev) =>
        prev.map((t) => {
          const activeRes = reservations.find((r) => r.table === `T${t.number}` && r.status === 'reserved')
          if (activeRes) return { ...t, status: 'reserved' }
          const occupiedRes = reservations.find((r) => r.table === `T${t.number}` && r.status === 'seated')
          if (occupiedRes) return { ...t, status: 'occupied' }
          return { ...t, status: 'available' }
        })
      )
    }, 60000) // check every 1 minute

    return () => clearInterval(interval)
  }, [reservations])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-slate-800">Reservations</h1>
        <div className="flex items-center gap-2">
          {/* New Reservation dropdown */}
          <ReservationDropdown openModal={openModal} />
        </div>
      </div>

      {upcomingCount > 0 && (
        <div className="text-sm text-slate-600">Upcoming: {upcomingCount}</div>
      )}

      {/* Left-side filter buttons for reservation types */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setTypeFilter('walkin')}
          className={`px-3 py-1 rounded-md ${typeFilter === 'walkin' ? 'bg-slate-800 text-white' : 'bg-white border border-slate-300 text-slate-800 hover:bg-slate-50'}`}
        >
          Walk-ins ({walkinCount})
        </button>
        <button
          onClick={() => setTypeFilter('online')}
          className={`px-3 py-1 rounded-md ${typeFilter === 'online' ? 'bg-slate-800 text-white' : 'bg-white border border-slate-300 text-slate-800 hover:bg-slate-50'}`}
        >
          Online ({onlineCount})
        </button>
        <button
          onClick={() => setTypeFilter('all')}
          className={`px-3 py-1 rounded-md ${typeFilter === 'all' ? 'bg-slate-800 text-white' : 'bg-white border border-slate-300 text-slate-800 hover:bg-slate-50'}`}
        >
          Show All
        </button>
      </div>

      {showList && (
        <div id="reservations-list" className="grid gap-3">
          {reservations
            .filter((r) => {
              if (typeFilter === 'all') return true
              if (typeFilter === 'walkin') return r.mode === 'walkin'
              if (typeFilter === 'online') return r.mode === 'reservation' || r.mode === 'online'
              return true
            })
            .map((r) => (
          <div
            key={r.id}
            className="rounded-lg border p-3 flex items-center justify-between bg-white"
          >
            <div>
              <div className="flex items-center gap-2">
                <div className="font-medium">{r.name} <span className="text-xs text-slate-500">({r.phone})</span></div>
                <div className={`text-xs px-2 py-0.5 rounded-full ${r.mode === 'walkin' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>
                  {r.mode === 'walkin' ? 'Walk-in' : 'Online'}
                </div>
              </div>
              <div className="text-sm text-slate-600">
                {r.time} • {r.table} • {r.guests} guests
              </div>
              <div className="text-xs text-slate-500">Status: {r.status}</div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() =>
                  setReservations((prev) =>
                    prev.map((pr) =>
                      pr.id === r.id ? { ...pr, status: 'seated' } : pr
                    )
                  )
                }
                className="px-3 py-1 rounded-md bg-blue-600 text-white"
              >
                Seat
              </button>
              <button
                onClick={() =>
                  setReservations((prev) =>
                    prev.map((pr) =>
                      pr.id === r.id ? { ...pr, status: 'cancelled' } : pr
                    )
                  )
                }
                className="px-3 py-1 rounded-md bg-red-600 text-white"
              >
                Cancel
              </button>
            </div>
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
                <div>
                  <label className="block text-sm text-slate-600 mb-1">Name</label>
                  <input
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full rounded-md border-slate-300 focus:border-slate-500 focus:ring-slate-500"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-600 mb-1">Email</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full rounded-md border-slate-300 focus:border-slate-500 focus:ring-slate-500"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-600 mb-1">Phone number</label>
                  <input
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="w-full rounded-md border-slate-300 focus:border-slate-500 focus:ring-slate-500"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-600 mb-1">Number of persons</label>
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
                    const selected = t.id === selectedTableId
                    return (
                      <button
                        key={t.id}
                        onClick={() => setSelectedTableId(t.id)}
                        className={`rounded-lg border p-3 text-left transition-colors ${
                          selected
                            ? 'border-slate-800 ring-2 ring-slate-800'
                            : 'border-slate-200 hover:border-slate-300'
                        } ${
                          t.status === 'available'
                            ? 'bg-green-50'
                            : 'bg-slate-50'
                        }`}
                      >
                        <div className="font-semibold">Table {t.number}</div>
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
                disabled={!form.name || !form.phone || !selectedTableId}
                className="px-3 py-2 rounded-md bg-slate-800 text-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Confirm Reservation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
