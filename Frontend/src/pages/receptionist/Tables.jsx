import React, { useState } from 'react'

export default function TablesPage() {
  const [tables, setTables] = useState([
    { id: 1, name: 'T1', seats: 2 },
    { id: 2, name: 'T2', seats: 4 },
  ])

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold text-slate-800">Table Management</h1>
      <div className="flex gap-2">
        <button
          className="px-3 py-2 rounded-md bg-slate-800 text-white"
          onClick={() => setTables((prev) => [...prev, { id: prev.length + 1, name: `T${prev.length + 1}`, seats: 2 }])}
        >
          Add Table
        </button>
      </div>

      <div className="grid gap-3">
        {tables.map((t) => (
          <div key={t.id} className="rounded-lg border bg-white p-3 flex items-center justify-between">
            <div className="font-medium">{t.name}</div>
            <div className="text-sm text-slate-600">{t.seats} seats</div>
          </div>
        ))}
      </div>
    </div>
  )
}
