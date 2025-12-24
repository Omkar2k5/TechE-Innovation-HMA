import React, { useEffect, useState } from 'react'
import api from '../../../lib/api'

export default function InventoryAnalytics(){
  const [summary, setSummary] = useState({ lowStock: [], usage: {} })
  const fetch = async ()=>{ const s = await api.get('/analytics/inventory-summary'); if(s) setSummary(s) }
  useEffect(()=>{ fetch() }, [])

  return (
    <div>
      <h3 className="text-lg font-medium mb-3">Inventory Analytics</h3>
      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-white p-4 rounded shadow">
          <h4 className="font-medium mb-2">Low Stock</h4>
          <ul>
            {summary.lowStock.map(i=> <li key={i._id} className="py-1 border-b">{i.name} · {i.stock} {i.unit}</li>)}
          </ul>
        </div>
        <div className="bg-white p-4 rounded shadow">
          <h4 className="font-medium mb-2">Usage (total qty)</h4>
          <ul>
            {Object.entries(summary.usage || {}).map(([k,v])=> <li key={k} className="py-1 border-b">{k} · {v}</li>)}
          </ul>
        </div>
      </div>
    </div>
  )
}
