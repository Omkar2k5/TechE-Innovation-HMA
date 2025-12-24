import React from 'react'

export default function QuickStats({ items=[] }){
  const totalStock = items.reduce((s,i)=>s+(i.stock||0),0)
  const low = items.filter(i=> (i.stock||0) <= (i.lowStockThreshold||5)).length
  return (
    <div className="bg-white p-4 rounded shadow w-64">
      <div className="text-sm text-gray-500">Total stock units</div>
      <div className="text-2xl font-bold">{totalStock}</div>
      <div className="mt-4 text-sm text-gray-500">Low stock items</div>
      <div className="text-xl font-semibold text-red-600">{low}</div>
    </div>
  )
}
