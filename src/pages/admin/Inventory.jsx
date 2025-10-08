import React, { useEffect, useState } from 'react'
import api from '../../lib/api'

export default function Inventory() {
  const [ingredients, setIngredients] = useState([])
  const [form, setForm] = useState({ name: '', unit: 'pcs', category: '', costPerUnit: 0, stock: 0 })

  useEffect(() => { fetchIngredients() }, [])

  const fetchIngredients = async () => {
    const res = await api.get('/ingredients')
    setIngredients(res || [])
  }

  const submit = async () => {
    if (!form.name.trim()) return alert('Name required')
    await api.post('/ingredients', form)
    setForm({ name: '', unit: 'pcs', category: '', costPerUnit: 0, stock: 0 })
    fetchIngredients()
  }

  const adjust = async (id, delta) => {
    await api.post(`/ingredients/${id}/adjust`, { delta })
    fetchIngredients()
  }

  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Inventory</h1>

        <div className="bg-white p-6 rounded shadow mb-6">
          <h2 className="font-semibold mb-3">Add Ingredient</h2>
          <div className="grid grid-cols-2 gap-3">
            <input value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} placeholder="Name" className="p-2 border" />
            <input value={form.unit} onChange={e=>setForm(f=>({...f,unit:e.target.value}))} placeholder="Unit" className="p-2 border" />
            <input value={form.category} onChange={e=>setForm(f=>({...f,category:e.target.value}))} placeholder="Category" className="p-2 border" />
            <input type="number" value={form.costPerUnit} onChange={e=>setForm(f=>({...f,costPerUnit:Number(e.target.value)}))} placeholder="Cost per unit" className="p-2 border" />
            <input type="number" value={form.stock} onChange={e=>setForm(f=>({...f,stock:Number(e.target.value)}))} placeholder="Stock" className="p-2 border" />
          </div>
          <div className="mt-4">
            <button onClick={submit} className="px-4 py-2 bg-blue-600 text-white rounded">Save Ingredient</button>
          </div>
        </div>

        <div className="bg-white p-6 rounded shadow">
          <h2 className="font-semibold mb-3">Stock</h2>
          <table className="w-full table-auto">
            <thead>
              <tr><th>Name</th><th>Stock</th><th>Unit</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {ingredients.map(i=> (
                <tr key={i._id} className="border-t">
                  <td className="p-2">{i.name}</td>
                  <td className="p-2">{i.stock}</td>
                  <td className="p-2">{i.unit}</td>
                  <td className="p-2">
                    <button onClick={()=>adjust(i._id, -1)} className="mr-2 px-2 py-1 bg-yellow-200 rounded">-1</button>
                    <button onClick={()=>adjust(i._id, 1)} className="px-2 py-1 bg-green-200 rounded">+1</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
