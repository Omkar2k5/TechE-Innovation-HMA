"use client"

import { useState, useEffect, useMemo } from "react"
import api from "../../lib/api.js"

export default function OrderTaking() {
  const [menus, setMenus] = useState([])
  const [cart, setCart] = useState([])
  const [selectedCategory, setSelectedCategory] = useState("All")
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [tableNumber, setTableNumber] = useState("")

  // Fetch menu items from backend
  useEffect(() => {
    const fetchMenus = async () => {
      try {
        setLoading(true)
        console.log("Fetching menu items for order taking...")
        const res = await api.get("/menu")
        console.log("Raw menu response:", res)
        console.log("Fetched menus:", res.data?.length || 0, "items")
        if (res.data && res.data.length > 0) {
          console.log("Sample menu item:", res.data[0])
        } else {
          console.warn("No menu items found! Please add menu items in Menu Management.")
        }
        setMenus(res.data || [])
      } catch (err) {
        console.error("Failed to fetch menus:", err)
        alert("Failed to load menu items. Please check if the backend is running.")
      } finally {
        setLoading(false)
      }
    }
    fetchMenus()
  }, [])

  // Get unique categories
  const categories = useMemo(() => {
    const cats = new Set(menus.map((m) => m.category || "Main Course"))
    return ["All", ...Array.from(cats)]
  }, [menus])

  // Filter menus by category
  const filteredMenus = useMemo(() => {
    if (selectedCategory === "All") return menus.filter((m) => m.active !== false)
    return menus.filter((m) => m.category === selectedCategory && m.active !== false)
  }, [menus, selectedCategory])

  // Add item to cart
  const addToCart = (menu) => {
    setCart((prev) => {
      const existing = prev.find((item) => item._id === menu._id)
      if (existing) {
        return prev.map((item) => (item._id === menu._id ? { ...item, quantity: item.quantity + 1 } : item))
      }
      return [...prev, { ...menu, quantity: 1 }]
    })
  }

  // Update cart item quantity
  const updateQuantity = (id, delta) => {
    setCart((prev) => {
      return prev
        .map((item) => {
          if (item._id === id) {
            const newQty = item.quantity + delta
            return newQty > 0 ? { ...item, quantity: newQty } : item
          }
          return item
        })
        .filter((item) => item.quantity > 0)
    })
  }

  // Remove item from cart
  const removeFromCart = (id) => {
    setCart((prev) => prev.filter((item) => item._id !== id))
  }

  // Calculate total
  const total = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.price * item.quantity, 0)
  }, [cart])

  // Submit order
  const submitOrder = async () => {
    if (!tableNumber.trim()) {
      alert("Please enter a table number")
      return
    }
    if (cart.length === 0) {
      alert("Cart is empty")
      return
    }

    try {
      setSubmitting(true)

      const orderData = {
        tableNumber: tableNumber.trim(),
        items: cart.map((item) => ({
          menuId: item._id,
          name: item.name,
          quantity: item.quantity,
          price: item.price,
        })),
        priority: "normal",
      }

      console.log(" Submitting order:", orderData)
      const response = await api.post("/orders", orderData)
      console.log(" Order response:", response)

      if (response.inventoryDeductions && response.inventoryDeductions.length > 0) {
        const deductionSummary = response.inventoryDeductions
          .map((d) => `${d.ingredient}: ${d.previousStock} → ${d.newStock} ${d.unit || ""}`)
          .join("\n")

        alert(`Order placed successfully for Table ${tableNumber}!\n\nInventory Updated:\n${deductionSummary}`)
      } else {
        alert(`Order placed successfully for Table ${tableNumber}!`)
      }

      setCart([])
      setTableNumber("")
    } catch (err) {
      console.error(" Failed to submit order:", err)
      alert("Failed to place order: " + err.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-600">Loading menu...</div>
      </div>
    )
  }

  if (menus.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <div className="text-xl font-semibold text-gray-700">No Menu Items Available</div>
        <div className="text-gray-600">Please add menu items in the Owner → Menu Management section first.</div>
      </div>
    )
  }

  return (
    <div className="flex gap-6 h-full">
      {/* Menu Section */}
      <div className="flex-1">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Menu</h2>

          {/* Category Filters */}
          <div className="flex flex-wrap gap-2 mb-4">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  selectedCategory === cat ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Menu Items Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredMenus.map((menu) => (
            <div
              key={menu._id}
              className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => addToCart(menu)}
            >
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-semibold text-lg text-gray-900">{menu.name}</h3>
                <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
                  {menu.category || "Main Course"}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xl font-bold text-blue-600">₹{menu.price}</span>
                {menu.avgPrepTimeMins > 0 && (
                  <span className="text-sm text-gray-500">~{menu.avgPrepTimeMins} mins</span>
                )}
              </div>
              {menu.ingredients && menu.ingredients.length > 0 && (
                <div className="text-xs text-gray-500 mt-2">
                  {menu.ingredients.length} ingredient{menu.ingredients.length !== 1 ? "s" : ""}
                </div>
              )}
            </div>
          ))}
        </div>

        {filteredMenus.length === 0 && (
          <div className="text-center py-12 text-gray-500">No items available in this category</div>
        )}
      </div>

      {/* Cart Section */}
      <div className="w-96 bg-white rounded-lg shadow-lg p-6 h-fit sticky top-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Order Cart</h2>

        {/* Table Number Input */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Table Number</label>
          <input
            type="text"
            value={tableNumber}
            onChange={(e) => setTableNumber(e.target.value)}
            placeholder="Enter table number"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Cart Items */}
        <div className="space-y-3 mb-4 max-h-96 overflow-y-auto">
          {cart.map((item) => (
            <div key={item._id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <div className="flex-1">
                <div className="font-medium text-gray-900">{item.name}</div>
                <div className="text-sm text-gray-600">₹{item.price} each</div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => updateQuantity(item._id, -1)}
                  className="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center font-bold"
                >
                  -
                </button>
                <span className="w-8 text-center font-semibold">{item.quantity}</span>
                <button
                  onClick={() => updateQuantity(item._id, 1)}
                  className="w-8 h-8 rounded-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center font-bold"
                >
                  +
                </button>
              </div>
              <button onClick={() => removeFromCart(item._id)} className="text-red-600 hover:text-red-700 font-bold">
                ×
              </button>
            </div>
          ))}
        </div>

        {cart.length === 0 && (
          <div className="text-center py-8 text-gray-500">Cart is empty. Add items from the menu.</div>
        )}

        {/* Total and Submit */}
        {cart.length > 0 && (
          <>
            <div className="border-t pt-4 mb-4">
              <div className="flex justify-between items-center text-xl font-bold">
                <span>Total:</span>
                <span className="text-blue-600">₹{total.toFixed(2)}</span>
              </div>
            </div>

            <button
              onClick={submitOrder}
              disabled={submitting || !tableNumber.trim()}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {submitting ? "Placing Order..." : "Place Order"}
            </button>
          </>
        )}
      </div>
    </div>
  )
}
