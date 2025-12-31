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
    `block px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 relative overflow-hidden group ${isActive
      ? "bg-white/20 text-white shadow-lg backdrop-blur-sm"
      : "text-purple-100 hover:bg-white/10 hover:text-white"
    }`

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex">
      <aside className="w-[var(--sidebar-width)] bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900 p-5 space-y-3 shadow-2xl relative overflow-hidden">
        {/* Decorative gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-blue-500/10 pointer-events-none"></div>

        {/* Floating blur orbs */}
        <div className="absolute top-10 right-10 w-32 h-32 bg-purple-500/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-10 left-10 w-40 h-40 bg-blue-500/20 rounded-full blur-3xl"></div>

        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-1 h-8 bg-gradient-to-b from-purple-400 to-blue-400 rounded-full"></div>
            <div className="text-2xl font-bold text-white">Kitchen</div>
          </div>
          {hasDashboard && (
            <NavLink to="/cook" end className={linkClass}>
              <span className="relative z-10">Dashboard</span>
              <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
            </NavLink>
          )}
          <button
            onClick={logout}
            className="mt-6 w-full text-left px-4 py-3 rounded-xl text-sm font-medium text-red-300 hover:bg-red-900/30 border border-red-400/30 hover:border-red-400/50 transition-all duration-300"
          >
            Logout
          </button>
        </div>
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
