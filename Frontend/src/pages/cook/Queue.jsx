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

// Cooking Timer Component (matches manager app exactly)
function CookingTimer({ item, orderStartTime }) {
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [isActive, setIsActive] = useState(false)

  useEffect(() => {
    // Calculate start time: use item.startedAt if available, otherwise use order.orderTime.startedPreparationAt
    // This matches the manager app logic exactly
    const itemStartTime = item.startedAt ? new Date(item.startedAt).getTime() : 
                         (orderStartTime ? new Date(orderStartTime).getTime() : null)
    
    // Only show timer if cooking has started and item is not ready
    const shouldShowTimer = itemStartTime && item.status !== 'READY' && item.status !== 'SERVED'
    
    setIsActive(shouldShowTimer)
    
    if (!shouldShowTimer) {
      setElapsedSeconds(0)
      return
    }
    
    // Calculate elapsed time - use the same calculation as manager app
    // Calculate on every render to ensure exact synchronization
    const calculateElapsed = () => {
      const now = Date.now()
      // Use Math.floor to match manager app exactly
      const elapsed = Math.floor((now - itemStartTime) / 1000)
      return Math.max(0, elapsed)
    }
    
    // Set initial value
    setElapsedSeconds(calculateElapsed())
    
    // Update every second - synchronized with manager app
    const interval = setInterval(() => {
      setElapsedSeconds(calculateElapsed())
    }, 1000)
    
    return () => clearInterval(interval)
  }, [item.startedAt, item.status, orderStartTime])

  if (!isActive) {
    if (item.status === 'READY') {
      return (
        <div className="mt-2 flex items-center gap-2 px-2 py-1 bg-green-100 rounded text-xs">
          <span className="text-green-800 font-semibold">✓ Ready</span>
        </div>
      )
    }
    if (item.status === 'PENDING') {
      return (
        <div className="mt-2 flex items-center gap-2 px-2 py-1 bg-amber-100 rounded text-xs">
          <span className="text-amber-800 font-semibold">⏳ Waiting to start</span>
        </div>
      )
    }
    return null
  }

  const minutes = Math.floor(elapsedSeconds / 60)
  const seconds = elapsedSeconds % 60
  const formatted = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`

  return (
    <div className="mt-2 flex items-center gap-2 px-2 py-1 bg-blue-100 rounded text-xs">
      <span className="text-blue-800 font-semibold">⏱️ Cooking Time:</span>
      <span className="text-blue-800 font-mono font-bold">{formatted}</span>
    </div>
  )
}

function ItemRow({ item, orderStartTime, onUpdate, onShortage }) {
  const isCooking = item.status === "PREPARING"
  const isReady = item.status === "READY"

  return (
    <div className="bg-white rounded-xl border-2 border-slate-200 p-6">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="text-slate-900 font-semibold text-lg">{item.itemName || item.name}</div>
          <div className="text-slate-500 text-sm mt-2">Qty: {item.quantity || 1}</div>
          {/* Timer display below each dish - matches manager app */}
          <CookingTimer item={item} orderStartTime={orderStartTime} />
        </div>
        <div>
          <span
            className={`inline-flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-semibold border-2 ${
              item.status === "PENDING"
                ? "bg-amber-50 text-amber-800 border-amber-200"
                : item.status === "PREPARING"
                  ? "bg-blue-50 text-blue-800 border-blue-200"
                  : "bg-green-50 text-green-800 border-green-200"
            }`}
          >
            {item.status === "PENDING" && "PENDING"}
            {item.status === "PREPARING" && "COOKING"}
            {item.status === "READY" && "READY"}
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
          onClick={() => onUpdate({ status: "PREPARING" })}
        >
          Cooking
        </button>
        <button
          className={`h-12 px-5 rounded-lg text-base font-medium border-2 transition-all ${
            isReady
              ? "bg-green-600 text-white border-green-600"
              : "bg-white text-green-700 border-green-300 hover:bg-green-50"
          }`}
          onClick={() => onUpdate({ status: "READY" })}
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
        const res = await api.get("/orders/kitchen")
        if (!mounted) return
        console.log("Fetched orders:", res)
        if (res && res.success && res.data && res.data.orders) {
          setOrders(res.data.orders)
        } else {
          setOrders([])
        }
      } catch (err) {
        console.error("Failed to fetch orders:", err)
        setOrders([])
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
      return new Date(a.orderTime?.placedAt || a.createdAt).getTime() - new Date(b.orderTime?.placedAt || b.createdAt).getTime()
    })
    return arr
  }, [orders])

  const filtered = useMemo(() => {
    return sorted
  }, [sorted])

  const startOrder = async (orderId) => {
    try {
      const response = await api.post(`/orders/${orderId}/start`)
      if (response && response.success) {
        // Refresh orders
        const res = await api.get("/orders/kitchen")
        if (res && res.success && res.data && res.data.orders) {
          setOrders(res.data.orders)
        }
        setNotice(`Order started preparation`)
        setTimeout(() => setNotice(""), 2000)
      }
    } catch (err) {
      console.error("Failed to start order:", err)
      alert("Failed to start order")
    }
  }

  const updateOrderItem = async (orderId, itemIndex, patch) => {
    try {
      const response = await api.put(`/orders/${orderId}/items/${itemIndex}`, patch)
      
      if (response && response.success) {
        // Update local state
        setOrders((prev) =>
          prev.map((o) => {
            if (o.orderId !== orderId) return o
            return response.data.order
          }),
        )

        // Check if order is fully ready
        if (response.data.allReady) {
          playBeep()
          notify("Order complete", `Order ${orderId} is ready.`)
          setNotice(`Order ${orderId} is ready for serving!`)
          setTimeout(() => setNotice(""), 2500)
        }
      }
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
            <div key={o.orderId} className="rounded-2xl overflow-hidden shadow-xl bg-slate-800">
              <div className="flex items-center justify-between px-6 py-5 text-white">
                <div className="font-semibold">
                  <div className="text-2xl">Table {o.tableId ?? "-"}</div>
                  <div className="flex items-center gap-2 text-sm opacity-90 mt-2">
                    <span>👨‍🍳</span>
                    <Timer since={o.orderTime?.placedAt || o.createdAt} />
                  </div>
                  {o.estimatedCompletionTime && (
                    <div className="text-xs opacity-75 mt-1">
                      Est: {new Date(o.estimatedCompletionTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  )}
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span className={`px-3 py-2 rounded-lg text-sm font-semibold ${
                    o.priority === 'URGENT' ? 'bg-red-600' :
                    o.priority === 'HIGH' ? 'bg-orange-600' :
                    'bg-slate-700'
                  }`}>
                    {o.orderId.split('_')[1]?.slice(0, 8)}
                  </span>
                  {o.priority !== 'NORMAL' && (
                    <span className="text-xs px-2 py-1 rounded bg-yellow-500 text-yellow-900 font-bold">
                      {o.priority}
                    </span>
                  )}
                </div>
              </div>

              {/* Start Order Button */}
              {o.orderStatus === 'PENDING' && (
                <div className="px-6 pb-4">
                  <button
                    className="w-full h-12 rounded-lg text-base font-semibold bg-blue-600 text-white hover:bg-blue-700 transition shadow-lg"
                    onClick={() => startOrder(o.orderId)}
                  >
                    👨‍🍳 Start Preparing
                  </button>
                </div>
              )}

              <div className="p-6 space-y-5">
                {(o.orderedItems || []).map((item, idx) => (
                  <div key={idx}>
                    <ItemRow
                      item={item}
                      orderStartTime={o.orderTime?.startedPreparationAt}
                      onUpdate={(patch) => updateOrderItem(o.orderId, idx, patch)}
                      onShortage={() => openShortage(o, item)}
                    />
                    {item.preparationTimeMinutes && (
                      <div className="text-xs text-gray-500 mt-1 ml-1">
                        ⏱️ Prep time: {item.preparationTimeMinutes} min
                      </div>
                    )}
                    {item.specialInstructions && (
                      <div className="text-xs text-amber-600 mt-1 ml-1 font-medium">
                        📝 Note: {item.specialInstructions}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="px-6 pb-6">
                {(o.orderedItems || []).some((it) => it.status === "READY") && (
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
