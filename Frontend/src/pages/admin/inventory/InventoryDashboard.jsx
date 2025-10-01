import React, { useEffect, useMemo, useState } from 'react'
import QuickStats from './QuickStats.jsx'
import SearchFilters from './SearchFilters.jsx'
import InventoryTable from './InventoryTable.jsx'
import AddItemModal from './AddItemModal.jsx'
import MenuManagement from './MenuManagement.jsx'

export default function InventoryDashboard(){
  // minimal dummy data (in-memory)
  const [items, setItems] = useState([])
  const [menus, setMenus] = useState([])
  const [active, setActive] = useState('inventory')
  const [filters, setFilters] = useState({ category: '', supplier: '' })
  const [showAdd, setShowAdd] = useState(false)

  useEffect(()=>{
    // seed some demo data
    setItems([
      { _id: 'i1', name: 'Tomato', unit: 'kg', category: 'Vegetable', supplier: 'Local Farm', costPerUnit: 1.5, stock: 20, lowStockThreshold: 5, expiry: null },
      { _id: 'i2', name: 'Paneer', unit: 'kg', category: 'Dairy', supplier: 'Dairy Co', costPerUnit: 4.0, stock: 8, lowStockThreshold: 3, expiry: null },
      { _id: 'i3', name: 'Sugar', unit: 'kg', category: 'Grocery', supplier: 'Sugar Mill', costPerUnit: 0.8, stock: 50, lowStockThreshold: 10, expiry: null }
    ])

    setMenus([
      { _id: 'm1', name: 'Paneer Butter Masala', price: 8.5, ingredients: [ { id: 'i2', name: 'Paneer', qty: 0.2, unit: 'kg' }, { id: 'i1', name: 'Tomato', qty: 0.15, unit: 'kg' } ] }
    ])
  }, [])

  const filteredItems = useMemo(()=>{
    return items.filter(it => {
      if (filters.category && it.category !== filters.category) return false
      if (filters.supplier && it.supplier !== filters.supplier) return false
      return true
    })
  }, [items, filters])

  const addItem = (item) => setItems(s => [{ ...item, _id: 'i' + Math.random().toString(36).slice(2,9) }, ...s])
  const updateItem = (id, patch) => setItems(s => s.map(it => it._id === id ? { ...it, ...patch } : it))
  const deleteItem = (id) => setItems(s => s.filter(it => it._id !== id))

  const addMenu = (menu) => setMenus(s => [{ ...menu, _id: 'm' + Math.random().toString(36).slice(2,9) }, ...s])
  const updateMenu = (id, patch) => setMenus(s => s.map(m => m._id === id ? { ...m, ...patch } : m))
  const deleteMenu = (id) => setMenus(s => s.filter(m => m._id !== id))

  return (
    <div className="flex gap-4">
      <aside className="w-56 bg-white rounded shadow p-4">
        <h3 className="font-semibold mb-3">Inventory</h3>
        <nav className="flex flex-col gap-2">
          <button onClick={()=>setActive('inventory')} className={`text-left px-2 py-2 rounded ${active==='inventory'?'bg-slate-100':''}`}>Inventory</button>
          <button onClick={()=>setActive('menu')} className={`text-left px-2 py-2 rounded ${active==='menu'?'bg-slate-100':''}`}>Menu Management</button>
        </nav>
      </aside>

      <main className="flex-1">
        {active === 'inventory' && (
          <div>
            <div className="mb-4 flex justify-between">
              <h2 className="text-xl font-semibold">Inventory</h2>
              <button onClick={()=>setShowAdd(true)} className="px-3 py-2 bg-blue-600 text-white rounded">Add Item</button>
            </div>
            <SearchFilters items={items} onChange={setFilters} />
            <InventoryTable items={filteredItems} onEdit={updateItem} onDelete={deleteItem} />
          </div>
        )}

        {active === 'menu' && (
          <MenuManagement items={items} menus={menus} onAddMenu={addMenu} onUpdateMenu={updateMenu} onDeleteMenu={deleteMenu} />
        )}

        <AddItemModal open={showAdd} onClose={()=>setShowAdd(false)} onSave={addItem} />
      </main>
    </div>
  )
}
