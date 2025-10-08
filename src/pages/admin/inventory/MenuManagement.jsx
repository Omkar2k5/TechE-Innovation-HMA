"use client"

import { useState } from "react"
import AddMenu from "../menu/AddMenu.jsx"

export default function MenuManagement({ items = [], menus = [], onAddMenu, onUpdateMenu, onDeleteMenu }) {
  const [showAdd, setShowAdd] = useState(false)
  const [editing, setEditing] = useState(null)
  const [q, setQ] = useState("")
  const [onlyAvailable, setOnlyAvailable] = useState(false)
  const [editingPriceId, setEditingPriceId] = useState(null)
  const [priceInput, setPriceInput] = useState("")

  const save = (menu) => {
    console.log("MenuManagement save called with:", menu)

    if (editing) {
      onUpdateMenu && onUpdateMenu(editing._id, menu)
    } else {
      onAddMenu && onAddMenu(menu)
    }

    setShowAdd(false)
    setEditing(null)
  }

  return (
    <div>
      <div className="mb-4 flex justify-between items-center">
        <h2 className="text-xl font-semibold">Menu Management</h2>
        <div className="flex items-center gap-2">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search menu..."
            className="px-2 py-2 border rounded"
          />
          <label className="text-sm text-slate-700 inline-flex items-center gap-2">
            <input type="checkbox" checked={onlyAvailable} onChange={(e) => setOnlyAvailable(e.target.checked)} />
            Available only
          </label>
          <button onClick={() => setShowAdd(true)} className="px-3 py-2 bg-blue-600 text-white rounded">
            Add Menu Item
          </button>
        </div>
      </div>
      <div className="bg-white p-4 rounded shadow">
        <table className="w-full text-left">
          <thead>
            <tr className="text-sm text-gray-600">
              <th>Name</th>
              <th>Price (₹)</th>
              <th>Cost (₹)</th>
              <th>Profit (₹)</th>
              <th>Available</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {menus
              .filter((m) => m != null && m._id != null)
              .filter((m) => !q || (m.name || "").toLowerCase().includes(q.toLowerCase()))
              .filter((m) => (onlyAvailable ? m.active !== false : true))
              .map((m) => {
                const ingredients = Array.isArray(m.ingredients) ? m.ingredients : []
                const cost = ingredients.reduce((s, ing) => {
                  const match =
                    items.find((i) => i._id === ing.id) ||
                    items.find((i) => (i.name || "").toLowerCase() === (ing.name || "").toLowerCase())
                  const unitCost = match?.costPerUnit || 0
                  const qty = Number(ing.qty ?? ing.quantity ?? 0)
                  return s + qty * unitCost
                }, 0)
                const profit = Number(m.price ?? 0) - cost
                const isEditingPrice = editingPriceId === m._id
                return (
                  <tr key={m._id} className="border-t">
                    <td className="py-2">{m.name}</td>
                    <td className="py-2">
                      {isEditingPrice ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            value={priceInput}
                            onChange={(e) => setPriceInput(e.target.value)}
                            className="w-24 p-1 border rounded"
                          />
                          <button
                            onClick={() => {
                              onUpdateMenu && onUpdateMenu(m._id, { price: Number(priceInput) })
                              setEditingPriceId(null)
                            }}
                            className="px-2 py-1 bg-green-600 text-white rounded"
                          >
                            Save
                          </button>
                          <button onClick={() => setEditingPriceId(null)} className="px-2 py-1 border rounded">
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          ₹{Number(m.price ?? 0).toFixed(2)}
                          <button
                            onClick={() => {
                              setEditingPriceId(m._id)
                              setPriceInput(String(m.price ?? 0))
                            }}
                            className="px-2 py-1 border rounded text-sm"
                          >
                            Edit
                          </button>
                        </div>
                      )}
                    </td>
                    <td className="py-2">₹{cost.toFixed(2)}</td>
                    <td className="py-2">
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded border text-xs ${profit >= 0 ? "border-emerald-400 text-emerald-700 bg-emerald-50" : "border-rose-400 text-rose-700 bg-rose-50"}`}
                      >
                        ₹{profit.toFixed(2)}
                      </span>
                    </td>
                    <td className="py-2">
                      <label className="inline-flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={m.active !== false}
                          onChange={(e) => onUpdateMenu && onUpdateMenu(m._id, { active: e.target.checked })}
                        />
                        {m.active !== false ? "Available" : "Hidden"}
                      </label>
                    </td>
                    <td className="py-2">
                      <button
                        onClick={() => setEditing(m) || setShowAdd(true)}
                        className="px-2 py-1 mr-2 bg-yellow-600 text-white rounded"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => onDeleteMenu && onDeleteMenu(m._id)}
                        className="px-2 py-1 bg-red-600 text-white rounded"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                )
              })}
          </tbody>
        </table>
      </div>

      {showAdd && (
        <AddMenu
          initialMenu={editing}
          onSave={save}
          onCancel={() => {
            setShowAdd(false)
            setEditing(null)
          }}
          allIngredients={items.map((i) => i.name)}
        />
      )}
    </div>
  )
}
