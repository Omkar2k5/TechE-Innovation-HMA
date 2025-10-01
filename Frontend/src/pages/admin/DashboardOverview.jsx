import React from 'react'
import QuickStats from './inventory/QuickStats.jsx'

export default function DashboardOverview(){
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Admin Overview</h1>
      <div className="grid md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded shadow">
          <h3 className="font-medium mb-2">Quick Stats</h3>
          <QuickStats items={[]} />
        </div>
        <div className="bg-white p-4 rounded shadow">
          <div className="text-sm text-gray-500">Occupancy</div>
          <div className="text-xl font-bold">68%</div>
        </div>
        <div className="bg-white p-4 rounded shadow">
          <div className="text-sm text-gray-500">Average turnaround</div>
          <div className="text-xl font-bold">45m</div>
        </div>
      </div>

      <section className="mt-6">
        <h3 className="text-lg font-medium mb-2">Tables</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded shadow p-4">
            <div className="text-sm text-gray-500 mb-2">Table status & order timers</div>
            <ul className="space-y-2">
              <li className="flex justify-between"><span>Table 1</span><span className="text-sm text-green-600">Occupied · 12m</span></li>
              <li className="flex justify-between"><span>Table 2</span><span className="text-sm text-yellow-600">Pending · 4m</span></li>
              <li className="flex justify-between"><span>Table 3</span><span className="text-sm text-gray-500">Available</span></li>
            </ul>
          </div>
          <div className="bg-white rounded shadow p-4">
            <div className="text-sm text-gray-500 mb-2">Recent transactions</div>
            <ul className="space-y-2">
              <li className="flex justify-between"><span>Order #1024</span><span>$24.00</span></li>
              <li className="flex justify-between"><span>Order #1023</span><span>$18.50</span></li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  )
}
