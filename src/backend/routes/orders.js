import express from "express";
import Order from "../models/Order.js";
import Menu from "../models/Menu.js";
import Inventory from "../models/Inventory.js";

const router = express.Router();

// Get all orders
router.get("/", async (req, res) => {
  try {
    const orders = await Order.find().populate("items.menuId").sort({ receivedAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get pending/active orders for cook
router.get("/active", async (req, res) => {
  try {
    const orders = await Order.find({
      status: { $in: ["pending", "in_progress", "ready"] },
    })
      .populate("items.menuId")
      .sort({ priority: 1, receivedAt: 1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create order
router.post("/", async (req, res) => {
  try {
    const { tableNumber, items, priority } = req.body;

    if (!tableNumber) {
      return res.status(400).json({ error: "Table number is required" });
    }

    if (!items || items.length === 0) {
      return res.status(400).json({ error: "Order must contain at least one item" });
    }

    let totalAmount = 0;
    const orderItems = [];
    const ingredientsToDeduct = [];

    for (const item of items) {
      const menu = await Menu.findById(item.menuId);
      if (!menu) {
        return res.status(404).json({ error: `Menu item ${item.menuId} not found` });
      }

      const qty = item.quantity || item.qty || 1;
      totalAmount += menu.price * qty;

      orderItems.push({
        menuId: menu._id,
        name: menu.name,
        qty,
        price: menu.price,
        status: "pending",
        fastPrep: (menu.avgPrepTimeMins || 0) <= 10,
      });

      if (menu.ingredients && menu.ingredients.length > 0) {
        menu.ingredients.forEach((ing) => {
          ingredientsToDeduct.push({
            name: ing.name,
            quantity: ing.quantity * qty,
            unit: ing.unit,
          });
        });
      }
    }

    const order = new Order({
      table: tableNumber,
      priority: priority || "normal",
      items: orderItems,
      totalAmount,
      status: "pending",
    });

    await order.save();

    const deductionResults = [];
    for (const ing of ingredientsToDeduct) {
      const inventoryItem = await Inventory.findOne({
        name: { $regex: new RegExp(`^${ing.name}$`, "i") },
      });

      if (inventoryItem) {
        const previousStock = inventoryItem.stock;
        inventoryItem.stock = Math.max(0, inventoryItem.stock - ing.quantity);
        await inventoryItem.save();

        deductionResults.push({
          ingredient: ing.name,
          deducted: ing.quantity,
          previousStock,
          newStock: inventoryItem.stock,
        });

        if (inventoryItem.stock <= inventoryItem.lowStockThreshold) {
          console.log(`[WARNING] Low stock for ${ing.name}: ${inventoryItem.stock} ${inventoryItem.unit}`);
        }
      } else {
        console.log(`[WARNING] Ingredient ${ing.name} not found in inventory`);
        deductionResults.push({
          ingredient: ing.name,
          error: "Not found in inventory",
        });
      }
    }

    res.status(201).json({
      order,
      inventoryDeductions: deductionResults,
    });
  } catch (error) {
    console.error("[ERROR] Order creation failed:", error);
    res.status(400).json({ error: error.message });
  }
});

// Update order item status
router.put("/:orderId/items/:itemIndex", async (req, res) => {
  try {
    const { orderId, itemIndex } = req.params;
    const { status } = req.body;

    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ error: "Order not found" });

    if (itemIndex >= order.items.length) {
      return res.status(400).json({ error: "Invalid item index" });
    }

    order.items[itemIndex].status = status;

    const allReady = order.items.every((item) => item.status === "ready" || item.status === "served");
    const anyInProgress = order.items.some((item) => item.status === "in_progress");

    if (allReady) {
      order.status = "ready";
    } else if (anyInProgress) {
      order.status = "in_progress";
    }

    await order.save();
    res.json(order);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Mark order as ready
router.post("/:id/ready", async (req, res) => {
  try {
    const order = await Order.findByIdAndUpdate(req.params.id, { status: "ready" }, { new: true });
    if (!order) return res.status(404).json({ error: "Order not found" });
    res.json(order);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Push ready items notification
router.post("/:id/push-ready", async (req, res) => {
  try {
    console.log(`Ready items pushed for order ${req.params.id}`);
    res.json({ message: "Notification sent" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Complete order
router.put("/:id/complete", async (req, res) => {
  try {
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status: "completed", completedAt: Date.now() },
      { new: true }
    );
    if (!order) return res.status(404).json({ error: "Order not found" });
    res.json(order);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
