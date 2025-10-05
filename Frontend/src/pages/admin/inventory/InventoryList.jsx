import React, { useEffect, useState } from 'react'
import api from '../../../lib/api'

export default function InventoryList(){
  const [items, setItems] = useState([])
  const [form, setForm] = useState({ name: '', unit: 'grams', category: '', costPerUnit: 0, stock: 0 })

  const fetch = async ()=>{ const res = await api.get('/ingredients'); if(res) setItems(res) }
  useEffect(()=>{ fetch() }, [])

  const save = async ()=>{ await api.post('/ingredients', form); setForm({ name:'', unit:'grams', category:'', costPerUnit:0, stock:0 }); fetch() }
  const adjust = async (id, delta)=>{ await api.post(`/ingredients/${id}/adjust`, { delta }); fetch() }

  return (
    <div>
      <h3 className="text-lg font-medium mb-3">Inventory Items</h3>
      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-white p-4 rounded shadow">
          <div className="space-y-2">
            <input placeholder="Name" value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} className="p-2 border w-full" />
            <input placeholder="Category" value={form.category} onChange={e=>setForm(f=>({...f,category:e.target.value}))} className="p-2 border w-full" />
            <input placeholder="Unit" value={form.unit} onChange={e=>setForm(f=>({...f,unit:e.target.value}))} className="p-2 border w-full" />
            <input type="number" placeholder="Cost per unit" value={form.costPerUnit} onChange={e=>setForm(f=>({...f,costPerUnit:Number(e.target.value)}))} className="p-2 border w-full" />
            <input type="number" placeholder="Stock" value={form.stock} onChange={e=>setForm(f=>({...f,stock:Number(e.target.value)}))} className="p-2 border w-full" />
            <div className="flex justify-end"><button onClick={save} className="px-3 py-2 bg-blue-600 text-white rounded">Add / Save</button></div>
          </div>
        </div>

        <div className="bg-white p-4 rounded shadow">
          <ul className="space-y-2">
            {items.map(it=> (
              <li key={it._id} className="flex justify-between items-center">
                <div>
                  <div className="font-medium">{it.name}</div>
                      <div className="text-sm text-gray-500">{it.stock} {it.unit} · ₹{it.costPerUnit}/unit</div>
                </div>
                <div className="flex gap-2">
                  <button onClick={()=>adjust(it._id, 1)} className="px-2 py-1 bg-green-600 text-white rounded">+1</button>
                  <button onClick={()=>adjust(it._id, -1)} className="px-2 py-1 bg-red-600 text-white rounded">-1</button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}
