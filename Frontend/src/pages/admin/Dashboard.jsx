"use client"

import React, { useState, useEffect } from "react"
import InventoryDashboard from "./inventory/InventoryDashboard.jsx"
import DashboardOverview from "./DashboardOverview.jsx"
import EmployeeManagement from "./EmployeeManagement.jsx"
import LiveCCTV from "./LiveCCTV.jsx"
import PerformanceAnalysis from "./PerformanceAnalysis.jsx"
import BusinessEvaluation from "./BusinessEvaluation.jsx"
import { useAuth } from "../../auth/AuthContext.jsx"
import { useNavigate } from "react-router-dom"

// Icon components for sidebar
const DashboardIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
  </svg>
)

const InventoryIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
  </svg>
)

const CCTVIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
  </svg>
)

const StaffIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
  </svg>
)

const PerformanceIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
)

const BusinessIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
  </svg>
)

const LogoutIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
  </svg>
)

const Sidebar = ({ activeSection, setActiveSection, onLogout, features = {} }) => {
  const allItems = [
    { id: "dashboard", label: "Dashboard", feature: "dashboard", icon: DashboardIcon },
    { id: "inventory-dashboard", label: "Inventory", feature: "inventory", icon: InventoryIcon },
    { id: "live-cctv", label: "Live CCTV", feature: "liveCCTV", icon: CCTVIcon },
    { id: "staff-management", label: "Staff Management", feature: "staffManagement", icon: StaffIcon },
    { id: "performance-analysis", label: "Performance Analysis", feature: "performanceAnalysis", icon: PerformanceIcon },
    { id: "business-evaluation", label: "Business Evaluation", feature: "businessEvaluation", icon: BusinessIcon },
  ]

  // Filter items based on features
  const items = allItems.filter(item => features[item.feature] === true)

  return (
    <aside className="w-64 min-h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900 shadow-2xl relative overflow-hidden">
      {/* Decorative gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-blue-500/10 pointer-events-none"></div>

      {/* Floating blur orbs */}
      <div className="absolute top-10 right-10 w-32 h-32 bg-purple-500/20 rounded-full blur-3xl"></div>
      <div className="absolute bottom-10 left-10 w-40 h-40 bg-blue-500/20 rounded-full blur-3xl"></div>

      <div className="relative z-10">
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center gap-2">
            <div className="w-1 h-8 bg-gradient-to-b from-purple-400 to-blue-400 rounded-full"></div>
            <h2 className="text-2xl font-bold text-white">Owner</h2>
          </div>
        </div>
        <nav className="mt-2 px-3">
          {items.map((it) => {
            const IconComponent = it.icon
            return (
              <button
                key={it.id}
                onClick={() => setActiveSection(it.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 mb-1 relative overflow-hidden group ${activeSection === it.id
                    ? "bg-white/20 text-white shadow-lg backdrop-blur-sm"
                    : "text-purple-100 hover:bg-white/10 hover:text-white"
                  }`}
              >
                <IconComponent />
                <span className="relative z-10">{it.label}</span>
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
              </button>
            )
          })}
        </nav>
        <div className="px-3 mt-4">
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-300 hover:bg-red-900/30 border border-red-400/30 hover:border-red-400/50 transition-all duration-300"
          >
            <LogoutIcon />
            Logout
          </button>
        </div>
      </div>
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
    return null
  }

  const [activeSection, setActiveSection] = useState(getDefaultSection())

  // Redirect to first available section if current section is not accessible
  useEffect(() => {
    const defaultSection = getDefaultSection()
    if (!defaultSection) {
      // No features available
      return
    }

    // Check if current section is accessible
    const sectionFeatureMap = {
      "dashboard": features.dashboard,
      "inventory-dashboard": features.inventory,
      "live-cctv": features.liveCCTV,
      "staff-management": features.staffManagement,
      "performance-analysis": features.performanceAnalysis,
      "business-evaluation": features.businessEvaluation,
    }

    if (!sectionFeatureMap[activeSection]) {
      setActiveSection(defaultSection)
    }
  }, [features])

  const onLogout = () => {
    signOut()
    navigate("/")
  }

  // Check if user has no features at all
  const hasNoFeatures = !getDefaultSection()

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-teal-50">
      <Sidebar
        activeSection={activeSection}
        setActiveSection={setActiveSection}
        onLogout={onLogout}
        features={features}
      />
      <main className="flex-1 p-6 overflow-auto">
        {hasNoFeatures ? (
          <div className="p-6 bg-white/80 backdrop-blur-sm rounded-2xl border border-white/50 shadow-lg">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-red-600 to-pink-600 bg-clip-text text-transparent mb-4">No Features Available</h1>
            <p className="text-gray-600">No features are available for your account. Please contact your administrator.</p>
          </div>
        ) : (
          <>
            {activeSection === "dashboard" && features.dashboard && <DashboardOverview />}
            {activeSection === "inventory-dashboard" && features.inventory && <InventoryDashboard />}
            {activeSection === "live-cctv" && features.liveCCTV && <LiveCCTV />}
            {activeSection === "staff-management" && features.staffManagement && <EmployeeManagement />}
            {activeSection === "performance-analysis" && features.performanceAnalysis && <PerformanceAnalysis />}
            {activeSection === "business-evaluation" && features.businessEvaluation && <BusinessEvaluation />}
          </>
        )}
      </main>
    </div>
  )
}
