"use client"

import { Route, Routes, Navigate } from "react-router-dom"
import React from "react"
import LoginPage from "./pages/auth/LoginPage.jsx"
import ForgotPassword from "./pages/auth/ForgotPassword.jsx"
import ResetPassword from "./pages/auth/ResetPassword.jsx"
import ReceptionistLayout from "./layouts/ReceptionistLayout.jsx"
import CookLayout from "./layouts/CookLayout.jsx"
import ReceptionistDashboard from "./pages/receptionist/Dashboard.jsx"
import ReservationsPage from "./pages/receptionist/Reservations.jsx"
import TablesPage from "./pages/receptionist/Tables.jsx"
import TablesDashboard from "./pages/receptionist/TablesDashboard.jsx"
import BillingPage from "./pages/receptionist/Billing.jsx"
import ReportsPage from "./pages/receptionist/Reports.jsx"
import ReceptionistEmployees from "./pages/receptionist/Employees.jsx"
import MenuManagement from "./pages/receptionist/MenuManagement.jsx"
import CookDashboard from "./pages/cook/Dashboard.jsx"
import AdminDashboard from "./pages/admin/Dashboard.jsx"
import { AuthProvider, RequireRole } from "./auth/AuthContext.jsx"
import MenuApp from "./simple-menu/MenuApp.jsx"

// Simple error boundary to catch and display runtime errors
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }
  static getDerivedStateFromError(error) {
    return { error }
  }
  componentDidCatch(error, errorInfo) {
    // Optionally log errorInfo
    // console.error(error, errorInfo)
  }
  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: 32, color: "red", background: "#fff", fontFamily: "monospace" }}>
          <h2>App Error</h2>
          <pre>{this.state.error.toString()}</pre>
          <button onClick={() => this.setState({ error: null })}>Try Again</button>
        </div>
      )
    }
    return this.props.children
  }
}

function App() {
  console.log("App.jsx: App render start")

  return (
    <ErrorBoundary>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<LoginPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          <Route element={<RequireRole role="receptionist" />}>
            <Route path="/receptionist" element={<ReceptionistLayout />}>
              <Route index element={<ReceptionistDashboard />} />
              <Route path="reservations" element={<ReservationsPage />} />
              <Route path="billing" element={<BillingPage />} />
              <Route path="reports" element={<ReportsPage />} />
              <Route path="employees" element={<ReceptionistEmployees />} />
              <Route path="menu" element={<MenuManagement />} />
            </Route>
          </Route>

          <Route element={<RequireRole role="cook" />}>
            <Route path="/cook" element={<CookLayout />}>
              <Route index element={<CookDashboard />} />
            </Route>
          </Route>

          <Route element={<RequireRole role="owner" />}>
            <Route path="/owner" element={<AdminDashboard />} />
          </Route>

          {/* Minimal menu app (no auth required) */}
          <Route path="/menu" element={<MenuApp />} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </ErrorBoundary>
  )
}

export default App
