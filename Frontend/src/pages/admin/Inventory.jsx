import React, { useEffect, useState } from 'react'
import axios from 'axios'

export default function Inventory() {
  const [ingredients, setIngredients] = useState([])
  const [form, setForm] = useState({ name: '', unit: 'grams', category: 'other', stock: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [successMsg, setSuccessMsg] = useState('')

  useEffect(() => { 
    fetchIngredients() 
  }, [])

  const fetchIngredients = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('authToken')
      const response = await axios.get(
        'http://localhost:5000/api/menu/ingredients',
        { headers: { Authorization: `Bearer ${token}` } }
      )
      
      if (response.data.success) {
        setIngredients(response.data.data.ingredients || [])
        setError(null)
      }
    } catch (err) {
      console.error('Failed to fetch ingredients:', err)
      setError(err.response?.data?.message || 'Failed to load ingredients')
    } finally {
      setLoading(false)
    }
  }

  const submit = async () => {
    if (!form.name.trim()) return alert('Ingredient name is required')
    
    try {
      const token = localStorage.getItem('authToken')
      const response = await axios.post(
        'http://localhost:5000/api/menu/ingredients',
        form,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      
      if (response.data.success) {
        setForm({ name: '', unit: 'grams', category: 'other', stock: 0 })
        setSuccessMsg('Ingredient added successfully!')
        setTimeout(() => setSuccessMsg(''), 3000)
        fetchIngredients()
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to add ingredient')
    }
  }

  const adjustStock = async (ingredientName, adjustment) => {
    try {
      const token = localStorage.getItem('authToken')
      await axios.put(
        `http://localhost:5000/api/menu/ingredients/${encodeURIComponent(ingredientName)}/stock`,
        { adjustment },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      fetchIngredients()
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update stock')
    }
  }

  const deleteIngredient = async (ingredientName) => {
    if (!confirm(`Are you sure you want to delete "${ingredientName}"?`)) return
    
    try {
      const token = localStorage.getItem('authToken')
      await axios.delete(
        `http://localhost:5000/api/menu/ingredients/${encodeURIComponent(ingredientName)}`,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      fetchIngredients()
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete ingredient')
    }
  }

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading inventory...</p>
        </div>
      </div>
    )
  }

  if (error && ingredients.length === 0) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
          <p className="text-red-800 font-medium">⚠️ {error}</p>
          <button 
            onClick={fetchIngredients}
            className="mt-3 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">Inventory Management</h1>
            <p className="text-sm text-slate-500 mt-1">Manage ingredients and stock levels</p>
          </div>
          <div className="text-right">
            <div className="text-sm text-slate-600">Total Ingredients</div>
            <div className="text-2xl font-bold text-blue-600">{ingredients.length}</div>
          </div>
        </div>

        {successMsg && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-6">
            <p className="text-green-800">✓ {successMsg}</p>
          </div>
        )}

        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h2 className="font-semibold text-lg mb-4">Add New Ingredient</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <input 
              value={form.name} 
              onChange={e=>setForm(f=>({...f,name:e.target.value}))} 
              placeholder="Ingredient Name" 
              className="p-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" 
            />
            <select
              value={form.unit} 
              onChange={e=>setForm(f=>({...f,unit:e.target.value}))} 
              className="p-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="grams">Grams</option>
              <option value="kg">Kilograms</option>
              <option value="ml">Milliliters</option>
              <option value="liters">Liters</option>
              <option value="pcs">Pieces</option>
              <option value="cups">Cups</option>
            </select>
            <select
              value={form.category} 
              onChange={e=>setForm(f=>({...f,category:e.target.value}))} 
              className="p-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="other">Other</option>
              <option value="vegetables">Vegetables</option>
              <option value="spices">Spices</option>
              <option value="dairy">Dairy</option>
              <option value="meat">Meat</option>
              <option value="grains">Grains</option>
            </select>
            <input 
              type="number" 
              value={form.stock} 
              onChange={e=>setForm(f=>({...f,stock:Number(e.target.value)}))} 
              placeholder="Initial Stock" 
              className="p-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" 
            />
          </div>
          <div className="mt-4">
            <button 
              onClick={submit} 
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
            >
              Add Ingredient
            </button>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="font-semibold text-lg mb-4">Current Stock</h2>
          
          {ingredients.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <p className="text-lg">No ingredients added yet</p>
              <p className="text-sm mt-2">Add your first ingredient above to get started</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="text-left p-3 font-semibold text-slate-700">Ingredient</th>
                    <th className="text-left p-3 font-semibold text-slate-700">Category</th>
                    <th className="text-center p-3 font-semibold text-slate-700">Stock</th>
                    <th className="text-left p-3 font-semibold text-slate-700">Unit</th>
                    <th className="text-center p-3 font-semibold text-slate-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {ingredients.map((ing, idx) => (
                    <tr key={idx} className="border-t border-slate-200 hover:bg-slate-50">
                      <td className="p-3 font-medium">{ing.name}</td>
                      <td className="p-3">
                        <span className="text-xs px-2 py-1 bg-slate-100 rounded-full text-slate-700">
                          {ing.category}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <span className={`font-semibold ${
                          (ing.stock || 0) < 50 ? 'text-red-600' : 
                          (ing.stock || 0) < 100 ? 'text-yellow-600' : 
                          'text-green-600'
                        }`}>
                          {ing.stock || 0}
                        </span>
                      </td>
                      <td className="p-3">{ing.unit}</td>
                      <td className="p-3">
                        <div className="flex items-center justify-center gap-2">
                          <button 
                            onClick={()=>adjustStock(ing.name, -10)} 
                            className="px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 text-sm font-medium"
                          >
                            -10
                          </button>
                          <button 
                            onClick={()=>adjustStock(ing.name, -1)} 
                            className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded hover:bg-yellow-200 text-sm font-medium"
                          >
                            -1
                          </button>
                          <button 
                            onClick={()=>adjustStock(ing.name, 1)} 
                            className="px-3 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200 text-sm font-medium"
                          >
                            +1
                          </button>
                          <button 
                            onClick={()=>adjustStock(ing.name, 10)} 
                            className="px-3 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200 text-sm font-medium"
                          >
                            +10
                          </button>
                          <button 
                            onClick={()=>deleteIngredient(ing.name)} 
                            className="ml-2 px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-sm font-medium"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
