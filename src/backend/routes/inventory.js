import express from "express";
import Inventory from "../models/Inventory.js";
import Menu from "../models/Menu.js";

const router = express.Router();

// Get all inventory items
router.get("/", async (req, res) => {
  try {
    const items = await Inventory.find().sort({ name: 1 });
    res.json(items);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/aggregated", async (req, res) => {
  try {
    const menus = await Menu.find({ active: true });
    const aggregated = {};

    // Aggregate ingredients from all active menu items
    menus.forEach((menu) => {
      if (menu.ingredients && menu.ingredients.length > 0) {
        menu.ingredients.forEach((ing) => {
          const key = ing.name.toLowerCase();
          if (!aggregated[key]) {
            aggregated[key] = {
              name: ing.name,
              totalRequired: 0,
              unit: ing.unit || "grams",
              usedInDishes: [],
            };
          }
          aggregated[key].totalRequired += ing.quantity || 0;
          aggregated[key].usedInDishes.push({
            dishName: menu.name,
            quantity: ing.quantity || 0,
          });
        });
      }
    });

    // Get current stock from inventory
    const inventoryItems = await Inventory.find();
    const result = Object.values(aggregated).map((item) => {
      const inventoryItem = inventoryItems.find(
        (inv) => inv.name.toLowerCase() === item.name.toLowerCase()
      );
      return {
        ...item,
        currentStock: inventoryItem?.stock || 0,
        costPerUnit: inventoryItem?.costPerUnit || 0,
        lowStockThreshold: inventoryItem?.lowStockThreshold || 5,
        _id: inventoryItem?._id,
      };
    });

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create inventory item
router.post("/", async (req, res) => {
  try {
    const item = new Inventory(req.body);
    await item.save();
    res.status(201).json(item);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update inventory item
router.put("/:id", async (req, res) => {
  try {
    const item = await Inventory.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: Date.now() },
      { new: true, runValidators: true }
    );
    if (!item) return res.status(404).json({ error: "Item not found" });
    res.json(item);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete inventory item
router.delete("/:id", async (req, res) => {
  try {
    const item = await Inventory.findByIdAndDelete(req.params.id);
    if (!item) return res.status(404).json({ error: "Item not found" });
    res.json({ message: "Item deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Deduct stock for ingredients
router.post("/deduct", async (req, res) => {
  try {
    const { ingredients } = req.body; // Array of { name, quantity }

    const results = [];
    for (const ing of ingredients) {
      const item = await Inventory.findOne({
        name: { $regex: new RegExp(`^${ing.name}$`, "i") },
      });

      if (item) {
        item.stock = Math.max(0, item.stock - ing.quantity);
        await item.save();
        results.push({ name: ing.name, newStock: item.stock });
      } else {
        results.push({ name: ing.name, error: "Not found in inventory" });
      }
    }

    res.json({ message: "Stock deducted", results });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Report shortage
router.post("/shortage", async (req, res) => {
  try {
    const { name, qty } = req.body;
    console.log(`Shortage reported: ${name}${qty ? ` (${qty})` : ""}`);
    // In a real app, you might send notifications or create shortage records
    res.json({ message: "Shortage reported successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Sync from menu
router.post("/sync-from-menu", async (req, res) => {
  try {
    const menus = await Menu.find();
    const syncResults = [];

    for (const menu of menus) {
      if (menu.ingredients && menu.ingredients.length > 0) {
        for (const ing of menu.ingredients) {
          const existing = await Inventory.findOne({
            name: { $regex: new RegExp(`^${ing.name}$`, "i") },
          });

          if (!existing) {
            const newItem = await Inventory.create({
              name: ing.name,
              unit: ing.unit || "grams",
              stock: 0,
              category: "Ingredient",
              lowStockThreshold: 100,
            });
            syncResults.push({
              ingredient: ing.name,
              action: "created",
              item: newItem,
            });
          } else {
            syncResults.push({ ingredient: ing.name, action: "already exists" });
          }
        }
      }
    }

    res.json({ message: "Sync completed", results: syncResults });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
