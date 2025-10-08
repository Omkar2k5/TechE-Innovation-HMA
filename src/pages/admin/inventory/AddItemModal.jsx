"use client"

import { useState } from "react"

export default function AddItemModal({ open = false, onClose, onSave }) {
  const [form, setForm] = useState({
    name: "",
    unit: "kg",
    category: "",
    supplier: "",
    costPerUnit: 0,
    stock: 0,
    lowStockThreshold: 5,
    expiry: "",
  })
  if (!open) return null
  const save = () => {
    onSave && onSave(form)
    onClose && onClose()
    setForm({
      name: "",
      unit: "kg",
      category: "",
      supplier: "",
      costPerUnit: 0,
      stock: 0,
      lowStockThreshold: 5,
      expiry: "",
    })
  }

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
      <div className="bg-white p-4 rounded w-96">
        <h3 className="font-semibold mb-2">Add Inventory Item</h3>
        <div className="grid grid-cols-2 gap-2">
          <input
            placeholder="Name"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            className="p-2 border rounded col-span-2"
          />
          <input
            placeholder="Unit"
            value={form.unit}
            onChange={(e) => setForm((f) => ({ ...f, unit: e.target.value }))}
            className="p-2 border rounded"
          />
          <input
            placeholder="Category"
            value={form.category}
            onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
            className="p-2 border rounded"
          />
          <input
            placeholder="Supplier"
            value={form.supplier}
            onChange={(e) => setForm((f) => ({ ...f, supplier: e.target.value }))}
            className="p-2 border rounded col-span-2"
          />
          <input
            type="number"
            placeholder="Cost per unit"
            value={form.costPerUnit}
            onChange={(e) => setForm((f) => ({ ...f, costPerUnit: Number(e.target.value) }))}
            className="p-2 border rounded"
          />
          <input
            type="number"
            placeholder="Stock"
            value={form.stock}
            onChange={(e) => setForm((f) => ({ ...f, stock: Number(e.target.value) }))}
            className="p-2 border rounded"
          />
          <input
            type="number"
            placeholder="Low stock at"
            value={form.lowStockThreshold}
            onChange={(e) => setForm((f) => ({ ...f, lowStockThreshold: Number(e.target.value) }))}
            className="p-2 border rounded"
          />
          <input
            type="date"
            placeholder="Expiry (optional)"
            value={form.expiry}
            onChange={(e) => setForm((f) => ({ ...f, expiry: e.target.value }))}
            className="p-2 border rounded"
          />
        </div>
        <div className="flex justify-end gap-2 mt-3">
          <button onClick={onClose} className="px-3 py-2 border rounded">
            Cancel
          </button>
          <button onClick={save} className="px-3 py-2 bg-blue-600 text-white rounded">
            Save
          </button>
        </div>
      </div>
    </div>
  )
}
