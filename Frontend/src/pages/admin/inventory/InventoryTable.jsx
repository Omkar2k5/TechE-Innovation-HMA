import React, { useMemo, useState } from 'react'

export default function InventoryTable({ items=[], onEdit, onDelete }){
  const [page, setPage] = useState(1)
  const pageSize = 10
  const pages = Math.max(1, Math.ceil(items.length / pageSize))
  const pageItems = useMemo(()=> items.slice((page-1)*pageSize, page*pageSize), [items, page])

  return (
    <div className="bg-white p-4 rounded shadow">
      <table className="w-full text-left">
        <thead>
          <tr className="text-sm text-gray-600">
            <th>Name</th><th>Stock</th><th>Unit</th><th>Cost</th><th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {pageItems.map(it=> (
            <tr key={it._id} className="border-t">
              <td className="py-2">{it.name}</td>
              <td className="py-2">{it.stock}</td>
              <td className="py-2">{it.unit}</td>
              <td className="py-2">₹{it.costPerUnit}</td>
              <td className="py-2">
                <button onClick={()=>onEdit && onEdit(it._id, { stock: (it.stock||0) + 1 })} className="px-2 py-1 mr-2 bg-green-600 text-white rounded">+1</button>
                <button onClick={()=>onEdit && onEdit(it._id, { stock: (it.stock||0) - 1 })} className="px-2 py-1 mr-2 bg-yellow-600 text-white rounded">-1</button>
                <button onClick={()=>onDelete && onDelete(it._id)} className="px-2 py-1 bg-red-600 text-white rounded">Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="mt-3 flex justify-between items-center">
        <div className="text-sm text-gray-500">Page {page} / {pages}</div>
        <div className="flex gap-2">
          <button onClick={()=>setPage(p=>Math.max(1,p-1))} className="px-2 py-1 border rounded">Prev</button>
          <button onClick={()=>setPage(p=>Math.min(pages,p+1))} className="px-2 py-1 border rounded">Next</button>
        </div>
      </div>
    </div>
  )
}
