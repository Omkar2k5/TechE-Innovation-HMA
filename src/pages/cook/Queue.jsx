"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import api from "../../lib/api.js"

const priorityWeight = (p) => {
  if (!p) return 1
  const v = String(p).toLowerCase()
  if (v === "high") return 0
  if (v === "low") return 2
  return 1
}

function playBeep(duration = 140, frequency = 880) {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext
    const ctx = new AudioCtx()
    const o = ctx.createOscillator()
    const g = ctx.createGain()
    o.type = "sine"
    o.frequency.value = frequency
    o.connect(g)
    g.connect(ctx.destination)
    o.start()
    g.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + duration / 1000)
    setTimeout(() => {
      o.stop()
      ctx.close()
    }, duration + 20)
  } catch {}
}

async function notify(title, body) {
  try {
    if (!("Notification" in window)) return
    let perm = Notification.permission
    if (perm !== "granted") {
      perm = await Notification.requestPermission()
    }
    if (perm === "granted") {
      new Notification(title, { body })
    }
  } catch {}
}

function Timer({ since }) {
  const [now, setNow] = useState(Date.now())
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])
  const diff = Math.max(0, Math.floor((now - new Date(since).getTime()) / 1000))
  const mm = Math.floor(diff / 60)
  const ss = diff % 60
  const formatted = `${String(mm).padStart(2, "0")}:${String(ss).padStart(2, "0")}`
  return <span className="font-mono text-base font-bold text-white">{formatted}</span>
}

function ItemRow({ item, onUpdate, onShortage }) {
  const isCooking = item.status === "in_progress"
  const isReady = item.status === "ready"

  return (
    <div key={item.id} className="bg-white rounded-xl border-2 border-slate-200 p-6">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-slate-900 font-semibold text-lg">{item.name}</div>
          <div className="text-slate-500 text-sm mt-2">Qty: {item.quantity || 1}</div>
        </div>
        <div>
          <span
            className={`inline-flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-semibold border-2 ${
              item.status === "pending"
                ? "bg-amber-50 text-amber-800 border-amber-200"
                : item.status === "in_progress"
                  ? "bg-blue-50 text-blue-800 border-blue-200"
                  : "bg-green-50 text-green-800 border-green-200"
            }`}
          >
            {item.status === "pending" && "PENDING"}
            {item.status === "in_progress" && "COOKING"}
            {item.status === "ready" && "READY"}
          </span>
        </div>
      </div>

      <div className="mt-5 flex items-center gap-4">
        <button
          className={`h-12 px-5 rounded-lg text-base font-medium border-2 transition-all ${
            isCooking
              ? "bg-blue-600 text-white border-blue-600"
              : "bg-white text-blue-700 border-blue-300 hover:bg-blue-50"
          }`}
          onClick={() => onUpdate({ status: "in_progress" })}
        >
          Cooking
        </button>
        <button
          className={`h-12 px-5 rounded-lg text-base font-medium border-2 transition-all ${
            isReady
              ? "bg-green-600 text-white border-green-600"
              : "bg-white text-green-700 border-green-300 hover:bg-green-50"
          }`}
          onClick={() => onUpdate({ status: "ready" })}
        >
          ✓ Ready
        </button>
        <button
          className="ml-auto h-12 px-5 rounded-lg text-base font-medium border-2 bg-white text-amber-700 border-amber-300 hover:bg-amber-50 transition-all"
          title="Report shortage"
          onClick={onShortage}
        >
          ⚠️
        </button>
      </div>
    </div>
  )
}

function ShortageModal({ open, onClose, onSubmit }) {
  const [name, setName] = useState("")
  const [qty, setQty] = useState("")
  useEffect(() => {
    if (open) {
      setName("")
      setQty("")
    }
  }, [open])
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl border-2 border-slate-200 p-6 w-full max-w-md">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
            <span className="text-2xl">⚠️</span>
          </div>
          <h3 className="text-2xl font-bold text-slate-900">Ingredient Shortage</h3>
        </div>
        <p className="text-slate-600 mb-4">Notify the inventory team about a missing or low ingredient.</p>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Ingredient Name</label>
            <input
              className="w-full px-4 py-3 rounded-lg border-2 border-slate-300 focus:border-red-500 focus:ring-2 focus:ring-red-200 outline-none transition-all text-lg"
              placeholder="e.g., Tomatoes, Paneer"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Quantity Needed (Optional)</label>
            <input
              className="w-full px-4 py-3 rounded-lg border-2 border-slate-300 focus:border-red-500 focus:ring-2 focus:ring-red-200 outline-none transition-all text-lg"
              placeholder="e.g., 5 kg"
              type="number"
              value={qty}
              onChange={(e) => setQty(e.target.value)}
            />
          </div>
        </div>
        <div className="mt-6 flex gap-3">
          <button
            className="flex-1 px-4 py-3 rounded-lg border-2 border-slate-300 bg-white hover:bg-slate-50 font-medium text-slate-700 transition-all"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            className="flex-1 px-4 py-3 rounded-lg bg-red-600 hover:bg-red-700 text-white font-medium shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            onClick={() => {
              onSubmit({ name: name.trim(), qty: qty === "" ? null : Number(qty) })
            }}
            disabled={!name.trim()}
          >
            Report Shortage
          </button>
        </div>
      </div>
    </div>
  )
}

export default function CookQueue() {
  const [orders, setOrders] = useState([])
  const [notice, setNotice] = useState("")
  const [showShortage, setShowShortage] = useState(false)
  const shortagePayloadRef = useRef({ order: null, item: null })

  useEffect(() => {
    let mounted = true
    const fetchOrders = async () => {
      try {
        const res = await api.get("/orders")
        if (!mounted) return
        console.log("Fetched orders:", res.data)
        setOrders(res.data || [])
      } catch (err) {
        console.error("Failed to fetch orders:", err)
      }
    }
    fetchOrders()
    const id = setInterval(fetchOrders, 5000) // Poll every 5 seconds
    return () => {
      mounted = false
      clearInterval(id)
    }
  }, [])

  const sorted = useMemo(() => {
    const arr = [...orders]
    arr.sort((a, b) => {
      const pa = priorityWeight(a.priority)
      const pb = priorityWeight(b.priority)
      if (pa !== pb) return pa - pb
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    })
    return arr
  }, [orders])

  const filtered = useMemo(() => {
    return sorted
  }, [sorted])

  const updateOrderItem = async (orderId, itemIndex, patch) => {
    try {
      const order = orders.find((o) => o._id === orderId)
      if (!order) return

      const updatedItems = order.items.map((it, idx) => (idx === itemIndex ? { ...it, ...patch } : it))

      await api.put(`/orders/${orderId}`, { items: updatedItems })

      setOrders((prev) =>
        prev.map((o) => {
          if (o._id !== orderId) return o
          const items = updatedItems
          const updated = { ...o, items }

          const allReadyOrServed = items.length > 0 && items.every((it) => ["ready", "served"].includes(it.status))
          if (allReadyOrServed) {
            playBeep()
            notify("Order complete", `Order #${o.orderNumber} is ready.`)
            setNotice(`Order #${o.orderNumber} is ready.`)
            setTimeout(() => setNotice(""), 2500)
          }
          return updated
        }),
      )
    } catch (err) {
      console.error("Failed to update order item:", err)
      alert("Failed to update order status")
    }
  }

  const pushReadyToManager = (order) => {
    playBeep()
    notify("Ready items pushed", `Order #${order.orderNumber}: notify manager`)
    setNotice(`Pushed ready items for order #${order.orderNumber}`)
    setTimeout(() => setNotice(""), 2000)
  }

  const openShortage = (order, item) => {
    shortagePayloadRef.current = { order, item }
    setShowShortage(true)
  }

  const submitShortage = async ({ name, qty }) => {
    setShowShortage(false)
    try {
      await api.post("/inventory/shortage", { name, qty })
      setNotice(`Shortage reported: ${name}${qty ? ` (qty ${qty})` : ""}`)
      setTimeout(() => setNotice(""), 2000)
    } catch (err) {
      console.error("Failed to report shortage:", err)
    }
  }

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        {notice && (
          <div className="mb-6 p-4 rounded-xl border-2 bg-blue-50 border-blue-200 text-blue-900 text-base font-medium">
            {notice}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
          {filtered.map((o) => (
            <div key={o._id} className="rounded-2xl overflow-hidden shadow-xl bg-slate-800">
              <div className="flex items-center justify-between px-6 py-5 text-white">
                <div className="font-semibold">
                  <div className="text-2xl">Table {o.tableNumber ?? "-"}</div>
                  <div className="flex items-center gap-2 text-sm opacity-90 mt-2">
                    <span>👨‍🍳</span>
                    <Timer since={o.createdAt} />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-3 py-2 rounded-lg bg-slate-700 text-sm font-semibold">#{o.orderNumber}</span>
                </div>
              </div>

              <div className="p-6 space-y-5">
                {(o.items || []).map((item, idx) => (
                  <ItemRow
                    key={idx}
                    item={item}
                    onUpdate={(patch) => updateOrderItem(o._id, idx, patch)}
                    onShortage={() => openShortage(o, item)}
                  />
                ))}
              </div>

              <div className="px-6 pb-6">
                {(o.items || []).some((it) => it.status === "ready") && (
                  <button
                    className="w-full h-12 rounded-lg text-base font-semibold bg-slate-900 text-white hover:bg-slate-700 transition"
                    onClick={() => pushReadyToManager(o)}
                  >
                    Notify Manager
                  </button>
                )}
              </div>
            </div>
          ))}

          {filtered.length === 0 && (
            <div className="col-span-full text-center py-16 bg-white rounded-2xl border-2 border-slate-200">
              <div className="text-slate-600 text-lg">No orders</div>
            </div>
          )}
        </div>

        <ShortageModal open={showShortage} onClose={() => setShowShortage(false)} onSubmit={submitShortage} />
      </div>
    </div>
  )
}
