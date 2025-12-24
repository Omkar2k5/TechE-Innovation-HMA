"use client"

import { useEffect, useState } from "react"
import TableManagement from "../receptionist/Dashboard.jsx"
import reservationStore from "../../lib/reservationStore"

function ReservationsPanel() {
  const [reservations, setReservations] = useState([])

  useEffect(() => {
    const unsub = reservationStore.subscribe(setReservations)
    return () => unsub()
  }, [])

  if (reservations.length === 0) {
    return (
      <div className="rounded-lg border p-4 bg-white">
        <div className="text-sm text-slate-600">No reservations yet.</div>
      </div>
    )
  }

  return (
    <div id="owner-reservations-list" className="grid gap-3">
      {reservations.map((r, idx) => (
        <div key={idx} className="rounded-lg border p-3 flex items-center justify-between bg-white">
          <div>
            <div className="flex items-center gap-2">
              <div className="font-medium">
                {r.name} {r.phone ? <span className="text-xs text-slate-500">({r.phone})</span> : null}
              </div>
              <div
                className={`text-xs px-2 py-0.5 rounded-full ${r.mode === "walkin" ? "bg-green-100 text-green-800" : "bg-blue-100 text-blue-800"}`}
              >
                {r.mode === "walkin" ? "Walk-in" : "Online"}
              </div>
            </div>
            <div className="text-sm text-slate-600">
              {r.time} • {r.table} • {r.guests} guests
            </div>
            <div className="text-xs text-slate-500">Status: {r.status}</div>
          </div>
        </div>
      ))}
    </div>
  )
}

export default function OwnerTablesManagement() {
  const [showReservations, setShowReservations] = useState(false)

  return (
    <div className="p-0">
      <div className="p-6 pb-0">
        <button onClick={() => setShowReservations((s) => !s)} className="px-3 py-2 rounded-md bg-slate-800 text-white">
          {showReservations ? "Hide Reservations" : "Reservations"}
        </button>
      </div>

      {showReservations && (
        <div className="p-6">
          <ReservationsPanel />
        </div>
      )}

      {/* existing tables UI from receptionist reused below */}
      <TableManagement />
    </div>
  )
}
