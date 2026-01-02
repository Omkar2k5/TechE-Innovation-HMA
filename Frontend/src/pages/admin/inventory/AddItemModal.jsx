import React, { useState } from 'react'

export default function AddItemModal({ open = false, onClose, onSave }) {
  const [form, setForm] = useState({ name: '', unit: 'grams', category: 'other', supplier: '', costPerUnit: 0, stock: 0 })
  if (!open) return null
  const save = () => {
    if (!form.name.trim()) {
      alert('Please enter ingredient name')
      return
    }
    onSave && onSave(form);
    onClose && onClose();
    setForm({ name: '', unit: 'grams', category: 'other', supplier: '', costPerUnit: 0, stock: 0 })
  }

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg w-[500px] max-h-[90vh] overflow-y-auto">
        <h3 className="font-semibold text-xl mb-4">Add New Ingredient</h3>

        {/* Ingredient Name */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Ingredient Name <span className="text-red-500">*</span>
          </label>
          <input
            placeholder="e.g., Tomatoes, Chicken, Rice"
            value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            className="p-2 border border-gray-300 rounded w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Category and Unit */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select
              value={form.category}
              onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
              className="p-2 border border-gray-300 rounded w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="other">Other</option>
              <option value="vegetable">Vegetable</option>
              <option value="meat">Meat</option>
              <option value="dairy">Dairy</option>
              <option value="spice">Spice</option>
              <option value="grain">Grain</option>
              <option value="sauce">Sauce</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Unit of Measurement</label>
            <select
              value={form.unit}
              onChange={e => setForm(f => ({ ...f, unit: e.target.value }))}
              className="p-2 border border-gray-300 rounded w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="grams">Grams (g)</option>
              <option value="kg">Kilograms (kg)</option>
              <option value="ml">Milliliters (ml)</option>
              <option value="liters">Liters (L)</option>
              <option value="pieces">Pieces (pcs)</option>
              <option value="tbsp">Tablespoons (tbsp)</option>
              <option value="tsp">Teaspoons (tsp)</option>
            </select>
          </div>
        </div>

        {/* Stock Quantity */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Current Stock Quantity
          </label>
          <input
            type="number"
            placeholder={`e.g., 100 (in ${form.unit})`}
            value={form.stock}
            onChange={e => setForm(f => ({ ...f, stock: Number(e.target.value) }))}
            className="p-2 border border-gray-300 rounded w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="text-xs text-gray-500 mt-1">How much of this ingredient you currently have</p>
        </div>

        {/* Cost and Supplier */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Cost per {form.unit}
            </label>
            <input
              type="number"
              placeholder="e.g., 50"
              value={form.costPerUnit}
              onChange={e => setForm(f => ({ ...f, costPerUnit: Number(e.target.value) }))}
              className="p-2 border border-gray-300 rounded w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">Price in ₹</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Supplier Name</label>
            <input
              placeholder="e.g., Local Farm Co."
              value={form.supplier}
              onChange={e => setForm(f => ({ ...f, supplier: e.target.value }))}
              className="p-2 border border-gray-300 rounded w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-2 mt-6 pt-4 border-t">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={save}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Add Ingredient
          </button>
        </div>
      </div>
    </div>
  )
}
