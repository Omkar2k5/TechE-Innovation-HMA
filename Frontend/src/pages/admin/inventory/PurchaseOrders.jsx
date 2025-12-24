import React, { useEffect, useState } from 'react'
import api from '../../../lib/api'

export default function PurchaseOrders(){
  const [pos, setPos] = useState([])
  const [ingredients, setIngredients] = useState([])
  const [suppliers, setSuppliers] = useState([])
  const [po, setPo] = useState({ supplier: '', items: [] })

  const fetch = async ()=>{
    const p = await api.get('/purchase-orders'); if(p) setPos(p)
    const ing = await api.get('/ingredients'); if(ing) setIngredients(ing)
    const s = await api.get('/suppliers'); if(s) setSuppliers(s)
  }
  useEffect(()=>{ fetch() }, [])

  const addItem = ()=> setPo(p=>({...p, items: [...(p.items||[]), { ingredient:'', name:'', qty:0, unit:'', pricePerUnit:0 }]}))
  const updateItem = (i, field, v)=> setPo(p=>({...p, items: p.items.map((it,idx)=> idx===i?({...it,[field]:v}):it)}))
  const save = async ()=>{ await api.post('/purchase-orders', po); setPo({ supplier:'', items:[] }); fetch() }
  const receive = async (id)=>{ await api.post(`/purchase-orders/${id}/receive`); fetch() }

  return (
    <div>
      <h3 className="text-lg font-medium mb-3">Purchase Orders</h3>
      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-white p-4 rounded shadow">
          <select value={po.supplier} onChange={e=>setPo(p=>({...p,supplier:e.target.value}))} className="p-2 border w-full mb-2">
            <option value="">Select supplier</option>
            {suppliers.map(s=> <option key={s._id} value={s._id}>{s.name}</option>)}
          </select>
          <div className="space-y-2">
            {(po.items||[]).map((it,idx)=> (
              <div key={idx} className="flex gap-2">
                <select value={it.ingredient} onChange={e=>updateItem(idx,'ingredient',e.target.value)} className="p-2 border">
                  <option value="">--</option>
                  {ingredients.map(ing=> <option key={ing._id} value={ing._id}>{ing.name}</option>)}
                </select>
                <input placeholder="qty" type="number" value={it.qty} onChange={e=>updateItem(idx,'qty',Number(e.target.value))} className="p-2 border" />
                <input placeholder="price/unit" type="number" value={it.pricePerUnit} onChange={e=>updateItem(idx,'pricePerUnit',Number(e.target.value))} className="p-2 border" />
              </div>
            ))}
            <div className="flex gap-2"><button onClick={addItem} className="px-2 py-1 bg-green-600 text-white rounded">Add item</button><button onClick={save} className="px-2 py-1 bg-blue-600 text-white rounded">Create PO</button></div>
          </div>
        </div>
        <div className="bg-white p-4 rounded shadow">
          <ul className="space-y-2">
            {pos.map(p=> (
              <li key={p._id} className="border-b py-2">
                <div className="flex justify-between items-center">
                  <div>
                    <div className="font-medium">PO {p._id} · {p.status}</div>
                    <div className="text-sm text-gray-500">Items: {p.items.length}</div>
                  </div>
                  <div>
                    {p.status !== 'RECEIVED' && <button onClick={()=>receive(p._id)} className="px-2 py-1 bg-green-600 text-white rounded">Mark Received</button>}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}
