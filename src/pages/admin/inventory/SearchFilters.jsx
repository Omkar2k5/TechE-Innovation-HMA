import React, { useMemo, useState } from 'react'

export default function SearchFilters({ items=[], onChange }){
  const categories = useMemo(()=>Array.from(new Set(items.map(i=>i.category).filter(Boolean))), [items])
  const suppliers = useMemo(()=>Array.from(new Set(items.map(i=>i.supplier).filter(Boolean))), [items])
  const [filters, setFilters] = useState({ category:'', supplier:'' })

  const apply = ()=> onChange && onChange(filters)

  return (
    <div className="bg-white p-4 rounded shadow">
      <div className="flex gap-2">
        <select value={filters.category} onChange={e=>setFilters(f=>({...f,category:e.target.value}))} className="p-2 border">
          <option value="">All categories</option>
          {categories.map(c=> <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={filters.supplier} onChange={e=>setFilters(f=>({...f,supplier:e.target.value}))} className="p-2 border">
          <option value="">All suppliers</option>
          {suppliers.map(s=> <option key={s} value={s}>{s}</option>)}
        </select>
        <button onClick={apply} className="px-3 py-2 bg-slate-800 text-white rounded">Apply</button>
      </div>
    </div>
  )
}
