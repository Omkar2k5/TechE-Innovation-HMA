"use client"

import { useState, useEffect } from "react"
import suggestIngredientsAPI from "../../../lib/suggestIngredients"

export default function AddMenu({ initialMenu = null, onSave, onCancel, allIngredients = [] }) {
  const [name, setName] = useState("")
  const [ingredients, setIngredients] = useState([])
  const [loading, setLoading] = useState(false)
  const [showIngredientDropdown, setShowIngredientDropdown] = useState(false)
  const [price, setPrice] = useState(0)
  const [active, setActive] = useState(true)
  const [prepTime, setPrepTime] = useState(0)
  const [category, setCategory] = useState("Main Course")

  useEffect(() => {
    if (initialMenu) {
      setName(initialMenu.name || "")
      setPrice(Number(initialMenu.price ?? 0))
      setActive(initialMenu.active !== false)
      setPrepTime(Number(initialMenu.avgPrepTimeMins ?? initialMenu.prepTimeMinutes ?? 0))
      setCategory(initialMenu.category || "Main Course")
      const normalized = (initialMenu.ingredients || []).map((it) =>
        typeof it === "string"
          ? { name: it, quantity: 0, unit: "grams" }
          : {
              name: it.name || "",
              quantity:
                typeof it.quantity === "number"
                  ? it.quantity
                  : Number.parseFloat(it.quantity) ||
                    (typeof it.qty === "number" ? it.qty : Number.parseFloat(it.qty) || 0),
              unit: it.unit || "grams",
            },
      )
      setIngredients(normalized)
    } else {
      setName("")
      setIngredients([])
      setPrice(0)
      setActive(true)
      setPrepTime(0)
      setCategory("Main Course")
    }
  }, [initialMenu])

  const onSuggest = async () => {
    if (!name) return
    setLoading(true)
    try {
      const res = await suggestIngredientsAPI(name)
      if (res && Array.isArray(res.ingredients)) {
        setIngredients(res.ingredients.map((n) => ({ name: n, quantity: "", unit: "grams" })))
      }
    } finally {
      setLoading(false)
    }
  }

  const addIngredient = () => setIngredients((s) => [...s, { name: "", quantity: 0, unit: "grams" }])
  const updateIngredient = (i, field, v) =>
    setIngredients((s) => s.map((x, idx) => (idx === i ? { ...x, [field]: v } : x)))
  const removeIngredient = (i) => setIngredients((s) => s.filter((_, idx) => idx !== i))

  const addFromSaved = (ing) => {
    if (!ing) return
    setIngredients((s) => {
      if (s.find((x) => (x.name || "").toLowerCase() === ing.toLowerCase())) return s
      return [...s, { name: ing, quantity: 0, unit: "grams" }]
    })
    setShowIngredientDropdown(false)
  }

  const submit = () => {
    if (!name.trim()) {
      alert("Please enter a menu name")
      return
    }

    const cleaned = ingredients
      .filter((ing) => ing && (ing.name || "").toString().trim())
      .map((ing) => ({
        name: ing.name.toString().trim(),
        quantity: ing.quantity === "" || ing.quantity == null ? 0 : Number(ing.quantity),
        unit: ing.unit || "grams",
      }))

    const menuData = {
      name: name.trim(),
      price: Number(price) || 0,
      active,
      avgPrepTimeMins: Number(prepTime) || 0,
      category,
      ingredients: cleaned,
    }

    console.log("Submitting menu data:", menuData)

    if (initialMenu?._id) {
      menuData._id = initialMenu._id
    }

    onSave(menuData)
  }

  const cancel = () => {
    setName("")
    setIngredients([])
    setPrice(0)
    setActive(true)
    setPrepTime(0)
    setCategory("Main Course")
    onCancel && onCancel()
  }

  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          {initialMenu ? "Edit Menu Item" : "Add New Menu Item"}
        </h1>

        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="space-y-6">
            {/* Menu Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Menu Name *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                placeholder="Enter dish name..."
              />
            </div>

            <div className="grid grid-cols-12 gap-4">
              <div className="col-span-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Price (₹)</label>
                <input
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  placeholder="0.00"
                />
              </div>
              <div className="col-span-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Average Prep Time (mins)</label>
                <input
                  type="number"
                  min="0"
                  value={prepTime}
                  onChange={(e) => setPrepTime(e.target.value === "" ? "" : Number(e.target.value))}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  placeholder="e.g. 12"
                />
              </div>
              <div className="col-span-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                >
                  <option>Starters</option>
                  <option>Main Course</option>
                  <option>Desserts</option>
                  <option>Beverages</option>
                  <option>Breads</option>
                </select>
              </div>
              <div className="col-span-4 flex items-end">
                <label className="inline-flex items-center gap-2 text-sm font-medium text-gray-700">
                  <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} />
                  Available
                </label>
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
                ) : (
                  "AI Suggest Ingredients"
                )}
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
              <label className="block text-sm font-medium text-gray-700 mb-2">Ingredients</label>
              <div className="space-y-3">
                {ingredients.map((ing, idx) => (
                  <div key={idx} className="grid grid-cols-12 gap-3 items-center">
                    <div className="col-span-6">
                      <input
                        list="ingredient-names"
                        value={ing.name}
                        onChange={(e) => updateIngredient(idx, "name", e.target.value)}
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
                        onChange={(e) =>
                          updateIngredient(idx, "quantity", e.target.value === "" ? "" : Number(e.target.value))
                        }
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                        placeholder="Qty"
                      />
                    </div>
                    <div className="col-span-2">
                      <select
                        value={ing.unit}
                        onChange={(e) => updateIngredient(idx, "unit", e.target.value)}
                        className="w-full px-2 py-2 border border-gray-200 rounded-lg"
                      >
                        <option>grams</option>
                        <option>ml</option>
                        <option>pieces</option>
                        <option>tbsp</option>
                        <option>tsp</option>
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
                  {allIngredients.map((a, i) => (
                    <option key={i} value={a} />
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
                {initialMenu ? "Update Menu" : "Save Menu"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
