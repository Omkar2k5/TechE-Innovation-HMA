import { createContext, useContext, useEffect, useMemo, useReducer } from "react"

// In-memory storage (localStorage doesn't work in Claude.ai artifacts)
let memoryStorage = {}

const Storage = {
  getItem(key) {
    return memoryStorage[key] || null
  },
  setItem(key, value) {
    memoryStorage[key] = value
  },
}

const initialState = {
  tables: [
    { id: 1, status: "vacant", waiterId: null, order: null, timer: { running: false, startedAt: null, elapsedSec: 0, reminders: 0 } },
    { id: 2, status: "occupied", waiterId: 2, order: null, timer: { running: false, startedAt: null, elapsedSec: 0, reminders: 0 } },
    { id: 3, status: "ordering", waiterId: 1, order: null, timer: { running: true, startedAt: Date.now(), elapsedSec: 0, reminders: 0 } },
    { id: 4, status: "vacant", waiterId: null, order: null, timer: { running: false, startedAt: null, elapsedSec: 0, reminders: 0 } },
    { id: 5, status: "vacant", waiterId: null, order: null, timer: { running: false, startedAt: null, elapsedSec: 0, reminders: 0 } },
    { id: 6, status: "occupied", waiterId: 3, order: null, timer: { running: false, startedAt: null, elapsedSec: 0, reminders: 0 } },
  ],
  staff: [
    { id: 1, name: "Aarav Sharma", role: "Head Chef", active: true, hourlyRate: 12, clockedInAt: null, minutesToday: 180 },
    { id: 2, name: "Priya Singh", role: "Restaurant Manager", active: true, hourlyRate: 18, clockedInAt: Date.now() - 3600000, minutesToday: 240 },
    { id: 3, name: "Rahul Kumar", role: "Waiter", active: false, hourlyRate: 9, clockedInAt: null, minutesToday: 120 },
  ],
  menu: [
    { id: "cappuccino", name: "Cappuccino", price: 5, recipeCost: 1.8 },
    { id: "soup", name: "Chicken Soup", price: 8, recipeCost: 2.4 },
    { id: "salad", name: "Salad", price: 6, recipeCost: 1.5 },
    { id: "burger", name: "Classic Burger", price: 12, recipeCost: 4.2 },
    { id: "pasta", name: "Pasta Primavera", price: 10, recipeCost: 3.5 },
  ],
  inventory: [
    { id: "coffee-beans", name: "Coffee Beans", stock: 15, min: 10, unit: "kg", costPerUnit: 10, consumption: 2 },
    { id: "milk", name: "Milk (Full Cream)", stock: 5, min: 8, unit: "liters", costPerUnit: 1, consumption: 3 },
    { id: "sugar", name: "Sugar Sachets", stock: 120, min: 100, unit: "pcs", costPerUnit: 0.02, consumption: 25 },
    { id: "cups", name: "Disposable Cups", stock: 30, min: 50, unit: "pcs", costPerUnit: 0.05, consumption: 15 },
    { id: "chicken", name: "Chicken Breast", stock: 8, min: 12, unit: "kg", costPerUnit: 5, consumption: 4 },
    { id: "vegetables", name: "Fresh Vegetables", stock: 25, min: 20, unit: "kg", costPerUnit: 2, consumption: 8 },
  ],
  suppliers: [
    { id: "sup-1", name: "Daily Dairy", items: ["milk"] },
    { id: "sup-2", name: "Brew Bros", items: ["coffee-beans", "cups"] },
    { id: "sup-3", name: "Fresh Farm", items: ["chicken", "vegetables"] },
  ],
  purchaseOrders: [
    { id: "PO-001", supplierId: "sup-1", status: "ordered", createdAt: Date.now() - 86400000 },
    { id: "PO-002", supplierId: "sup-3", status: "delivered", createdAt: Date.now() - 172800000 },
  ],
  cameras: [
    { id: "cam-entrance", name: "Main Entrance", tables: [1, 2], status: "live" },
    { id: "cam-kitchen", name: "Kitchen Area", tables: [3, 4], status: "rec" },
    { id: "cam-dining", name: "Dining Hall", tables: [5, 6], status: "live" },
    { id: "cam-counter", name: "Service Counter", tables: [], status: "rec" },
  ],
  completedOrders: [
    { id: "ord-1", total: 25, startedAt: Date.now() - 1800000, finishedAt: Date.now() - 1500000 },
    { id: "ord-2", total: 18, startedAt: Date.now() - 3600000, finishedAt: Date.now() - 3300000 },
    { id: "ord-3", total: 42, startedAt: Date.now() - 5400000, finishedAt: Date.now() - 5100000 },
    { id: "ord-4", total: 15, startedAt: Date.now() - 7200000, finishedAt: Date.now() - 6900000 },
    { id: "ord-5", total: 33, startedAt: Date.now() - 9000000, finishedAt: Date.now() - 8700000 },
  ],
}

const StoreContext = createContext()

function reducer(state, action) {
  switch (action.type) {
    case "LOAD":
      return action.payload
    case "TOGGLE_TABLE_STATUS": {
      const { id, next } = action
      return { ...state, tables: state.tables.map((t) => (t.id === id ? { ...t, status: next } : t)) }
    }
    case "ASSIGN_WAITER": {
      const { tableId, waiterId } = action
      return { ...state, tables: state.tables.map((t) => (t.id === tableId ? { ...t, waiterId } : t)) }
    }
    case "START_ORDER": {
      const { tableId, notes } = action
      return {
        ...state,
        tables: state.tables.map((t) =>
          t.id === tableId
            ? {
                ...t,
                status: "ordering",
                order: {
                  id: `ord-${Date.now()}`,
                  items: [],
                  notes: notes || "",
                  status: "placed",
                  startedAt: Date.now(),
                },
                timer: { ...t.timer, running: true, startedAt: Date.now() },
              }
            : t,
        ),
      }
    }
    case "ADD_TABLE": {
      const newId = Math.max(...state.tables.map(t => t.id)) + 1
      return {
        ...state,
        tables: [...state.tables, {
          id: newId,
          status: "vacant",
          waiterId: null,
          order: null,
          timer: { running: false, startedAt: null, elapsedSec: 0, reminders: 0 }
        }]
      }
    }
    case "TOGGLE_STAFF_ACTIVE": {
      const { staffId } = action
      return {
        ...state,
        staff: state.staff.map(s => s.id === staffId ? { ...s, active: !s.active } : s)
      }
    }
    case "CLOCK_TOGGLE": {
      const { staffId } = action
      return {
        ...state,
        staff: state.staff.map(s =>
          s.id === staffId
            ? {
                ...s,
                clockedInAt: s.clockedInAt ? null : Date.now(),
                minutesToday: s.clockedInAt
                  ? s.minutesToday + (Date.now() - s.clockedInAt) / 60000
                  : s.minutesToday
              }
            : s
        )
      }
    }
    case "ADJUST_INVENTORY": {
      const { id, delta } = action
      return {
        ...state,
        inventory: state.inventory.map(item =>
          item.id === id
            ? { ...item, stock: Math.max(0, item.stock + delta) }
            : item
        )
      }
    }
    case "CREATE_PO": {
      const { supplierId, items } = action
      const newPO = {
        id: `PO-${String(state.purchaseOrders.length + 1).padStart(3, '0')}`,
        supplierId,
        items,
        status: "ordered",
        createdAt: Date.now()
      }
      return {
        ...state,
        purchaseOrders: [...state.purchaseOrders, newPO]
      }
    }
    case "SET_CAMERA_STATUS": {
      const { id, status } = action
      return {
        ...state,
        cameras: state.cameras.map(cam =>
          cam.id === id ? { ...cam, status } : cam
        )
      }
    }
    default:
      return state
  }
}

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState)

  // Load persisted state
  useEffect(() => {
    const raw = Storage.getItem("hf_state")
    if (raw) {
      try {
        dispatch({ type: "LOAD", payload: JSON.parse(raw) })
      } catch {}
    }
  }, [])

  // Persist on change
  useEffect(() => {
    Storage.setItem("hf_state", JSON.stringify(state))
  }, [state])

  const value = useMemo(() => ({ state, dispatch }), [state])

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useAppStore() {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error("useAppStore must be used within AppProvider")
  return ctx
}

export function useApp() {
  return useAppStore()
}

// Complete color scheme for the app
export const COLORS = {
  // Primary colors
  primary: "#2563eb",
  red: "#ef4444",
  green: "#16a34a",
  gray: "#6b7280",
  black: "#111827",
  white: "#ffffff",

  // Background colors
  bg: "#f8fafc",
  card: "#ffffff",

  // Text colors
  fg: "#1f2937",
  muted: "#6b7280",

  // Border and UI elements
  border: "#e5e7eb",

  // Additional utility colors
  blue: "#3b82f6",
  yellow: "#f59e0b",
  purple: "#8b5cf6",
  pink: "#ec4899",
  indigo: "#6366f1",
  teal: "#14b8a6",
  orange: "#f97316",
}