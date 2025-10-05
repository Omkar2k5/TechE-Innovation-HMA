import React, { useState } from 'react'

export default function DashboardOverview(){
  const [range, setRange] = useState('today')

  // demo / placeholder metrics
  const metrics = {
    activeTables: '12/24',
    pendingOrders: 0,
    todaysRevenue: 133,
    avgTurnaround: '5 mins'
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Business Overview</h1>
        <div className="flex items-center gap-2">
          <button onClick={()=>setRange('today')} className={`px-3 py-1 rounded ${range==='today' ? 'bg-blue-50 text-blue-700' : 'text-slate-600'}`}>Today</button>
          <button onClick={()=>setRange('7d')} className={`px-3 py-1 rounded ${range==='7d' ? 'bg-blue-50 text-blue-700' : 'text-slate-600'}`}>7d</button>
          <button onClick={()=>setRange('30d')} className={`px-3 py-1 rounded ${range==='30d' ? 'bg-blue-50 text-blue-700' : 'text-slate-600'}`}>30d</button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4 flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div>
              <div className="text-sm text-slate-500">Active Tables</div>
              <div className="text-2xl font-semibold mt-2">{metrics.activeTables}</div>
            </div>
            <div className="text-xs px-2 py-1 bg-slate-100 rounded-full text-slate-600">Normal</div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4 flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div>
              <div className="text-sm text-slate-500">Pending Orders</div>
              <div className="text-2xl font-semibold mt-2">{metrics.pendingOrders}</div>
            </div>
            <div className="text-xs px-2 py-1 bg-slate-100 rounded-full text-slate-600">Normal</div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4 flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div>
              <div className="text-sm text-slate-500">Today's Revenue</div>
              <div className="text-2xl font-semibold mt-2">₹{metrics.todaysRevenue}</div>
            </div>
            <div className="text-xs px-2 py-1 bg-green-50 rounded-full text-green-700">Good</div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4 flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div>
              <div className="text-sm text-slate-500">Avg Turnaround</div>
              <div className="text-2xl font-semibold mt-2">{metrics.avgTurnaround}</div>
            </div>
            <div className="text-xs px-2 py-1 bg-green-50 rounded-full text-green-700">Efficient</div>
          </div>
        </div>
      </div>
    </div>
  )
}
