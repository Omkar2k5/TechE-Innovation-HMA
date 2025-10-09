import React, { useState, useEffect } from 'react'
import api from '../../lib/api'
import suggestIngredientsAPI from '../../lib/suggestIngredients'

// Icon Components
const Icons = {
  Plus: ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <line x1="12" y1="5" x2="12" y2="19"></line>
      <line x1="5" y1="12" x2="19" y2="12"></line>
    </svg>
  ),
  Menu: ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path>
    </svg>
  ),
  Back: ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
    </svg>
  ),
  Close: ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  )
}

// AddMenuForm Component
const AddMenuForm = ({ initialMenu = null, onSave, onCancel, allIngredients = [] }) => {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState('')
  const [category, setCategory] = useState('main')
  const [preparationTime, setPreparationTime] = useState('')
  const [ingredients, setIngredients] = useState([])
  const [loading, setLoading] = useState(false)
  const [showIngredientDropdown, setShowIngredientDropdown] = useState(false)

  useEffect(() => {
    if (initialMenu) {
      setName(initialMenu.name || '')
      setDescription(initialMenu.description || '')
      setPrice(initialMenu.price || '')
      setCategory(initialMenu.category || 'main')
      setPreparationTime(initialMenu.preparationTime || '')
      // Handle both string[] and object[] ingredients
      const normalizedIngredients = (initialMenu.ingredients || []).map((ing) =>
        typeof ing === 'string'
          ? { name: ing, quantity: '', unit: 'grams' }
          : { name: ing.name || '', quantity: ing.quantity || '', unit: ing.unit || 'grams' }
      )
      setIngredients(normalizedIngredients)
    } else {
      resetForm()
    }
  }, [initialMenu])

  const resetForm = () => {
    setName('')
    setDescription('')
    setPrice('')
    setCategory('main')
    setPreparationTime('')
    setIngredients([])
  }

  const onSuggest = async () => {
    if (!name.trim()) return
    setLoading(true)
    try {
      const res = await suggestIngredientsAPI(name)
      if (res && Array.isArray(res.ingredients)) {
        const suggestedIngredients = res.ingredients.map((ing) => ({
          name: ing,
          quantity: '',
          unit: 'grams'
        }))
        setIngredients(suggestedIngredients)
      }
    } catch (error) {
      console.error('Error getting suggestions:', error)
    } finally {
      setLoading(false)
    }
  }

  const addIngredient = () => {
    setIngredients(prev => [...prev, { name: '', quantity: '', unit: 'grams' }])
  }

  const updateIngredient = (index, field, value) => {
    setIngredients(prev => prev.map((ing, i) => 
      i === index ? { ...ing, [field]: value } : ing
    ))
  }

  const removeIngredient = (index) => {
    setIngredients(prev => prev.filter((_, i) => i !== index))
  }

  const addFromSaved = (savedIngredient) => {
    if (!savedIngredient) return
    const exists = ingredients.find(ing => 
      ing.name.toLowerCase() === savedIngredient.toLowerCase()
    )
    if (!exists) {
      setIngredients(prev => [...prev, {
        name: savedIngredient,
        quantity: '',
        unit: 'grams'
      }])
    }
    setShowIngredientDropdown(false)
  }

  const submit = () => {
    if (!name.trim()) {
      alert('Please enter a menu name')
      return
    }

    const cleanedIngredients = ingredients
      .filter(ing => ing.name.trim())
      .map(ing => ({
        name: ing.name.trim(),
        quantity: ing.quantity === '' ? 0 : Number(ing.quantity),
        unit: ing.unit || 'grams'
      }))

    if (cleanedIngredients.length === 0) {
      alert('Please add at least one ingredient')
      return
    }

    onSave({
      id: initialMenu?.id,
      name: name.trim(),
      description: description.trim(),
      ingredients: cleanedIngredients,
      price: price ? Number(price) : 0,
      category: category,
      preparationTime: preparationTime ? Number(preparationTime) : 15
    })
  }

  const cancel = () => {
    resetForm()
    onCancel()
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">
        {initialMenu ? 'Edit Menu Item' : 'Add New Menu Item'}
      </h1>
      
      <div className="bg-white rounded-xl shadow-lg p-8">
        <div className="space-y-6">
          {/* Menu Name and Description */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Menu Name *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                placeholder="Enter dish name..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              >
                <option value="appetizer">Appetizer</option>
                <option value="main">Main Course</option>
                <option value="dessert">Dessert</option>
                <option value="beverage">Beverage</option>
                <option value="special">Special</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows="3"
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              placeholder="Enter dish description..."
            />
          </div>

          {/* Price and Preparation Time */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Price ($)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Preparation Time (minutes)
              </label>
              <input
                type="number"
                min="1"
                value={preparationTime}
                onChange={(e) => setPreparationTime(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                placeholder="15"
              />
            </div>
          </div>

          {/* AI Suggestions & Add Ingredient */}
          <div className="flex flex-wrap gap-4 items-center">
            <button
              onClick={onSuggest}
              disabled={loading || !name.trim()}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium shadow-md"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Suggesting...
                </span>
              ) : 'AI Suggest Ingredients'}
            </button>
            
            <button
              onClick={addIngredient}
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium shadow-md"
            >
              Add Ingredient
            </button>

            {/* Saved Ingredients Dropdown */}
            {allIngredients.length > 0 && (
              <div className="relative">
                <button
                  onClick={() => setShowIngredientDropdown(!showIngredientDropdown)}
                  className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium shadow-md"
                >
                  Saved Ingredients ({allIngredients.length})
                </button>
                
                {showIngredientDropdown && (
                  <div className="absolute top-full left-0 mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto">
                    {allIngredients.map((ing, idx) => (
                      <button
                        key={idx}
                        onClick={() => addFromSaved(ing)}
                        className="w-full text-left px-4 py-2 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0"
                      >
                        {ing}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Ingredients List */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Ingredients *
            </label>
            <div className="space-y-3">
              {ingredients.map((ing, idx) => (
                <div key={idx} className="grid grid-cols-12 gap-3 items-center">
                  <div className="col-span-6">
                    <input
                      list="ingredient-names"
                      value={ing.name}
                      onChange={(e) => updateIngredient(idx, 'name', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                      placeholder="Ingredient name"
                    />
                  </div>
                  <div className="col-span-3">
                    <input
                      type="number"
                      step="any"
                      min="0"
                      value={ing.quantity}
                      onChange={(e) => updateIngredient(idx, 'quantity', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                      placeholder="Qty"
                    />
                  </div>
                  <div className="col-span-2">
                    <select
                      value={ing.unit}
                      onChange={(e) => updateIngredient(idx, 'unit', e.target.value)}
                      className="w-full px-2 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    >
                      <option value="grams">grams</option>
                      <option value="ml">ml</option>
                      <option value="pieces">pieces</option>
                      <option value="tbsp">tbsp</option>
                      <option value="tsp">tsp</option>
                      <option value="cups">cups</option>
                      <option value="kg">kg</option>
                      <option value="liters">liters</option>
                    </select>
                  </div>
                  <div className="col-span-1">
                    <button
                      onClick={() => removeIngredient(idx)}
                      className="px-2 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors shadow-md"
                      title="Remove ingredient"
                    >
                      ×
                    </button>
                  </div>
                </div>
              ))}

              <datalist id="ingredient-names">
                {allIngredients.map((ingredient, i) => (
                  <option key={i} value={ingredient} />
                ))}
              </datalist>

              {ingredients.length === 0 && (
                <div className="text-gray-500 text-center py-8 border-2 border-dashed border-gray-200 rounded-lg">
                  No ingredients added yet. Use AI suggestions or add manually.
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-4 pt-6 border-t border-gray-200">
            <button
              onClick={cancel}
              className="px-8 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              onClick={submit}
              className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-md"
            >
              {initialMenu ? 'Update Menu' : 'Save Menu'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

import ViewMenuItems from './ViewMenuItems.jsx'

export default function MenuManagement() {
  const [active, setActive] = useState('landing')
  const [menus, setMenus] = useState([])
  const [allIngredients, setAllIngredients] = useState([])
  const [editing, setEditing] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [categoryFilter, setCategoryFilter] = useState('all')

  // Fetch menu data on component mount
  useEffect(() => {
    fetchMenuData()
  }, [])

  const fetchMenuData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await api.get('/menu')
      
      if (response && response.success) {
        const data = response.data
        // Convert backend format to frontend format with comprehensive data
        const formattedMenus = data.menuItems.map(item => ({
          id: item._id || item.itemId,
          name: item.name,
          description: item.description || '',
          ingredients: item.ingredients || [],
          price: item.price || 0,
          category: item.category || 'main',
          preparationTime: item.preparationTime || 15,
          allergens: item.allergens || [],
          nutritionalInfo: item.nutritionalInfo || {},
          isAvailable: item.isAvailable !== false
        }))
        
        setMenus(formattedMenus)
        setAllIngredients(data.savedIngredients.map(ing => ing.name) || [])
      } else {
        setError('Failed to load menu data')
      }
    } catch (err) {
      console.error('Error fetching menu:', err)
      setError('Failed to connect to server')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async (menu) => {
    try {
      setError(null)
      
      let response
      if (menu.id) {
        // Update existing menu item
        response = await api.put(`/menu/items/${menu.id}`, {
          name: menu.name,
          description: menu.description,
          ingredients: menu.ingredients,
          price: menu.price,
          category: menu.category,
          preparationTime: menu.preparationTime,
          allergens: menu.allergens,
          nutritionalInfo: menu.nutritionalInfo
        })
      } else {
        // Create new menu item
        response = await api.post('/menu/items', {
          name: menu.name,
          description: menu.description,
          ingredients: menu.ingredients,
          price: menu.price,
          category: menu.category,
          preparationTime: menu.preparationTime,
          allergens: menu.allergens,
          nutritionalInfo: menu.nutritionalInfo
        })
      }
      
      if (response && response.success) {
        // Refresh the menu data to get updated state
        await fetchMenuData()
        
        setEditing(null)
        setActive('landing')
      } else {
        setError(response?.message || 'Failed to save menu item')
      }
    } catch (err) {
      console.error('Error saving menu:', err)
      setError('Failed to save menu item')
    }
  }

  const handleEdit = (m) => {
    setEditing(m)
    setActive('add')
  }

  const handleDelete = async (id) => {
    try {
      setError(null)
      
      const response = await api.delete(`/menu/items/${id}`)
      
      if (response && response.success) {
        // Refresh the menu data to get updated state
        await fetchMenuData()
      } else {
        setError(response?.message || 'Failed to delete menu item')
      }
    } catch (err) {
      console.error('Error deleting menu:', err)
      setError('Failed to delete menu item')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading menu...</p>
        </div>
      </div>
    )
  }

  const handleDeleteIngredient = async (ingredientName) => {
    try {
      setError(null)
      
      const response = await api.delete(`/menu/ingredients/${encodeURIComponent(ingredientName)}`)
      
      if (response && response.success) {
        // Refresh the menu data to get updated state
        await fetchMenuData()
      } else {
        setError(response?.message || 'Failed to delete ingredient')
      }
    } catch (err) {
      console.error('Error deleting ingredient:', err)
      setError('Failed to delete ingredient')
    }
  }

  return (
    <div className="space-y-6">
      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
          <div className="flex items-center justify-between">
            <span>{error}</span>
            <button 
              onClick={() => setError(null)}
              className="ml-4 text-red-400 hover:text-red-600"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Menu Management</h1>
          <p className="text-slate-600 mt-1">Manage restaurant menu items and ingredients</p>
        </div>
        
        {/* Navigation Breadcrumbs */}
        {active !== 'landing' && (
          <button
            onClick={() => { setEditing(null); setActive('landing') }}
            className="px-4 py-2 bg-slate-600 text-white rounded-md hover:bg-slate-700 transition-colors flex items-center"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Dashboard
          </button>
        )}
      </div>

      {/* Main Content */}
      <div className="bg-white rounded-lg shadow-sm">
        {active === 'landing' && (
          <div className="p-8">
            <div className="max-w-4xl mx-auto">
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
                  <div className="text-3xl font-bold text-blue-700 mb-2">{menus.length}</div>
                  <div className="text-blue-600 font-medium">Menu Items</div>
                </div>
                <div className="bg-green-50 rounded-lg p-6 border border-green-200">
                  <div className="text-3xl font-bold text-green-700 mb-2">{allIngredients.length}</div>
                  <div className="text-green-600 font-medium">Saved Ingredients</div>
                </div>
                <div className="bg-purple-50 rounded-lg p-6 border border-purple-200">
                  <div className="text-3xl font-bold text-purple-700 mb-2">
                    {menus.reduce((acc, menu) => acc + (menu.ingredients?.length || 0), 0)}
                  </div>
                  <div className="text-purple-600 font-medium">Total Ingredients</div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <button
                  onClick={() => { setEditing(null); setActive('add') }}
                  className="group bg-white border-2 border-dashed border-gray-300 rounded-lg p-8 hover:border-blue-500 hover:bg-blue-50 transition-all duration-200"
                >
                  <div className="text-center">
                    <svg className="mx-auto h-12 w-12 text-gray-400 group-hover:text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    <h3 className="mt-4 text-lg font-medium text-gray-900 group-hover:text-blue-600">Add New Menu Item</h3>
                    <p className="mt-2 text-sm text-gray-500">Create a new menu item with ingredients</p>
                  </div>
                </button>

                <button
                  onClick={() => setActive('view')}
                  className="group bg-white border-2 border-dashed border-gray-300 rounded-lg p-8 hover:border-green-500 hover:bg-green-50 transition-all duration-200"
                >
                  <div className="text-center">
                    <svg className="mx-auto h-12 w-12 text-gray-400 group-hover:text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    <h3 className="mt-4 text-lg font-medium text-gray-900 group-hover:text-green-600">View All Menus</h3>
                    <p className="mt-2 text-sm text-gray-500">Browse, edit, and manage existing menu items</p>
                  </div>
                </button>
              </div>

              {/* Recent Menus */}
              {menus.length > 0 && (
                <div className="mt-8">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Menu Items</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {menus.slice(-6).map((menu) => (
                      <div key={menu.id} className="bg-gray-50 rounded-lg p-4 border">
                        <h4 className="font-medium text-gray-900 mb-2">{menu.name}</h4>
                        <p className="text-sm text-gray-600 mb-3">
                          {menu.ingredients?.length || 0} ingredients
                        </p>
                        <button
                          onClick={() => handleEdit(menu)}
                          className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                        >
                          Edit →
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {active === 'add' && (
          <AddMenuForm
            initialMenu={editing}
            onSave={handleSave}
            onCancel={() => { setEditing(null); setActive('landing') }}
            allIngredients={allIngredients}
          />
        )}

        {active === 'view' && (
          <ViewMenuItems
            menus={menus}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onAddNew={() => { setEditing(null); setActive('add') }}
            allIngredients={allIngredients}
            onDeleteIngredient={handleDeleteIngredient}
            categoryFilter={categoryFilter}
            onCategoryFilterChange={setCategoryFilter}
          />
        )}
      </div>
    </div>
  )
}