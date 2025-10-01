import React, { useState } from 'react'
import AddMenu from '../menu/AddMenu.jsx'

export default function MenuManagement({ items=[], menus=[], onAddMenu, onUpdateMenu, onDeleteMenu }){
  const [showAdd, setShowAdd] = useState(false)
  const [editing, setEditing] = useState(null)

  const save = (menu)=>{ if(editing) onUpdateMenu && onUpdateMenu(editing._id, menu); else onAddMenu && onAddMenu(menu); setShowAdd(false); setEditing(null) }

  return (
    <div>
      <div className="mb-4 flex justify-between items-center">
        <h2 className="text-xl font-semibold">Menu Management</h2>
        <button onClick={()=>setShowAdd(true)} className="px-3 py-2 bg-blue-600 text-white rounded">Add Menu Item</button>
      </div>
      <div className="bg-white p-4 rounded shadow">
        <table className="w-full text-left">
          <thead><tr className="text-sm text-gray-600"><th>Name</th><th>Price (₹)</th><th>Cost (₹)</th><th>Actions</th></tr></thead>
          <tbody>
            {menus.map(m=> (
              <tr key={m._id} className="border-t">
                <td className="py-2">{m.name}</td>
                <td className="py-2">₹{m.price}</td>
                <td className="py-2">₹{(m.ingredients||[]).reduce((s,ing)=> s + ((ing.qty||0) * (items.find(i=>i._id===ing.id)?.costPerUnit || 0)),0).toFixed(2)}</td>
                <td className="py-2">
                  <button onClick={()=>setEditing(m) || setShowAdd(true)} className="px-2 py-1 mr-2 bg-yellow-600 text-white rounded">Edit</button>
                  <button onClick={()=>onDeleteMenu && onDeleteMenu(m._id)} className="px-2 py-1 bg-red-600 text-white rounded">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showAdd && <AddMenu initialMenu={editing} onSave={save} onCancel={()=>{ setShowAdd(false); setEditing(null) }} allIngredients={items.map(i=>i.name)} />}
    </div>
  )
}
