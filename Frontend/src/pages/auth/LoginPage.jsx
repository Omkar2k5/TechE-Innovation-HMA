"use client"

import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../../auth/AuthContext"
import hotelLobbyImage from "../../assets/hotel-lobby.png"

const LoginPage = () => {
  const { signIn, error, clearError } = useAuth()
  const navigate = useNavigate()
  const [role, setRole] = useState("receptionist")
  const [hotelId, setHotelId] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [loginError, setLoginError] = useState(null)

  const onSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setLoginError(null)
    clearError()

    try {
      const response = await signIn({ hotelId, email, password, role })
      const features = response.user?.features || {}

      // For cook role - check if they have any features
      if (role === 'cook') {
        if (!features.dashboard) {
          setLoginError('Dashboard feature is not available for you. Please contact your administrator.')
          setLoading(false)
          return
        }
        navigate('/cook')
        return
      }

      // For receptionist - redirect to first available feature
      if (role === 'receptionist') {
        if (features.dashboard !== false) {
          navigate('/receptionist')
        } else if (features.reservations) {
          navigate('/receptionist/reservations')
        } else if (features.ordersBilling) {
          navigate('/receptionist/billing')
        } else if (features.reports) {
          navigate('/receptionist/reports')
        } else {
          setLoginError('No features are available for your account. Please contact your administrator.')
          setLoading(false)
          return
        }
        return
      }

      // For owner - redirect to first available feature
      if (role === 'owner') {
        navigate('/owner')
        return
      }

      // Default fallback
      navigate(`/${role}`)
    } catch (err) {
      setLoginError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ backgroundColor: '#E8E4DD' }}>
      {/* Main Card Container */}
      <div className="w-full max-w-5xl bg-white rounded-3xl shadow-xl overflow-hidden flex flex-col lg:flex-row">

        {/* Left Side - Illustration */}
        <div className="lg:w-1/2 relative">
          <img
            src={hotelLobbyImage}
            alt="Hotel Lobby Illustration"
            className="w-full h-full object-cover min-h-[300px] lg:min-h-full"
          />
        </div>

        {/* Right Side - Login Form */}
        <div className="lg:w-1/2 p-8 lg:p-12 flex flex-col justify-center">
          {/* Title */}
          <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-8">
            Hotel System Login
          </h1>

          {/* Error Display */}
          {(loginError || error) && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm mb-4">
              {loginError || error}
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={onSubmit} className="space-y-4">
            {/* Role Selector */}
            <div>
              <label className="block text-sm text-gray-600 mb-1">Role</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="receptionist">Receptionist</option>
                <option value="cook">Cook</option>
                <option value="manager">Manager</option>
                <option value="owner">Owner</option>
              </select>
            </div>

            {/* Hotel ID */}
            <div>
              <label className="block text-sm text-gray-600 mb-1">HOTEL ID</label>
              <input
                type="text"
                value={hotelId}
                onChange={(e) => setHotelId(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm text-gray-600 mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm text-gray-600 mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || !hotelId || !email || !password}
              className="w-full py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? "Signing In…" : "Sign In"}
            </button>
          </form>

          {/* Forgot Password Link */}
          <div className="mt-6 text-center">
            <button
              onClick={() => navigate("/forgot-password")}
              className="text-gray-500 hover:text-blue-600 text-sm font-medium transition-colors"
            >
              Forgot your password?
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LoginPage
