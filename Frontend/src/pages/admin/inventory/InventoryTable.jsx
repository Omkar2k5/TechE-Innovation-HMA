import React, { useMemo, useState } from 'react'

export default function InventoryTable({ items = [], onEdit, onDelete }) {
  const [page, setPage] = useState(1)
  const pageSize = 10
  const pages = Math.max(1, Math.ceil(items.length / pageSize))
  const pageItems = useMemo(() => items.slice((page - 1) * pageSize, page * pageSize), [items, page])

  return (
    <div className="bg-white p-4 rounded shadow">
      <table className="w-full text-left">
        <thead>
          <tr className="text-sm text-gray-700 bg-gray-50">
            <th className="p-3 font-semibold">Ingredient Name</th>
            <th className="p-3 font-semibold">Category</th>
            <th className="p-3 font-semibold">Stock Quantity</th>
            <th className="p-3 font-semibold">Cost per Unit</th>
            <th className="p-3 font-semibold">Supplier</th>
            <th className="p-3 font-semibold">Actions</th>
          </tr>
        </thead>
        <tbody>
          {pageItems.map(it => (
            <tr key={it._id} className="border-t hover:bg-gray-50">
              <td className="py-3 px-3 font-medium">{it.name}</td>
              <td className="py-3 px-3">
                <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full">
                  {it.category}
                </span>
              </td>
              <td className="py-3 px-3">
                <span className={`font-semibold ${(it.stock || 0) < 50 ? 'text-red-600' :
                    (it.stock || 0) < 100 ? 'text-yellow-600' :
                      'text-green-600'
                  }`}>
                  {it.stock || 0} {it.unit}
                </span>
              </td>
              <td className="py-3 px-3">₹{it.costPerUnit || 0} / {it.unit}</td>
              <td className="py-3 px-3 text-gray-600">{it.supplier || '-'}</td>
              <td className="py-3 px-3">
                <div className="flex gap-2">
                  <button
                    onClick={() => onEdit && onEdit(it._id, { stock: (it.stock || 0) + 1 })}
                    className="px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
                    title="Increase stock by 1"
                  >
                    +1
                  </button>
                  <button
                    onClick={() => onEdit && onEdit(it._id, { stock: (it.stock || 0) - 1 })}
                    className="px-2 py-1 bg-yellow-600 text-white rounded hover:bg-yellow-700 text-sm"
                    title="Decrease stock by 1"
                  >
                    -1
                  </button>
                  <button
                    onClick={() => onDelete && onDelete(it._id)}
                    className="px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
                    title="Delete ingredient"
                  >
                    Delete
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {pageItems.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <p>No ingredients found</p>
        </div>
      )}
      <div className="mt-3 flex justify-between items-center">
        <div className="text-sm text-gray-500">
          Showing {pageItems.length} of {items.length} ingredients (Page {page} / {pages})
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-3 py-1 border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            Prev
          </button>
          <button
            onClick={() => setPage(p => Math.min(pages, p + 1))}
            disabled={page === pages}
            className="px-3 py-1 border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  )
}
