import React from 'react'

export default function ViewMenuSimple({ menus = [], onEdit, onDelete, onBack, allIngredients = [], onDeleteIngredient }) {
  return (
    <div className="max-w-4xl bg-white p-6 rounded shadow">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">View Menus</h2>
        <button onClick={onBack} className="px-3 py-2 border rounded">Back</button>
      </div>

      {menus.length === 0 ? (
        <div className="text-sm text-gray-500">No menus saved.</div>
      ) : (
        <div className="overflow-auto">
          <table className="w-full table-auto">
            <thead className="bg-gray-50">
              <tr>
                <th className="p-2 text-left">Name</th>
                <th className="p-2 text-left">Ingredients</th>
                <th className="p-2">Edit</th>
                <th className="p-2">Delete</th>
              </tr>
            </thead>
            <tbody>
              {menus.map((m) => (
                <tr key={m.id} className="border-t">
                  <td className="p-2 align-top w-48">{m.name}</td>
                  <td className="p-2 align-top">{(m.ingredients || []).join(', ')}</td>
                  <td className="p-2 text-center"><button onClick={() => onEdit(m)} className="px-3 py-1 bg-blue-600 text-white rounded">Edit</button></td>
                  <td className="p-2 text-center"><button onClick={() => onDelete(m.id)} className="px-3 py-1 bg-red-600 text-white rounded">Delete</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-6">
        <h3 className="text-lg font-medium mb-2">All Saved Ingredients</h3>
        {allIngredients.length === 0 ? (
          <div className="text-sm text-gray-500">No saved ingredients.</div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {allIngredients.map((ing) => (
              <div key={ing} className="px-3 py-1 bg-gray-100 rounded flex items-center gap-2">
                <span>{ing}</span>
                <button onClick={() => onDeleteIngredient && onDeleteIngredient(ing)} className="text-red-600 text-sm">x</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
