import React, { useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import QuickStats from './QuickStats.jsx'
import SearchFilters from './SearchFilters.jsx'
import InventoryTable from './InventoryTable.jsx'
import AddItemModal from './AddItemModal.jsx'
import MenuManagement from './MenuManagement.jsx'

export default function InventoryDashboard(){
  const [items, setItems] = useState([]) // savedIngredients from menu collection
  const [menus, setMenus] = useState([]) // menuItems from menu collection
  const [active, setActive] = useState('inventory')
  const [filters, setFilters] = useState({ category: '', supplier: '' })
  const [showAdd, setShowAdd] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(()=>{
    fetchMenuData()
  }, [])

  const fetchMenuData = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('authToken')
      const response = await axios.get(
        'http://localhost:5000/api/menu',
        { headers: { Authorization: `Bearer ${token}` } }
      )
      
      if (response.data.success) {
        // Map savedIngredients to items format for inventory table
        const ingredients = (response.data.data.savedIngredients || []).map((ing, idx) => ({
          _id: ing._id || `ing_${idx}`,
          name: ing.name,
          unit: ing.unit || 'grams',
          category: ing.category || 'other',
          stock: ing.stock || 0,
          isActive: ing.isActive
        }))
        
        // Map menuItems to menus format
        const menuItems = (response.data.data.menuItems || []).map(item => ({
          _id: item._id,
          name: item.name,
          price: item.price || 0,
          category: item.category,
          avgPrepTimeMins: item.avgPrepTimeMins,
          ingredients: item.ingredients || [],
          active: item.active
        }))
        
        setItems(ingredients)
        setMenus(menuItems)
        setError(null)
      }
    } catch (err) {
      console.error('Failed to fetch menu data:', err)
      setError(err.response?.data?.message || 'Failed to load menu data')
    } finally {
      setLoading(false)
    }
  }

  const filteredItems = useMemo(()=>{
    return items.filter(it => {
      if (filters.category && it.category !== filters.category) return false
      if (filters.supplier && it.supplier !== filters.supplier) return false
      return true
    })
  }, [items, filters])

  // Ingredient/Item CRUD (for savedIngredients)
  const addItem = async (item) => {
    try {
      const token = localStorage.getItem('authToken')
      await axios.post(
        'http://localhost:5000/api/menu/ingredients',
        { name: item.name, category: item.category, stock: item.stock, unit: item.unit },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      fetchMenuData()
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to add ingredient')
    }
  }
  
  const updateItem = async (name, patch) => {
    try {
      const token = localStorage.getItem('authToken')
      await axios.put(
        `http://localhost:5000/api/menu/ingredients/${encodeURIComponent(name)}/stock`,
        { stock: patch.stock },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      fetchMenuData()
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update ingredient')
    }
  }
  
  const deleteItem = async (name) => {
    if (!confirm(`Delete ingredient "${name}"?`)) return
    try {
      const token = localStorage.getItem('authToken')
      await axios.delete(
        `http://localhost:5000/api/menu/ingredients/${encodeURIComponent(name)}`,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      fetchMenuData()
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete ingredient')
    }
  }

  // Menu Item CRUD (for menuItems)
  const addMenu = async (menu) => {
    try {
      const token = localStorage.getItem('authToken')
      await axios.post(
        'http://localhost:5000/api/menu/items',
        {
          name: menu.name,
          price: menu.price || 0,
          category: menu.category || 'Main Course',
          avgPrepTimeMins: menu.avgPrepTimeMins || 15,
          ingredients: menu.ingredients || []
        },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      fetchMenuData()
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to add menu item')
    }
  }
  
  const updateMenu = async (itemId, patch) => {
    try {
      const token = localStorage.getItem('authToken')
      await axios.put(
        `http://localhost:5000/api/menu/items/${itemId}`,
        patch,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      fetchMenuData()
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update menu item')
    }
  }
  
  const deleteMenu = async (itemId) => {
    if (!confirm('Delete this menu item?')) return
    try {
      const token = localStorage.getItem('authToken')
      await axios.delete(
        `http://localhost:5000/api/menu/items/${itemId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      fetchMenuData()
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete menu item')
    }
  }

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading menu data...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
          <p className="text-red-800 font-medium">⚠️ {error}</p>
          <button 
            onClick={fetchMenuData}
            className="mt-3 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

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
