"use client"

import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../../auth/AuthContext"

const LoginPage = () => {
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const [role, setRole] = useState("receptionist")
  const [hotelId, setHotelId] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)

  const onSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    await signIn({ hotelId, email, password, role })
    setLoading(false)
    navigate(`/${role}`)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
      <div className="w-full max-w-md bg-white rounded-2xl shadow p-6">
        <h1 className="text-xl font-semibold text-slate-800 mb-4">Sign in</h1>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-slate-600 mb-1">Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full rounded-md border-slate-300 focus:border-slate-500 focus:ring-slate-500"
            >
              <option value="receptionist">Receptionist</option>
              <option value="cook">Cook</option>
              <option value="owner">Owner</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-slate-600 mb-1">HOTEL ID</label>
            <input
              value={hotelId}
              onChange={(e) => setHotelId(e.target.value)}
              className="w-full rounded-md border-slate-300 focus:border-slate-500 focus:ring-slate-500"
            />
          </div>
          <div>
            <label className="block text-sm text-slate-600 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-md border-slate-300 focus:border-slate-500 focus:ring-slate-500"
            />
          </div>
          <div>
            <label className="block text-sm text-slate-600 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-md border-slate-300 focus:border-slate-500 focus:ring-slate-500"
            />
          </div>
          <button
            disabled={loading || !hotelId || !email || !password}
            className="w-full px-4 py-2 rounded-md bg-slate-800 text-white disabled:opacity-50"
          >
            {loading ? "Signing In…" : "Sign In"}
          </button>
        </form>

        {/* Forgot Password Link */}
        <div className="mt-6 text-center">
          <button
            onClick={() => navigate("/forgot-password")}
            className="text-slate-600 hover:text-slate-800 text-sm font-medium transition-colors"
          >
            Forgot your password?
          </button>
        </div>
      </div>
    </div>
  )
}

export default LoginPage
