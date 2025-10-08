"use client"

import { useMemo, useState } from "react"

export default function InventoryTable({ items = [], onEdit, onDelete }) {
  const [page, setPage] = useState(1)
  const pageSize = 10
  const pages = Math.max(1, Math.ceil(items.length / pageSize))
  const pageItems = useMemo(() => items.slice((page - 1) * pageSize, page * pageSize), [items, page])

  const [editingId, setEditingId] = useState(null)
  const [editForm, setEditForm] = useState({ stock: 0, costPerUnit: 0, lowStockThreshold: 0 })

  const startEdit = (it) => {
    setEditingId(it._id)
    setEditForm({
      stock: it.stock ?? 0,
      costPerUnit: it.costPerUnit ?? 0,
      lowStockThreshold: it.lowStockThreshold ?? 5,
    })
  }
  const saveEdit = () => {
    if (!editingId) return
    onEdit && onEdit(editingId, editForm)
    setEditingId(null)
  }

  return (
    <div className="bg-white p-3 rounded shadow">
      <table className="w-full text-left">
        <thead className="sticky top-0 bg-white z-10">
          <tr className="text-sm text-gray-600">
            <th className="py-2">Name</th>
            <th>Stock</th>
            <th>Unit</th>
            <th>Cost</th>
            <th className="w-36">Status</th>
            <th className="w-64">Actions</th>
          </tr>
        </thead>
        <tbody>
          {pageItems.map((it) => {
            const isLow = (it.stock || 0) <= (it.lowStockThreshold ?? 5)
            const editing = editingId === it._id
            return (
              <tr key={it._id} className="border-t">
                <td className="py-2 font-medium">{it.name}</td>
                <td className="py-2">
                  {editing ? (
                    <input
                      type="number"
                      value={editForm.stock}
                      onChange={(e) => setEditForm((f) => ({ ...f, stock: Number(e.target.value) }))}
                      className="w-24 p-1 border rounded"
                    />
                  ) : (
                    it.stock
                  )}
                </td>
                <td className="py-2">{it.unit}</td>
                <td className="py-2">
                  {editing ? (
                    <input
                      type="number"
                      value={editForm.costPerUnit}
                      onChange={(e) => setEditForm((f) => ({ ...f, costPerUnit: Number(e.target.value) }))}
                      className="w-24 p-1 border rounded"
                    />
                  ) : (
                    <>₹{it.costPerUnit}</>
                  )}
                </td>
                <td className="py-2">
                  <span
                    className={`inline-flex items-center px-2 py-1 rounded border text-xs ${isLow ? "border-amber-400 text-amber-700 bg-amber-50" : "border-emerald-400 text-emerald-700 bg-emerald-50"}`}
                  >
                    {isLow ? "Low Stock" : "OK"}
                  </span>
                </td>
                <td className="py-2">
                  {editing ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={editForm.lowStockThreshold}
                        onChange={(e) => setEditForm((f) => ({ ...f, lowStockThreshold: Number(e.target.value) }))}
                        className="w-28 p-1 border rounded"
                        placeholder="Low stock at"
                      />
                      <button onClick={saveEdit} className="px-2 py-1 bg-green-600 text-white rounded">
                        Save
                      </button>
                      <button onClick={() => setEditingId(null)} className="px-2 py-1 border rounded">
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onEdit && onEdit(it._id, { stock: (it.stock || 0) + 1 })}
                        className="px-2 py-1 bg-green-600 text-white rounded"
                      >
                        +1
                      </button>
                      <button
                        onClick={() => onEdit && onEdit(it._id, { stock: Math.max(0, (it.stock || 0) - 1) })}
                        className="px-2 py-1 bg-yellow-600 text-white rounded"
                      >
                        -1
                      </button>
                      <button onClick={() => startEdit(it)} className="px-2 py-1 border rounded">
                        Edit
                      </button>
                      <button
                        onClick={() => onDelete && onDelete(it._id)}
                        className="px-2 py-1 bg-red-600 text-white rounded"
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
      <div className="mt-3 flex justify-between items-center">
        <div className="text-sm text-gray-500">
          Page {page} / {pages}
        </div>
        <div className="flex gap-2">
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} className="px-2 py-1 border rounded">
            Prev
          </button>
          <button onClick={() => setPage((p) => Math.min(pages, p + 1))} className="px-2 py-1 border rounded">
            Next
          </button>
        </div>
      </div>
    </div>
  )
}
