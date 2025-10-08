"use client"

import { useMemo, useState } from "react"

export default function SearchFilters({ items = [], onChange }) {
  const categories = useMemo(() => Array.from(new Set(items.map((i) => i.category).filter(Boolean))), [items])
  const suppliers = useMemo(() => Array.from(new Set(items.map((i) => i.supplier).filter(Boolean))), [items])
  const [filters, setFilters] = useState({ category: "", supplier: "", search: "", lowOnly: false })

  const apply = () => onChange && onChange(filters)

  return (
    <div className="bg-white p-3 rounded shadow">
      <div className="flex flex-wrap gap-2 items-center">
        <input
          value={filters.search}
          onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
          placeholder="Search name, category, supplier"
          className="p-2 border rounded w-[260px]"
        />
        <select
          value={filters.category}
          onChange={(e) => setFilters((f) => ({ ...f, category: e.target.value }))}
          className="p-2 border rounded"
        >
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <select
          value={filters.supplier}
          onChange={(e) => setFilters((f) => ({ ...f, supplier: e.target.value }))}
          className="p-2 border rounded"
        >
          <option value="">All suppliers</option>
          {suppliers.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <label className="inline-flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={filters.lowOnly}
            onChange={(e) => setFilters((f) => ({ ...f, lowOnly: e.target.checked }))}
          />
          Low stock only
        </label>
        <div className="ml-auto flex gap-2">
          <button onClick={apply} className="px-3 py-2 bg-slate-800 text-white rounded">
            Apply
          </button>
          <button
            onClick={() => {
              setFilters({ category: "", supplier: "", search: "", lowOnly: false })
              onChange && onChange({ category: "", supplier: "", search: "", lowOnly: false })
            }}
            className="px-3 py-2 border rounded"
          >
            Reset
          </button>
        </div>
      </div>
    </div>
  )
}
