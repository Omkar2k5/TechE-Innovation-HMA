"use client"

import React, { useState } from "react"
import InventoryDashboard from "./inventory/InventoryDashboard.jsx"
import DashboardOverview from "./DashboardOverview.jsx"
import InventoryAnalytics from "./inventory/InventoryAnalytics.jsx"
import TablesManagement from "./TablesManagement.jsx"
import EmployeeManagement from "./EmployeeManagement.jsx"
import { useAuth } from "../../auth/AuthContext.jsx"
import { useNavigate } from "react-router-dom"

const Sidebar = ({ activeSection, setActiveSection, onLogout }) => {
  const [expanded, setExpanded] = useState(null)
  const items = [
    { id: "dashboard", label: "Dashboard" },
    { id: "inventory-dashboard", label: "Inventory" },
    { id: "tables", label: "Table Management" },
    { id: "orders", label: "Orders & Billing" },
    { id: "reports", label: "Reports" },
    { id: "employee-management", label: "Employee Management" },
  ]

  return (
    <aside className="w-64 bg-gray-800 text-white min-h-screen">
      <div className="p-6 border-b border-gray-700">
        <h2 className="text-xl font-bold">Owner</h2>
      </div>
      <nav className="mt-4">
        {items.map((it) => (
          <div key={it.id}>
            <button
              onClick={() => {
                if (it.sub) setExpanded(expanded === it.id ? null : it.id)
                else setActiveSection(it.id)
              }}
              className={`w-full text-left px-6 py-3 hover:bg-gray-700 ${activeSection === it.id ? "bg-gray-900" : ""}`}
            >
              {it.label}
            </button>

            {it.sub && expanded === it.id && (
              <div className="bg-gray-900">
                {it.sub.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setActiveSection(s.id)}
                    className={`w-full text-left px-12 py-2 hover:bg-gray-600 ${
                      activeSection === s.id ? "bg-gray-600" : ""
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </nav>
      <button
        onClick={onLogout}
        className="mt-4 w-full text-left px-6 py-2 rounded-md text-sm font-medium text-red-400 hover:bg-red-800/20"
      >
        Logout
      </button>
    </aside>
  )
}


export default function AdminDashboard() {
  const [activeSection, setActiveSection] = useState("dashboard")
  const { signOut } = useAuth()
  const navigate = useNavigate()
  const onLogout = () => {
    signOut()
    navigate("/")
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar activeSection={activeSection} setActiveSection={setActiveSection} onLogout={onLogout} />
      <main className="flex-1 p-6">
        {activeSection === "dashboard" && <DashboardOverview />}
        {activeSection === "inventory-dashboard" && <InventoryDashboard />}
        {activeSection === "tables" && <TablesManagement />}
        {activeSection === "orders" && (
          <div className="p-6">
            <h1 className="text-xl font-semibold">Orders & Billing</h1>
            <p className="text-sm text-slate-600">Coming soon.</p>
          </div>
        )}
        {activeSection === "reports" && <InventoryAnalytics />}
        {activeSection === "employee-management" && <EmployeeManagement />}
      </main>
    </div>
  )
}
