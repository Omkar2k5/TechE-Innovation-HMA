"use client"

import React, { useState } from "react"
import InventoryDashboard from "./inventory/InventoryDashboard.jsx"
import DashboardOverview from "./DashboardOverview.jsx"
import EmployeeManagement from "./EmployeeManagement.jsx"
import LiveCCTV from "./LiveCCTV.jsx"
import PerformanceAnalysis from "./PerformanceAnalysis.jsx"
import BusinessEvaluation from "./BusinessEvaluation.jsx"
import { useAuth } from "../../auth/AuthContext.jsx"
import { useNavigate } from "react-router-dom"

const Sidebar = ({ activeSection, setActiveSection, onLogout, features = {} }) => {
  const [expanded, setExpanded] = useState(null)
  const allItems = [
    { id: "dashboard", label: "Dashboard", feature: "dashboard" },
    { id: "inventory-dashboard", label: "Inventory", feature: "inventory" },
    { id: "live-cctv", label: "Live CCTV", feature: "liveCCTV" },
    { id: "staff-management", label: "Staff Management", feature: "staffManagement" },
    { id: "performance-analysis", label: "Performance Analysis", feature: "performanceAnalysis" },
    { id: "business-evaluation", label: "Business Evaluation", feature: "businessEvaluation" },
  ]
  
  // Filter items based on features
  const items = allItems.filter(item => features[item.feature] === true)

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
  const { signOut, user } = useAuth()
  const navigate = useNavigate()
  const features = user?.features || {}
  
  // Find first available feature as default section
  const getDefaultSection = () => {
    if (features.dashboard) return "dashboard"
    if (features.inventory) return "inventory-dashboard"
    if (features.liveCCTV) return "live-cctv"
    if (features.staffManagement) return "staff-management"
    if (features.performanceAnalysis) return "performance-analysis"
    if (features.businessEvaluation) return "business-evaluation"
    return "dashboard"
  }
  
  const [activeSection, setActiveSection] = useState(getDefaultSection())
  
  const onLogout = () => {
    signOut()
    navigate("/")
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar 
        activeSection={activeSection} 
        setActiveSection={setActiveSection} 
        onLogout={onLogout}
        features={features}
      />
      <main className="flex-1 p-6">
        {activeSection === "dashboard" && features.dashboard && <DashboardOverview />}
        {activeSection === "inventory-dashboard" && features.inventory && <InventoryDashboard />}
        {activeSection === "live-cctv" && features.liveCCTV && <LiveCCTV />}
        {activeSection === "staff-management" && features.staffManagement && <EmployeeManagement />}
        {activeSection === "performance-analysis" && features.performanceAnalysis && <PerformanceAnalysis />}
        {activeSection === "business-evaluation" && features.businessEvaluation && <BusinessEvaluation />}
        
        {/* Show access denied message if trying to access restricted feature */}
        {((activeSection === "dashboard" && !features.dashboard) ||
          (activeSection === "inventory-dashboard" && !features.inventory) ||
          (activeSection === "live-cctv" && !features.liveCCTV) ||
          (activeSection === "staff-management" && !features.staffManagement) ||
          (activeSection === "performance-analysis" && !features.performanceAnalysis) ||
          (activeSection === "business-evaluation" && !features.businessEvaluation)) && (
          <div className="p-6">
            <h1 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h1>
            <p className="text-gray-600">You don't have permission to access this feature.</p>
          </div>
        )}
      </main>
    </div>
  )
}
