import express from "express";
import Menu from "../models/Menu.js";
import Inventory from "../models/Inventory.js";

const router = express.Router();

// Get all menu items
router.get("/", async (req, res) => {
  try {
    const menus = await Menu.find().sort({ createdAt: -1 });
    res.json(menus);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get menu by ID
router.get("/:id", async (req, res) => {
  try {
    const menu = await Menu.findById(req.params.id);
    if (!menu) return res.status(404).json({ error: "Menu not found" });
    res.json(menu);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create menu item
router.post("/", async (req, res) => {
  try {
    const menu = new Menu(req.body);
    await menu.save();

    // Auto-sync ingredients to inventory
    if (menu.ingredients && menu.ingredients.length > 0) {
      for (const ing of menu.ingredients) {
        const existing = await Inventory.findOne({
          name: { $regex: new RegExp(`^${ing.name}$`, "i") },
        });

        if (!existing) {
          await Inventory.create({
            name: ing.name,
            unit: ing.unit || "grams",
            stock: 0,
            category: "Ingredient",
            lowStockThreshold: 100,
          });
        }
      }
    }

    res.status(201).json(menu);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update menu item
router.put("/:id", async (req, res) => {
  try {
    const menu = await Menu.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: Date.now() },
      { new: true, runValidators: true }
    );

    if (!menu) return res.status(404).json({ error: "Menu not found" });

    // Auto-sync ingredients to inventory
    if (menu.ingredients && menu.ingredients.length > 0) {
      for (const ing of menu.ingredients) {
        const existing = await Inventory.findOne({
          name: { $regex: new RegExp(`^${ing.name}$`, "i") },
        });

        if (!existing) {
          await Inventory.create({
            name: ing.name,
            unit: ing.unit || "grams",
            stock: 0,
            category: "Ingredient",
            lowStockThreshold: 100,
          });
        }
      }
    }

    res.json(menu);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete menu item
router.delete("/:id", async (req, res) => {
  try {
    const menu = await Menu.findByIdAndDelete(req.params.id);
    if (!menu) return res.status(404).json({ error: "Menu not found" });
    res.json({ message: "Menu deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get menu items by category
router.get("/category/:category", async (req, res) => {
  try {
    const menus = await Menu.find({
      category: req.params.category,
      active: true,
    });
    res.json(menus);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
