"use client"

import { useEffect, useMemo, useState } from "react"
import QuickStats from "./QuickStats.jsx"
import SearchFilters from "./SearchFilters.jsx"
import InventoryTable from "./InventoryTable.jsx"
import AddItemModal from "./AddItemModal.jsx"
import MenuManagement from "./MenuManagement.jsx"
import api from "../../../lib/api.js"

export default function InventoryDashboard() {
  const [items, setItems] = useState([])
  const [menus, setMenus] = useState([])
  const [active, setActive] = useState("inventory")
  const [filters, setFilters] = useState({
    category: "",
    supplier: "",
    search: "",
    lowOnly: false,
    sort: "name-asc",
    inStockOnly: false,
  })
  const [showAdd, setShowAdd] = useState(false)
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState("standard") // "standard" or "aggregated"
  const [aggregatedItems, setAggregatedItems] = useState([])

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        console.log(" Fetching inventory and menu data...")
        const [inventoryRes, menuRes] = await Promise.all([api.get("/inventory"), api.get("/menu")])
        console.log(" Raw inventory response:", inventoryRes)
        console.log(" Raw menu response:", menuRes)
        console.log(" Inventory items:", inventoryRes.data?.length || 0)
        console.log(" Menu items:", menuRes.data?.length || 0)
        setItems(inventoryRes.data || [])
        setMenus(menuRes.data || [])

        const aggregatedRes = await api.get("/inventory/aggregated")
        console.log("Raw aggregated response:", aggregatedRes)
        console.log("Aggregated inventory items:", aggregatedRes.data?.length || 0)
        setAggregatedItems(aggregatedRes.data || [])
      } catch (err) {
        console.error("Failed to fetch data:", err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const filteredItems = useMemo(() => {
    const base = items.filter((it) => {
      if (filters.category && it.category !== filters.category) return false
      if (filters.supplier && it.supplier !== filters.supplier) return false
      if (filters.lowOnly && !((it.stock || 0) <= (it.lowStockThreshold ?? 5))) return false
      if (filters.inStockOnly && (it.stock || 0) <= 0) return false
      if (filters.search) {
        const q = filters.search.toLowerCase()
        const hay = `${it.name} ${it.category || ""} ${it.supplier || ""}`.toLowerCase()
        if (!hay.includes(q)) return false
      }
      return true
    })
    const sorted = [...base]
    switch (filters.sort) {
      case "name-asc":
        sorted.sort((a, b) => (a.name || "").localeCompare(b.name || ""))
        break
      case "stock-asc":
        sorted.sort((a, b) => (a.stock || 0) - (b.stock || 0))
        break
      case "stock-desc":
        sorted.sort((a, b) => (b.stock || 0) - (a.stock || 0))
        break
    }
    return sorted
  }, [items, filters])

  const addItem = async (item) => {
    try {
      const res = await api.post("/inventory", item)
      setItems((s) => [res.data, ...s])
    } catch (err) {
      console.error("Failed to add item:", err)
      alert("Failed to add item")
    }
  }

  const updateItem = async (id, patch) => {
    try {
      const res = await api.put(`/inventory/${id}`, patch)
      setItems((s) => s.map((it) => (it._id === id ? res.data : it)))
    } catch (err) {
      console.error(" Failed to update item:", err)
      alert("Failed to update item")
    }
  }

  const deleteItem = async (id) => {
    try {
      await api.del(`/inventory/${id}`)
      setItems((s) => s.filter((it) => it._id !== id))
    } catch (err) {
      console.error(" Failed to delete item:", err)
      alert("Failed to delete item")
    }
  }

  const addMenu = async (menu) => {
    try {
      console.log(" Adding menu with data:", menu)
      const res = await api.post("/menu", menu)
      console.log("Menu added successfully:", res.data)
      setMenus((s) => [res.data, ...s])

      const [inventoryRes, aggregatedRes] = await Promise.all([api.get("/inventory"), api.get("/inventory/aggregated")])
      setItems(inventoryRes.data || [])
      setAggregatedItems(aggregatedRes.data || [])
      console.log("Inventory refreshed after menu add")

      alert("Menu item added successfully! Ingredients synced to inventory.")
    } catch (err) {
      console.error("Failed to add menu:", err)
      alert("Failed to add menu: " + err.message)
    }
  }

  const updateMenu = async (id, patch) => {
    try {
      console.log("Updating menu:", id, patch)
      const res = await api.put(`/menu/${id}`, patch)
      console.log("Menu updated successfully:", res.data)
      setMenus((s) => s.map((m) => (m._id === id ? res.data : m)))

      if (patch.ingredients) {
        const [inventoryRes, aggregatedRes] = await Promise.all([
          api.get("/inventory"),
          api.get("/inventory/aggregated"),
        ])
        setItems(inventoryRes.data || [])
        setAggregatedItems(aggregatedRes.data || [])
        console.log("Inventory refreshed after menu update")
        alert("Menu updated! Ingredients synced to inventory.")
      }
    } catch (err) {
      console.error("Failed to update menu:", err)
      alert("Failed to update menu: " + err.message)
    }
  }

  const deleteMenu = async (id) => {
    try {
      await api.del(`/menu/${id}`)
      setMenus((s) => s.filter((m) => m._id !== id))
    } catch (err) {
      console.error("Failed to delete menu:", err)
      alert("Failed to delete menu")
    }
  }

  const exportCSV = () => {
    const cols = ["name", "stock", "unit", "category", "supplier", "costPerUnit", "lowStockThreshold", "expiry"]
    const rows = [cols.join(",")]
    filteredItems.forEach((it) => {
      rows.push(
        [
          it.name ?? "",
          it.stock ?? 0,
          it.unit ?? "",
          it.category ?? "",
          it.supplier ?? "",
          it.costPerUnit ?? 0,
          it.lowStockThreshold ?? 0,
          it.expiry ?? "",
        ]
          .map((v) => `"${String(v).replace(/"/g, '""')}"`)
          .join(","),
      )
    })
    const blob = new Blob([rows.join("\n")], { type: "text/csv;charset=utf-8" })
    const a = document.createElement("a")
    a.href = URL.createObjectURL(blob)
    a.download = "inventory.csv"
    a.click()
    URL.revokeObjectURL(a.href)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-600">Loading...</div>
      </div>
    )
  }

  return (
    <div className="flex gap-4">
      <aside className="w-56 bg-white rounded shadow p-4">
        <h3 className="font-semibold mb-3">Inventory</h3>
        <nav className="flex flex-col gap-2">
          <button
            onClick={() => setActive("inventory")}
            className={`text-left px-2 py-2 rounded ${active === "inventory" ? "bg-slate-100" : ""}`}
          >
            Inventory
          </button>
          <button
            onClick={() => setActive("menu")}
            className={`text-left px-2 py-2 rounded ${active === "menu" ? "bg-slate-100" : ""}`}
          >
            Menu Management
          </button>
        </nav>
      </aside>

      <main className="flex-1">
        {active === "inventory" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <h2 className="text-lg font-semibold">Inventory</h2>
                <div className="flex gap-2">
                  <button
                    onClick={() => setViewMode("standard")}
                    className={`px-3 py-1 text-sm rounded ${
                      viewMode === "standard" ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-700"
                    }`}
                  >
                    Standard View
                  </button>
                  <button
                    onClick={() => setViewMode("aggregated")}
                    className={`px-3 py-1 text-sm rounded ${
                      viewMode === "aggregated" ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-700"
                    }`}
                  >
                    Aggregated View ({aggregatedItems.length})
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={exportCSV} className="px-3 py-2 border rounded">
                  Export CSV
                </button>
                <button onClick={() => setShowAdd(true)} className="px-3 py-2 bg-blue-600 text-white rounded">
                  Add Item
                </button>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <QuickStats items={items} />
            </div>

            <SearchFilters items={items} onChange={setFilters} />

            {viewMode === "aggregated" ? (
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="p-4 bg-blue-50 border-b">
                  <h3 className="font-semibold text-blue-900">Aggregated Ingredients from Menu Items</h3>
                  <p className="text-sm text-blue-700 mt-1">Shows total required quantities across all dishes</p>
                </div>
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold">Ingredient</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold">Total Required</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold">Current Stock</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold">Used In</th>
                    </tr>
                  </thead>
                  <tbody>
                    {aggregatedItems.map((item, idx) => (
                      <tr key={idx} className="border-b hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium">{item.name}</td>
                        <td className="px-4 py-3">
                          {item.totalRequired} {item.unit}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`px-2 py-1 rounded text-sm ${
                              item.currentStock < item.lowStockThreshold
                                ? "bg-red-100 text-red-800"
                                : "bg-green-100 text-green-800"
                            }`}
                          >
                            {item.currentStock} {item.unit}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {item.usedInDishes.map((d, i) => (
                            <div key={i} className="text-gray-600">
                              {d.dishName} ({d.quantity} {item.unit})
                            </div>
                          ))}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {aggregatedItems.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No ingredients found. Add menu items with ingredients to see them here.
                  </div>
                )}
              </div>
            ) : (
              <InventoryTable items={filteredItems} onEdit={updateItem} onDelete={deleteItem} />
            )}
          </div>
        )}

        {active === "menu" && (
          <MenuManagement
            items={items}
            menus={menus}
            onAddMenu={addMenu}
            onUpdateMenu={updateMenu}
            onDeleteMenu={deleteMenu}
          />
        )}

        <AddItemModal open={showAdd} onClose={() => setShowAdd(false)} onSave={addItem} />
      </main>
    </div>
  )
}
