"use client"

import { NavLink, Outlet, useNavigate, useLocation } from "react-router-dom"
import { useEffect } from "react"
import { useAuth } from "../auth/AuthContext"

export default function ReceptionistLayout() {
  const { signOut, user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const features = user?.features || {}

  // Redirect to first available feature if on a restricted page
  useEffect(() => {
    const path = location.pathname

    // Map paths to their feature requirements
    const pathFeatureMap = {
      '/receptionist': features.dashboard !== false,
      '/receptionist/reservations': features.reservations,
      '/receptionist/billing': features.ordersBilling,
      '/receptionist/reports': features.reports,
      '/receptionist/employees': features.addEmployee,
      '/receptionist/menu': features.menuManagement,
    }

    // Check if current path is allowed
    const currentPathAllowed = pathFeatureMap[path]

    if (currentPathAllowed === false || (currentPathAllowed === undefined && path.startsWith('/receptionist'))) {
      // Find first available feature and redirect
      if (features.dashboard !== false) {
        navigate('/receptionist', { replace: true })
      } else if (features.reservations) {
        navigate('/receptionist/reservations', { replace: true })
      } else if (features.ordersBilling) {
        navigate('/receptionist/billing', { replace: true })
      } else if (features.reports) {
        navigate('/receptionist/reports', { replace: true })
      }
    }
  }, [location.pathname, features, navigate])

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
        <div className="absolute inset-0 bg-gradient-to-br from-purple-600/20 to-transparent pointer-events-none"></div>
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-purple-500/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-blue-500/20 rounded-full blur-3xl"></div>

        <div className="relative z-10">
          <div className="text-2xl font-bold text-white mb-6 flex items-center">
            <div className="w-2 h-8 bg-gradient-to-b from-purple-400 to-blue-400 rounded-full mr-3"></div>
            Reception
          </div>
          {features.dashboard !== false && (
            <NavLink to="/receptionist" end className={linkClass}>
              <span className="relative z-10">Dashboard</span>
              <div className="absolute inset-0 bg-gradient-to-r from-purple-400/0 via-purple-400/20 to-purple-400/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
            </NavLink>
          )}
          {features.reservations && (
            <NavLink to="/receptionist/reservations" className={linkClass}>
              <span className="relative z-10">Reservations</span>
              <div className="absolute inset-0 bg-gradient-to-r from-purple-400/0 via-purple-400/20 to-purple-400/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
            </NavLink>
          )}
          {features.ordersBilling && (
            <NavLink to="/receptionist/billing" className={linkClass}>
              <span className="relative z-10">Orders & Billing</span>
              <div className="absolute inset-0 bg-gradient-to-r from-purple-400/0 via-purple-400/20 to-purple-400/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
            </NavLink>
          )}
          {features.reports && (
            <NavLink to="/receptionist/reports" className={linkClass}>
              <span className="relative z-10">Reports</span>
              <div className="absolute inset-0 bg-gradient-to-r from-purple-400/0 via-purple-400/20 to-purple-400/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
            </NavLink>
          )}
          {features.addEmployee && (
            <NavLink to="/receptionist/employees" className={linkClass}>
              <span className="relative z-10">Add Employee</span>
              <div className="absolute inset-0 bg-gradient-to-r from-purple-400/0 via-purple-400/20 to-purple-400/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
            </NavLink>
          )}
          {features.menuManagement && (
            <NavLink to="/receptionist/menu" className={linkClass}>
              <span className="relative z-10">Menu Management</span>
              <div className="absolute inset-0 bg-gradient-to-r from-purple-400/0 via-purple-400/20 to-purple-400/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
            </NavLink>
          )}
          <button
            onClick={logout}
            className="mt-6 w-full text-left px-4 py-3 rounded-xl text-sm font-medium text-red-300 hover:bg-red-900/30 hover:text-red-200 transition-all duration-300 border border-red-400/30 hover:border-red-400/50"
          >
            Logout
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  )
}
