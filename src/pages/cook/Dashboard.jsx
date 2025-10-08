import CookQueue from "./Queue.jsx"

export default function CookDashboard() {
  return (
    <div className="space-y-2">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Order Queue</h1>
          <p className="text-slate-500 text-sm">Manage all incoming orders</p>
        </div>
      </div>
      <CookQueue />
    </div>
  )
}
