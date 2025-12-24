"use client"

import { NavLink, Outlet, useNavigate } from "react-router-dom"
import { useAuth } from "../auth/AuthContext"

export default function CookLayout() {
  const { signOut, user } = useAuth()
  const navigate = useNavigate()
  const features = user?.features || {}
  const hasDashboard = features.dashboard !== false

  const logout = () => {
    signOut()
    navigate("/")
  }

  const linkClass = ({ isActive }) =>
    `block px-3 py-2 rounded-md text-sm font-medium ${
      isActive ? "bg-slate-800 text-white" : "text-slate-300 hover:bg-slate-700"
    }`

  return (
    <div className="min-h-screen bg-slate-100 flex">
      <aside className="w-[var(--sidebar-width)] bg-slate-900 p-4 space-y-2">
        <div className="text-lg font-semibold text-white mb-4">Kitchen</div>
        {hasDashboard && (
          <NavLink to="/cook" end className={linkClass}>
            Dashboard
          </NavLink>
        )}
        <button
          onClick={logout}
          className="mt-4 w-full text-left px-3 py-2 rounded-md text-sm font-medium text-red-400 hover:bg-red-800/20"
        >
          Logout
        </button>
      </aside>
      <main className="flex-1 p-6">
        {!hasDashboard ? (
          <div className="p-6">
            <h1 className="text-2xl font-bold text-red-600 mb-4">No Access</h1>
            <p className="text-gray-600">Dashboard feature is not available for your account. Please contact your administrator.</p>
          </div>
        ) : (
          <Outlet />
        )}
      </main>
    </div>
  )
}
