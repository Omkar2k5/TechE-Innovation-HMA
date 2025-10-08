"use client"

import React, { useState } from "react"
import InventoryDashboard from "./inventory/InventoryDashboard.jsx"
import DashboardOverview from "./DashboardOverview.jsx"
import InventoryAnalytics from "./inventory/InventoryAnalytics.jsx"
import TablesManagement from "./TablesManagement.jsx"
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
    { id: "add-employee", label: "Add Employee" },
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

function SendPasswordForm({ title, placeholderName, placeholderEmail }) {
  const [name, setName] = React.useState("")
  const [email, setEmail] = React.useState("")
  const [sending, setSending] = React.useState(false)

  const onSend = async (e) => {
    e.preventDefault()
    setSending(true)
    console.log("Owner clicked Send Password:", { role: title, name, email })
    setTimeout(() => {
      alert(`Password sent to ${email}`)
      setSending(false)
      setName("")
      setEmail("")
    }, 500)
  }

  return (
    <form onSubmit={onSend} className="max-w-md space-y-3 bg-white border rounded-lg p-4">
      <div>
        <label className="block text-sm text-gray-700 mb-1">Name</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full border rounded-md px-3 py-2"
          placeholder={placeholderName}
        />
      </div>
      <div>
        <label className="block text-sm text-gray-700 mb-1">Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full border rounded-md px-3 py-2"
          placeholder={placeholderEmail}
        />
      </div>
      <button
        disabled={sending || !name || !email}
        className="px-4 py-2 rounded-md bg-gray-900 text-white disabled:opacity-50"
      >
        {sending ? "Sending…" : "Send Password"}
      </button>
    </form>
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
        {activeSection === "add-employee" && (
          <div className="space-y-4">
            <h1 className="text-xl font-semibold">Add Employee</h1>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <h2 className="text-lg font-medium mb-2">Add Receptionist</h2>
                <SendPasswordForm
                  title="receptionist"
                  placeholderName="Receptionist name"
                  placeholderEmail="receptionist@example.com"
                />
              </div>
              <div>
                <h2 className="text-lg font-medium mb-2">Add Cook</h2>
                <SendPasswordForm title="cook" placeholderName="Cook name" placeholderEmail="cook@example.com" />
              </div>
              <div>
                <h2 className="text-lg font-medium mb-2">Add Manager</h2>
                <SendPasswordForm
                  title="manager"
                  placeholderName="Manager name"
                  placeholderEmail="manager@example.com"
                />
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
