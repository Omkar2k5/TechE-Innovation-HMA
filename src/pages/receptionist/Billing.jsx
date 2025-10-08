import React, { useMemo, useState } from 'react'

export default function BillingPage() {
  const [bills, setBills] = useState([
    { id: 1, table: 'T1', items: [{ name: 'Pasta', qty: 2, price: 180 }], paid: false },
    { id: 2, table: 'T3', items: [{ name: 'Soup', qty: 1, price: 90 }], paid: true },
  ])

  const totalPending = useMemo(() =>
    bills.filter((b) => !b.paid).reduce((sum, b) => sum + b.items.reduce((s, i) => s + i.price * i.qty, 0), 0)
  , [bills])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-slate-800">Orders & Billing</h1>
        <button
          className="px-3 py-2 rounded-md bg-slate-800 text-white"
          onClick={() => setBills((prev) => [...prev, { id: prev.length + 1, table: `T${prev.length + 1}`, items: [], paid: false }])}
        >
          New Bill
        </button>
      </div>

      <div className="text-sm text-slate-600">Total Pending Amount: ₹{totalPending}</div>

      <div className="grid gap-3">
        {bills.map((b) => {
          const amount = b.items.reduce((s, i) => s + i.price * i.qty, 0)
          return (
            <div key={b.id} className="rounded-lg border bg-white p-3 flex items-center justify-between">
              <div>
                <div className="font-medium">{b.table}</div>
                <div className="text-sm text-slate-600">Items: {b.items.length} • Amount: ₹{amount}</div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setBills((prev) => prev.map(pb => pb.id === b.id ? { ...pb, items: [...pb.items, { name: 'Tea', qty: 1, price: 40 }] } : pb))} className="px-3 py-1 rounded-md bg-slate-700 text-white">Add Item</button>
                <button onClick={() => setBills((prev) => prev.map(pb => pb.id === b.id ? { ...pb, paid: true } : pb))} className="px-3 py-1 rounded-md bg-green-600 text-white">Mark Paid</button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
