import React, { useMemo, useState } from 'react'

export default function ReportsPage() {
  const [dailySales, setDailySales] = useState(Array.from({ length: 7 }, () => Math.floor(Math.random() * 5000)))
  const total = useMemo(() => dailySales.reduce((a, b) => a + b, 0), [dailySales])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-slate-800">Reports</h1>
        <button className="px-3 py-2 rounded-md bg-slate-800 text-white" onClick={() => setDailySales(Array.from({ length: 7 }, () => Math.floor(Math.random() * 5000)))}>Refresh</button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3">
        {dailySales.map((v, i) => (
          <div key={i} className="rounded-lg border bg-white p-3">
            <div className="text-sm text-slate-600">Day {i + 1}</div>
            <div className="text-xl font-semibold">₹{v}</div>
          </div>
        ))}
      </div>

      <div className="rounded-lg border bg-white p-3">
        <div className="text-sm text-slate-600">Weekly Total</div>
        <div className="text-2xl font-semibold">₹{total}</div>
      </div>
    </div>
  )
}
