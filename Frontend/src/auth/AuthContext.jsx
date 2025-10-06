import React, { createContext, useContext, useMemo, useState, useEffect } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import api from '../lib/api'

const AuthContext = createContext(undefined)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Check for stored token on app load
  useEffect(() => {
    const token = localStorage.getItem('authToken')
    const userData = localStorage.getItem('userData')
    
    if (token && userData) {
      try {
        const parsedUser = JSON.parse(userData)
        setUser(parsedUser)
      } catch (err) {
        console.error('Error parsing stored user data:', err)
        localStorage.removeItem('authToken')
        localStorage.removeItem('userData')
      }
    }
    setLoading(false)
  }, [])

  const signIn = async ({ hotelId, email, password, role }) => {
    try {
      setError(null)
      
      const response = await api.post('/auth/login', {
        hotelId,
        role,
        email,
        password
      })

      if (!response) {
        throw new Error('Login failed. Please check your credentials.')
      }

      if (!response.success) {
        throw new Error(response.message || 'Login failed')
      }

      // Store token and user data
      localStorage.setItem('authToken', response.token)
      localStorage.setItem('userData', JSON.stringify({
        ...response.user,
        hotel: response.hotel
      }))

      setUser({
        ...response.user,
        hotel: response.hotel
      })

      return response
    } catch (err) {
      const errorMessage = err.message || 'An error occurred during login'
      setError(errorMessage)
      throw new Error(errorMessage)
    }
  }

  const signOut = () => {
    localStorage.removeItem('authToken')
    localStorage.removeItem('userData')
    setUser(null)
    setError(null)
  }

  const value = useMemo(() => ({ 
    user, 
    signIn, 
    signOut, 
    loading, 
    error, 
    clearError: () => setError(null)
  }), [user, loading, error])
  
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
