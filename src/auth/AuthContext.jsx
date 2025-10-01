import React, { createContext, useContext, useMemo, useState } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'

const AuthContext = createContext(undefined)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)

  const signIn = async ({ hotelId, email, password, role }) => {
    await new Promise((r) => setTimeout(r, 500))
    setUser({ hotelId, email, role })
  }

  const signOut = () => setUser(null)

  const value = useMemo(() => ({ user, signIn, signOut }), [user])
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

export const RequireRole = ({ role }) => {
  const { user } = useAuth()
  const location = useLocation()

  if (!user) return <Navigate to="/" state={{ from: location }} replace />
  if (user.role !== role) return <Navigate to={`/${user.role}`} replace />
  return <Outlet />
}
