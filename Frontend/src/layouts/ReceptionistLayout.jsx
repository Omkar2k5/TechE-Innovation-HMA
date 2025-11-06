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
      } else if (features.addEmployee) {
        navigate('/receptionist/employees', { replace: true })
      } else if (features.menuManagement) {
        navigate('/receptionist/menu', { replace: true })
      }
    }
  }, [location.pathname, features, navigate])

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
        <div className="text-lg font-semibold text-white mb-4">Reception</div>
        {features.dashboard !== false && (
          <NavLink to="/receptionist" end className={linkClass}>
            Dashboard
          </NavLink>
        )}
        {features.reservations && (
          <NavLink to="/receptionist/reservations" className={linkClass}>
            Reservations
          </NavLink>
        )}
        {features.ordersBilling && (
          <NavLink to="/receptionist/billing" className={linkClass}>
            Orders & Billing
          </NavLink>
        )}
        {features.reports && (
          <NavLink to="/receptionist/reports" className={linkClass}>
            Reports
          </NavLink>
        )}
        {features.addEmployee && (
          <NavLink to="/receptionist/employees" className={linkClass}>
            Add Employee
          </NavLink>
        )}
        {features.menuManagement && (
          <NavLink to="/receptionist/menu" className={linkClass}>
            Menu Management
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
        <Outlet />
      </main>
    </div>
  )
}
