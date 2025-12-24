import React, { useState } from 'react'

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
  Edit: ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
  ),
  Delete: ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
  ),
  Clock: ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="10"></circle>
      <polyline points="12,6 12,12 16,14"></polyline>
    </svg>
  ),
  DollarSign: ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <line x1="12" y1="1" x2="12" y2="23"></line>
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
    </svg>
  )
}

export default function ViewMenuItems({ 
  menus = [], 
  onEdit, 
  onDelete, 
  onAddNew,
  allIngredients = [],
  onDeleteIngredient,
  categoryFilter = 'all',
  onCategoryFilterChange
}) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null)
  const [sortBy, setSortBy] = useState('name') // name, price, category, prepTime
  const [viewMode, setViewMode] = useState('grid') // grid, list, table

  const confirmDelete = (id) => {
    onDelete(id)
    setShowDeleteConfirm(null)
  }

  // Category counts
  const categoryCounts = menus.reduce((acc, menu) => {
    acc[menu.category] = (acc[menu.category] || 0) + 1
    return acc
  }, {})

  // Filter and sort menus
  const filteredAndSortedMenus = menus
    .filter(menu => categoryFilter === 'all' || menu.category === categoryFilter)
    .sort((a, b) => {
      switch (sortBy) {
        case 'price':
          return (b.price || 0) - (a.price || 0)
        case 'category':
          return (a.category || '').localeCompare(b.category || '')
        case 'prepTime':
          return (a.preparationTime || 0) - (b.preparationTime || 0)
        default:
          return (a.name || '').localeCompare(b.name || '')
      }
    })

  const formatPrice = (price) => {
    return price > 0 ? `$${price.toFixed(2)}` : 'Free'
  }

  const formatIngredients = (ingredients) => {
    if (!ingredients || ingredients.length === 0) return 'No ingredients'
    return ingredients.map(ing => 
      typeof ing === 'string' ? ing : `${ing.name}${ing.quantity ? ` (${ing.quantity} ${ing.unit})` : ''}`
    ).join(', ')
  }

  const getCategoryColor = (category) => {
    const colors = {
      appetizer: 'bg-orange-100 text-orange-800 border-orange-200',
      main: 'bg-blue-100 text-blue-800 border-blue-200',
      dessert: 'bg-pink-100 text-pink-800 border-pink-200',
      beverage: 'bg-teal-100 text-teal-800 border-teal-200',
      special: 'bg-purple-100 text-purple-800 border-purple-200'
    }
    return colors[category] || 'bg-gray-100 text-gray-800 border-gray-200'
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Menu Items</h1>
          <p className="text-gray-600 mt-1">
            {filteredAndSortedMenus.length} of {menus.length} items
          </p>
        </div>
        
        {onAddNew && (
          <button
            onClick={onAddNew}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-md flex items-center gap-2"
          >
            <Icons.Plus className="w-5 h-5" />
            Add New Menu Item
          </button>
        )}
      </div>

      {/* Filters and Controls */}
      <div className="bg-white rounded-xl shadow-sm border p-6 mb-8">
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
          {/* Category Filter */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => onCategoryFilterChange('all')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                categoryFilter === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All ({menus.length})
            </button>
            {Object.entries(categoryCounts).map(([category, count]) => (
              <button
                key={category}
                onClick={() => onCategoryFilterChange(category)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors capitalize ${
                  categoryFilter === category
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {category} ({count})
              </button>
            ))}
          </div>

          {/* Sort and View Controls */}
          <div className="flex gap-4 items-center">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="name">Sort by Name</option>
              <option value="price">Sort by Price</option>
              <option value="category">Sort by Category</option>
              <option value="prepTime">Sort by Prep Time</option>
            </select>
            
            <div className="flex border border-gray-200 rounded-lg overflow-hidden">
              <button
                onClick={() => setViewMode('grid')}
                className={`px-3 py-2 ${viewMode === 'grid' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
              >
                Grid
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`px-3 py-2 border-l border-gray-200 ${viewMode === 'table' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
              >
                Table
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Menu Items */}
      {filteredAndSortedMenus.length === 0 ? (
        <div className="bg-white rounded-xl shadow-lg p-12 text-center">
          <Icons.Menu className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-medium text-gray-900 mb-2">
            {categoryFilter === 'all' ? 'No Menu Items' : `No ${categoryFilter} items`}
          </h3>
          <p className="text-gray-500 mb-6">
            {categoryFilter === 'all' 
              ? 'Start by adding your first menu item' 
              : `No items found in the ${categoryFilter} category`}
          </p>
          {onAddNew && categoryFilter === 'all' && (
            <button
              onClick={onAddNew}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-md"
            >
              Add Menu Item
            </button>
          )}
        </div>
      ) : (
        <>
          {/* Grid View */}
          {viewMode === 'grid' && (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredAndSortedMenus.map((menu) => (
                <div
                  key={menu.id}
                  className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-300 border border-gray-100"
                >
                  <div className="mb-4">
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="text-xl font-bold text-gray-900 leading-tight">{menu.name}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium border capitalize ${getCategoryColor(menu.category)}`}>
                        {menu.category}
                      </span>
                    </div>
                    
                    {menu.description && (
                      <p className="text-gray-600 text-sm mb-3 line-clamp-2">{menu.description}</p>
                    )}
                    
                    <div className="flex items-center gap-4 mb-3">
                      {menu.price > 0 && (
                        <div className="flex items-center gap-1 text-green-600">
                          <Icons.DollarSign className="w-4 h-4" />
                          <span className="font-semibold">{formatPrice(menu.price)}</span>
                        </div>
                      )}
                      
                      {menu.preparationTime && (
                        <div className="flex items-center gap-1 text-blue-600">
                          <Icons.Clock className="w-4 h-4" />
                          <span className="text-sm">{menu.preparationTime}min</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="text-sm text-gray-600">
                      <span className="font-medium">Ingredients:</span>
                      <div className="mt-2 flex flex-wrap gap-1">
                        {(menu.ingredients || []).slice(0, 6).map((ingredient, idx) => {
                          const ingredientName = typeof ingredient === 'string' ? ingredient : ingredient.name
                          return (
                            <span
                              key={idx}
                              className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium"
                            >
                              {ingredientName}
                            </span>
                          )
                        })}
                        {(menu.ingredients || []).length > 6 && (
                          <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">
                            +{(menu.ingredients || []).length - 6} more
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => onEdit(menu)}
                      className="flex-1 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors font-medium flex items-center justify-center gap-2"
                    >
                      <Icons.Edit className="w-4 h-4" />
                      Edit
                    </button>
                    <button
                      onClick={() => setShowDeleteConfirm(menu.id)}
                      className="flex-1 px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors font-medium flex items-center justify-center gap-2"
                    >
                      <Icons.Delete className="w-4 h-4" />
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Table View */}
          {viewMode === 'table' && (
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Prep Time</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ingredients</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredAndSortedMenus.map((menu) => (
                      <tr key={menu.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{menu.name}</div>
                            {menu.description && (
                              <div className="text-sm text-gray-500 truncate max-w-xs">{menu.description}</div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${getCategoryColor(menu.category)}`}>
                            {menu.category}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatPrice(menu.price)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {menu.preparationTime ? `${menu.preparationTime} min` : '-'}
                        </td>
                        <td className="px-6 py-4">
                          <div className="max-w-xs truncate text-sm text-gray-600">
                            {formatIngredients(menu.ingredients)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => onEdit(menu)}
                            className="text-blue-600 hover:text-blue-900 mr-3"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => setShowDeleteConfirm(menu.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* Global Ingredients Summary */}
      {allIngredients.length > 0 && (
        <div className="mt-12 bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            All Saved Ingredients ({allIngredients.length})
          </h3>
          <div className="flex flex-wrap gap-2">
            {allIngredients.map((ingredient, idx) => (
              <div key={idx} className="flex items-center gap-2 px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm font-medium">
                <span>{ingredient}</span>
                {onDeleteIngredient && (
                  <button
                    onClick={() => onDeleteIngredient(ingredient)}
                    className="text-red-500 hover:text-red-700 ml-1"
                    title="Remove ingredient"
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Confirm Delete</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this menu item? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => confirmDelete(showDeleteConfirm)}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}