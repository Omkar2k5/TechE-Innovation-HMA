import React, { useEffect, useState } from 'react'
import axios from 'axios'

export default function Inventory() {
  // Tab state
  const [activeTab, setActiveTab] = useState('ingredients') // 'ingredients' or 'dishes'
  
  // Ingredients state
  const [ingredients, setIngredients] = useState([])
  const [ingredientForm, setIngredientForm] = useState({ 
    name: '', 
    unit: 'grams', 
    category: 'other', 
    stock: 0,
    costPerUnit: 0,
    supplier: '',
    lowStockThreshold: 5
  })
  
  // Dishes state
  const [dishes, setDishes] = useState([])
  const [dishForm, setDishForm] = useState({
    name: '',
    description: '',
    price: 0,
    category: 'main',
    preparationTime: 15,
    ingredients: []
  })
  const [dishIngredient, setDishIngredient] = useState({ name: '', quantity: 0, unit: 'grams' })
  
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [successMsg, setSuccessMsg] = useState('')

  useEffect(() => { 
    fetchData() 
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('authToken')
      
      // Fetch menu data (includes both dishes and ingredients)
      const menuResponse = await axios.get(
        'http://localhost:5000/api/menu',
        { headers: { Authorization: `Bearer ${token}` } }
      )
      
      if (menuResponse.data.success) {
        setDishes(menuResponse.data.data.menuItems || [])
        setIngredients(menuResponse.data.data.savedIngredients || [])
        setError(null)
      }
    } catch (err) {
      console.error('Failed to fetch data:', err)
      setError(err.response?.data?.message || 'Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  // ============ INGREDIENT FUNCTIONS ============
  const submitIngredient = async () => {
    if (!ingredientForm.name.trim()) return alert('Ingredient name is required')
    
    try {
      const token = localStorage.getItem('authToken')
      const response = await axios.post(
        'http://localhost:5000/api/menu/ingredients',
        ingredientForm,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      
      if (response.data.success) {
        setIngredientForm({ 
          name: '', 
          unit: 'grams', 
          category: 'other', 
          stock: 0,
          costPerUnit: 0,
          supplier: '',
          lowStockThreshold: 5
        })
        setSuccessMsg('Ingredient added successfully!')
        setTimeout(() => setSuccessMsg(''), 3000)
        fetchData()
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
      fetchData()
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
      fetchData()
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete ingredient')
    }
  }

  // ============ DISH FUNCTIONS ============
  const addIngredientToDish = () => {
    if (!dishIngredient.name.trim() || dishIngredient.quantity <= 0) {
      return alert('Please enter valid ingredient name and quantity')
    }
    
    setDishForm(f => ({
      ...f,
      ingredients: [...f.ingredients, { ...dishIngredient }]
    }))
    setDishIngredient({ name: '', quantity: 0, unit: 'grams' })
  }

  const removeIngredientFromDish = (index) => {
    setDishForm(f => ({
      ...f,
      ingredients: f.ingredients.filter((_, i) => i !== index)
    }))
  }

  const submitDish = async () => {
    if (!dishForm.name.trim()) return alert('Dish name is required')
    if (dishForm.ingredients.length === 0) return alert('At least one ingredient is required')
    
    try {
      const token = localStorage.getItem('authToken')
      
      // Convert ingredients to the format expected by backend
      const ingredientsForBackend = dishForm.ingredients.map(ing => ing.name)
      
      const response = await axios.post(
        'http://localhost:5000/api/menu/items',
        {
          ...dishForm,
          ingredients: ingredientsForBackend
        },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      
      if (response.data.success) {
        setDishForm({
          name: '',
          description: '',
          price: 0,
          category: 'main',
          preparationTime: 15,
          ingredients: []
        })
        setSuccessMsg('Dish added successfully!')
        setTimeout(() => setSuccessMsg(''), 3000)
        fetchData()
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to add dish')
    }
  }

  const deleteDish = async (itemId, dishName) => {
    if (!confirm(`Are you sure you want to delete "${dishName}"?`)) return
    
    try {
      const token = localStorage.getItem('authToken')
      await axios.delete(
        `http://localhost:5000/api/menu/items/${itemId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      setSuccessMsg('Dish deleted successfully!')
      setTimeout(() => setSuccessMsg(''), 3000)
      fetchData()
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete dish')
    }
  }

  const toggleDishAvailability = async (itemId, currentStatus) => {
    try {
      const token = localStorage.getItem('authToken')
      await axios.put(
        `http://localhost:5000/api/menu/items/${itemId}`,
        { isAvailable: !currentStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      fetchData()
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update dish status')
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

  if (error && ingredients.length === 0 && dishes.length === 0) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
          <p className="text-red-800 font-medium">⚠️ {error}</p>
          <button 
            onClick={fetchData}
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
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">Inventory Management</h1>
            <p className="text-sm text-slate-500 mt-1">Manage dishes and ingredients</p>
          </div>
          <div className="flex gap-4">
            <div className="text-right">
              <div className="text-sm text-slate-600">Total Dishes</div>
              <div className="text-2xl font-bold text-blue-600">{dishes.length}</div>
            </div>
            <div className="text-right">
              <div className="text-sm text-slate-600">Total Ingredients</div>
              <div className="text-2xl font-bold text-green-600">{ingredients.length}</div>
            </div>
          </div>
        </div>

        {successMsg && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-6">
            <p className="text-green-800">✓ {successMsg}</p>
          </div>
        )}

        {/* Tabs */}
        <div className="mb-6">
          <div className="flex border-b border-slate-200">
            <button
              onClick={() => setActiveTab('dishes')}
              className={`px-6 py-3 font-medium ${
                activeTab === 'dishes'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-slate-600 hover:text-slate-800'
              }`}
            >
              Dishes ({dishes.length})
            </button>
            <button
              onClick={() => setActiveTab('ingredients')}
              className={`px-6 py-3 font-medium ${
                activeTab === 'ingredients'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-slate-600 hover:text-slate-800'
              }`}
            >
              Ingredients ({ingredients.length})
            </button>
          </div>
        </div>

        {/* DISHES TAB */}
        {activeTab === 'dishes' && (
          <>
            {/* Add New Dish Form */}
            <div className="bg-white p-6 rounded-lg shadow mb-6">
              <h2 className="font-semibold text-lg mb-4">Add New Dish</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <input 
                  value={dishForm.name} 
                  onChange={e=>setDishForm(f=>({...f,name:e.target.value}))} 
                  placeholder="Dish Name" 
                  className="p-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" 
                />
                <input 
                  value={dishForm.description} 
                  onChange={e=>setDishForm(f=>({...f,description:e.target.value}))} 
                  placeholder="Description" 
                  className="p-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" 
                />
                <input 
                  type="number"
                  value={dishForm.price} 
                  onChange={e=>setDishForm(f=>({...f,price:Number(e.target.value)}))} 
                  placeholder="Price" 
                  className="p-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" 
                />
                <select
                  value={dishForm.category} 
                  onChange={e=>setDishForm(f=>({...f,category:e.target.value}))} 
                  className="p-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="appetizer">Appetizer</option>
                  <option value="main">Main Course</option>
                  <option value="dessert">Dessert</option>
                  <option value="beverage">Beverage</option>
                  <option value="special">Special</option>
                </select>
                <input 
                  type="number"
                  value={dishForm.preparationTime} 
                  onChange={e=>setDishForm(f=>({...f,preparationTime:Number(e.target.value)}))} 
                  placeholder="Preparation Time (mins)" 
                  className="p-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" 
                />
              </div>

              {/* Ingredients for this dish */}
              <div className="border-t pt-4 mt-4">
                <h3 className="font-medium mb-3">Ingredients for this dish</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-3">
                  <input 
                    value={dishIngredient.name} 
                    onChange={e=>setDishIngredient(ing=>({...ing,name:e.target.value}))} 
                    placeholder="Ingredient Name" 
                    className="p-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" 
                  />
                  <input 
                    type="number"
                    value={dishIngredient.quantity} 
                    onChange={e=>setDishIngredient(ing=>({...ing,quantity:Number(e.target.value)}))} 
                    placeholder="Quantity" 
                    className="p-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" 
                  />
                  <select
                    value={dishIngredient.unit} 
                    onChange={e=>setDishIngredient(ing=>({...ing,unit:e.target.value}))} 
                    className="p-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="grams">Grams</option>
                    <option value="kg">Kilograms</option>
                    <option value="ml">Milliliters</option>
                    <option value="liters">Liters</option>
                    <option value="pcs">Pieces</option>
                  </select>
                  <button 
                    onClick={addIngredientToDish} 
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
                  >
                    Add Ingredient
                  </button>
                </div>

                {/* Display added ingredients */}
                {dishForm.ingredients.length > 0 && (
                  <div className="bg-slate-50 p-3 rounded-lg">
                    <p className="text-sm font-medium mb-2">Added Ingredients:</p>
                    <div className="space-y-1">
                      {dishForm.ingredients.map((ing, idx) => (
                        <div key={idx} className="flex items-center justify-between bg-white p-2 rounded">
                          <span className="text-sm">{ing.name} - {ing.quantity} {ing.unit}</span>
                          <button 
                            onClick={() => removeIngredientFromDish(idx)}
                            className="text-red-600 hover:text-red-800 text-sm font-medium"
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-4">
                <button 
                  onClick={submitDish} 
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                >
                  Add Dish
                </button>
              </div>
            </div>

            {/* Dishes List */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="font-semibold text-lg mb-4">Menu Dishes</h2>
              
              {dishes.length === 0 ? (
                <div className="text-center py-12 text-slate-500">
                  <p className="text-lg">No dishes added yet</p>
                  <p className="text-sm mt-2">Add your first dish above to get started</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {dishes.map((dish) => (
                    <div key={dish.itemId} className="border border-slate-200 rounded-lg p-4 hover:shadow-md transition">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg">{dish.name}</h3>
                          {dish.description && (
                            <p className="text-sm text-slate-600 mt-1">{dish.description}</p>
                          )}
                        </div>
                        <span className="text-lg font-bold text-green-600">₹{dish.price}</span>
                      </div>
                      
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full">
                          {dish.category}
                        </span>
                        <span className="text-xs px-2 py-1 bg-slate-100 text-slate-700 rounded-full">
                          {dish.preparationTime || 15} mins
                        </span>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          dish.isAvailable 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-red-100 text-red-700'
                        }`}>
                          {dish.isAvailable ? 'Available' : 'Unavailable'}
                        </span>
                      </div>

                      <div className="mb-3">
                        <p className="text-xs font-medium text-slate-600 mb-1">Ingredients:</p>
                        <div className="flex flex-wrap gap-1">
                          {(dish.ingredients || []).map((ing, idx) => (
                            <span key={idx} className="text-xs px-2 py-1 bg-slate-100 rounded">
                              {typeof ing === 'object' ? ing.name : ing}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <button 
                          onClick={() => toggleDishAvailability(dish.itemId, dish.isAvailable)}
                          className={`flex-1 px-3 py-2 text-sm rounded ${
                            dish.isAvailable
                              ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                              : 'bg-green-100 text-green-700 hover:bg-green-200'
                          }`}
                        >
                          {dish.isAvailable ? 'Mark Unavailable' : 'Mark Available'}
                        </button>
                        <button 
                          onClick={() => deleteDish(dish.itemId, dish.name)}
                          className="px-3 py-2 bg-red-500 text-white rounded hover:bg-red-600 text-sm"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {/* INGREDIENTS TAB */}
        {activeTab === 'ingredients' && (
          <>
            {/* Add New Ingredient Form */}
            <div className="bg-white p-6 rounded-lg shadow mb-6">
              <h2 className="font-semibold text-lg mb-4">Add New Ingredient</h2>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <input 
                  value={ingredientForm.name} 
                  onChange={e=>setIngredientForm(f=>({...f,name:e.target.value}))} 
                  placeholder="Ingredient Name" 
                  className="p-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" 
                />
                <select
                  value={ingredientForm.unit} 
                  onChange={e=>setIngredientForm(f=>({...f,unit:e.target.value}))} 
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
                  value={ingredientForm.category} 
                  onChange={e=>setIngredientForm(f=>({...f,category:e.target.value}))} 
                  className="p-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="other">Other</option>
                  <option value="vegetable">Vegetables</option>
                  <option value="spice">Spices</option>
                  <option value="dairy">Dairy</option>
                  <option value="meat">Meat</option>
                  <option value="grain">Grains</option>
                </select>
                <input 
                  type="number" 
                  value={ingredientForm.stock} 
                  onChange={e=>setIngredientForm(f=>({...f,stock:Number(e.target.value)}))} 
                  placeholder="Initial Stock" 
                  className="p-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" 
                />
              </div>
              <div className="mt-4">
                <button 
                  onClick={submitIngredient} 
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                >
                  Add Ingredient
                </button>
              </div>
            </div>

            {/* Ingredients List */}
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
                          <td className="p-3">{ing.unit || 'grams'}</td>
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
          </>
        )}
      </div>
    </div>
  )
}
