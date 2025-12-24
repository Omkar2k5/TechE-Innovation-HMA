import React, { useEffect, useState } from 'react'
import suggestIngredientsAPI from '../lib/suggestIngredients'

export default function AddMenuSimple({ initialMenu = null, onSave, onCancel, allIngredients = [] }) {
  const [name, setName] = useState('')
  const [ingredients, setIngredients] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (initialMenu) {
      setName(initialMenu.name || '')
      setIngredients(initialMenu.ingredients ? [...initialMenu.ingredients] : [])
    } else {
      setName('')
      setIngredients([])
    }
  }, [initialMenu])

  const onSuggest = async () => {
    if (!name) return
    setLoading(true)
    try {
      const res = await suggestIngredientsAPI(name)
      if (res && Array.isArray(res.ingredients)) setIngredients(res.ingredients)
    } finally { setLoading(false) }
  }

  const addIngredient = () => setIngredients((s) => [...s, ''])
  const updateIngredient = (i, v) => setIngredients((s) => s.map((x, idx) => idx === i ? v : x))
  const removeIngredient = (i) => setIngredients((s) => s.filter((_, idx) => idx !== i))

  const addFromSaved = (ing) => {
    if (!ing) return
    setIngredients((s) => {
      if (s.find((x) => x.toLowerCase() === ing.toLowerCase())) return s
      return [...s, ing]
    })
  }

  const submit = () => {
    if (!name) return alert('Enter menu name')
    onSave({ id: initialMenu?.id, name, ingredients: ingredients.filter(Boolean) })
  }

  return (
    <div className="max-w-2xl bg-white p-6 rounded shadow">
      <h2 className="text-xl font-semibold mb-4">{initialMenu ? 'Edit Menu' : 'Add Menu'}</h2>

      <div className="space-y-4">
        <div>
          <label className="block text-sm text-gray-600 mb-1">Menu Name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} className="w-full border rounded p-2" />
        </div>

        <div className="flex gap-2 items-center">
          <button onClick={onSuggest} disabled={loading || !name} className="px-3 py-2 bg-gray-800 text-white rounded">{loading ? 'Suggesting…' : 'Suggest Ingredients'}</button>
          <button onClick={addIngredient} className="px-3 py-2 border rounded">Add Ingredient</button>

          {/* simple dropdown of saved ingredients */}
          {allIngredients && allIngredients.length > 0 && (
            <div className="ml-4">
              <label className="block text-xs text-gray-600">Saved</label>
              <div className="border rounded bg-white max-h-40 overflow-auto">
                {allIngredients.map((ing, idx) => (
                  <button key={idx} onClick={() => addFromSaved(ing)} className="w-full text-left px-3 py-1 hover:bg-gray-100">{ing}</button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm text-gray-600 mb-1">Ingredients</label>
          <div className="space-y-2">
            {ingredients.map((ing, idx) => (
              <div key={idx} className="flex gap-2">
                <input value={ing} onChange={(e) => updateIngredient(idx, e.target.value)} className="flex-1 border rounded p-2" />
                <button onClick={() => removeIngredient(idx)} className="px-2 py-1 bg-red-600 text-white rounded">Del</button>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <button onClick={onCancel} className="px-3 py-2 border rounded">Cancel</button>
          <button onClick={submit} className="px-3 py-2 bg-green-600 text-white rounded">Save</button>
        </div>
      </div>
    </div>
  )
}
