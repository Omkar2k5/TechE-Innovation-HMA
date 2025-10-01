"use client"

import { useState } from "react"

function SendPasswordForm({ title, placeholderName, placeholderEmail, onSend }) {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [sending, setSending] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSending(true)
    console.log("[v0] Receptionist clicked Send Password:", { role: title, name, email })
    setTimeout(() => {
      alert(`Password sent to ${email}`)
      setSending(false)
      setName("")
      setEmail("")
      onSend?.({ name, email })
    }, 500)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 bg-white border rounded-lg p-4">
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
        className="px-4 py-2 rounded-md bg-slate-800 text-white disabled:opacity-50"
      >
        {sending ? "Sending…" : "Send Password"}
      </button>
    </form>
  )
}

export default function EmployeesPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-slate-800">Add Employee</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h2 className="text-lg font-medium mb-2">Add Manager</h2>
          <SendPasswordForm title="manager" placeholderName="Manager name" placeholderEmail="manager@example.com" />
        </div>

        <div>
          <h2 className="text-lg font-medium mb-2">Add Cook</h2>
          <SendPasswordForm title="cook" placeholderName="Cook name" placeholderEmail="cook@example.com" />
        </div>
      </div>
    </div>
  )
}
