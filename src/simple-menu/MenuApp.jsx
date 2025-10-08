import React, { useState } from 'react'
import AddMenuSimple from './AddMenuSimple.jsx'
import ViewMenuSimple from './ViewMenuSimple.jsx'

export default function MenuApp() {
  const [active, setActive] = useState('landing')
  const [menus, setMenus] = useState([])
  // global list of all saved ingredients (populated when menus are saved)
  const [allIngredients, setAllIngredients] = useState([])
  const [editing, setEditing] = useState(null)

  const handleSave = (menu) => {
    if (menu.id) {
      setMenus((prev) => prev.map((m) => (m.id === menu.id ? menu : m)))
    } else {
      setMenus((prev) => [...prev, { ...menu, id: Date.now() }])
    }
    setEditing(null)
    // after saving, go back to the minimal landing view
    setActive('landing')
    // merge ingredients into global list
    if (menu.ingredients && menu.ingredients.length) {
      setAllIngredients((prev) => {
        const set = new Set(prev.map((i) => i.toLowerCase()))
        menu.ingredients.forEach((ing) => set.add(ing))
        return Array.from(set)
      })
    }
  }

  const handleEdit = (m) => {
    setEditing(m)
    setActive('add')
  }

  const handleDelete = (id) => setMenus((prev) => prev.filter((m) => m.id !== id))

  return (
    <div className="min-h-screen flex bg-gray-50">
      <aside className="w-56 bg-white border-r p-4">
        <div className="font-bold mb-6">Menu</div>
        <button className={`w-full text-left px-3 py-2 rounded ${active === 'landing' ? 'bg-gray-100' : ''}`} onClick={() => setActive('landing')}>Menu Dashboard</button>
      </aside>

      <main className="flex-1 p-6">
        {active === 'landing' && (
          <div className="max-w-xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={() => { setEditing(null); setActive('add') }}
              className="px-6 py-4 bg-white rounded shadow text-center font-medium"
            >
              Add Menu
            </button>

            <button
              onClick={() => setActive('view')}
              className="px-6 py-4 bg-white rounded shadow text-center font-medium"
            >
              View Menu
            </button>
          </div>
        )}

        {active === 'add' && (
          <AddMenuSimple
            initialMenu={editing}
            onSave={handleSave}
            onCancel={() => { setEditing(null); setActive('landing') }}
            allIngredients={allIngredients}
          />
        )}

        {active === 'view' && (
          <ViewMenuSimple
            menus={menus}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onBack={() => setActive('landing')}
            allIngredients={allIngredients}
            onDeleteIngredient={(ing) => setAllIngredients((prev) => prev.filter((i) => i !== ing))}
          />
        )}
      </main>
    </div>
  )
}
