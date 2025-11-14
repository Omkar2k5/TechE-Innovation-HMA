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
        console.log('📥 Received menu data:', response.data.data)
        
        // Map savedIngredients to items format for inventory table
        const ingredients = (response.data.data.savedIngredients || []).map((ing, idx) => ({
          _id: ing._id || `ing_${idx}`,
          name: ing.name,
          unit: ing.unit || 'grams',
          category: ing.category || 'other',
          stock: ing.stock || 0,
          costPerUnit: ing.costPerUnit || 0,
          supplier: ing.supplier || '',
          lowStockThreshold: ing.lowStockThreshold || 5,
          isActive: ing.isActive !== false
        }))
        
        console.log('🔄 Mapped ingredients:', ingredients)
        
        // Map menuItems to menus format
        const menuItems = (response.data.data.menuItems || []).map(item => ({
          _id: item._id || item.itemId,
          itemId: item.itemId,
          name: item.name,
          description: item.description || '',
          price: item.price || 0,
          category: item.category || 'main',
          preparationTime: item.preparationTime || item.avgPrepTimeMins || 15,
          ingredients: item.ingredients || [],
          allergens: item.allergens || [],
          nutritionalInfo: item.nutritionalInfo || {},
          isAvailable: item.isAvailable !== false,
          createdAt: item.createdAt,
          updatedAt: item.updatedAt
        }))
        
        setItems(ingredients)
        setMenus(menuItems)
        setError(null)
      } else {
        setError(response.data.message || 'Failed to load menu data')
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
      console.log('Adding ingredient:', item)
      const token = localStorage.getItem('authToken')
      
      if (!token) {
        alert('No authentication token found. Please log in again.')
        return
      }
      
      const response = await axios.post(
        'http://localhost:5000/api/menu/ingredients',
        { 
          name: item.name, 
          category: item.category || 'other', 
          stock: item.stock || 0, 
          unit: item.unit || 'grams',
          costPerUnit: item.costPerUnit || 0,
          supplier: item.supplier || ''
        },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      
      console.log('Add ingredient response:', response.data)
      await fetchMenuData()
      alert('Ingredient added successfully!')
    } catch (err) {
      console.error('Add ingredient error:', err)
      const errorMsg = err.response?.data?.message || err.message || 'Failed to add ingredient'
      alert(`Error: ${errorMsg}`)
    }
  }
  
  const updateItem = async (itemId, patch) => {
    try {
      console.log('Updating ingredient:', { itemId, patch })
      const token = localStorage.getItem('authToken')
      
      if (!token) {
        alert('No authentication token found. Please log in again.')
        return
      }
      
      const item = items.find(i => i._id === itemId)
      if (!item) {
        alert('Item not found in local data')
        return
      }
      
      console.log('Found item to update:', item)
      
      const response = await axios.put(
        `http://localhost:5000/api/menu/ingredients/${encodeURIComponent(item.name)}/stock`,
        { stock: patch.stock },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      
      console.log('Update ingredient response:', response.data)
      await fetchMenuData()
      alert('Ingredient updated successfully!')
    } catch (err) {
      console.error('Update ingredient error:', err)
      const errorMsg = err.response?.data?.message || err.message || 'Failed to update ingredient'
      alert(`Error: ${errorMsg}`)
    }
  }
  
  const deleteItem = async (itemId) => {
    const item = items.find(i => i._id === itemId)
    if (!item) {
      alert('Item not found in local data')
      return
    }
    
    if (!confirm(`Delete ingredient "${item.name}"?`)) return
    
    try {
      console.log('Deleting ingredient:', item.name)
      const token = localStorage.getItem('authToken')
      
      if (!token) {
        alert('No authentication token found. Please log in again.')
        return
      }
      
      const response = await axios.delete(
        `http://localhost:5000/api/menu/ingredients/${encodeURIComponent(item.name)}`,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      
      console.log('Delete ingredient response:', response.data)
      await fetchMenuData()
      alert('Ingredient deleted successfully!')
    } catch (err) {
      console.error('Delete ingredient error:', err)
      const errorMsg = err.response?.data?.message || err.message || 'Failed to delete ingredient'
      alert(`Error: ${errorMsg}`)
    }
  }

  // Menu Item CRUD (for menuItems)
  const addMenu = async (menu) => {
    try {
      const token = localStorage.getItem('authToken')
      
      // Convert ingredients format from AddMenu component to API format
      const ingredientNames = (menu.ingredients || [])
        .filter(ing => ing && ing.name && ing.name.trim())
        .map(ing => ing.name.trim())
      
      await axios.post(
        'http://localhost:5000/api/menu/items',
        {
          name: menu.name,
          description: menu.description || '',
          price: menu.price || 0,
          category: menu.category || 'main',
          preparationTime: menu.preparationTime || 15,
          ingredients: ingredientNames,
          allergens: menu.allergens || [],
          nutritionalInfo: menu.nutritionalInfo || {}
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
      
      // Convert ingredients format if present
      const updateData = { ...patch }
      if (updateData.ingredients) {
        updateData.ingredients = updateData.ingredients
          .filter(ing => ing && ing.name && ing.name.trim())
          .map(ing => ing.name.trim())
      }
      
      await axios.put(
        `http://localhost:5000/api/menu/items/${itemId}`,
        updateData,
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
