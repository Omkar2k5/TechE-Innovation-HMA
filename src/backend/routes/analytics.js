import express from "express";
import Inventory from "../models/Inventory.js";
import Menu from "../models/Menu.js";

const router = express.Router();

// GET /api/analytics/inventory-summary
router.get("/inventory-summary", async (req, res) => {
  try {
    console.log("Fetching inventory summary...");

    // Get all inventory items
    const items = await Inventory.find();

    // Find low stock items (stock < 100 units)
    const lowStock = items.filter((item) => item.stock < 100);

    // Calculate usage from menu items
    const menus = await Menu.find();
    const usage = {};

    menus.forEach((menu) => {
      if (menu.ingredients && Array.isArray(menu.ingredients)) {
        menu.ingredients.forEach((ing) => {
          const name = ing.name || "Unknown";
          const qty = Number(ing.quantity || ing.qty || 0);
          usage[name] = (usage[name] || 0) + qty;
        });
      }
    });

    console.log("Inventory summary calculated:", {
      lowStockCount: lowStock.length,
      usageItems: Object.keys(usage).length,
    });

    res.json({
      lowStock,
      usage,
    });
  } catch (error) {
    console.error("Error fetching inventory summary:", error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
