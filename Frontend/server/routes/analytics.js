import express from 'express';
import Ingredient from '../models/Ingredient.js';
import Order from '../models/Order.js';
import Menu from '../models/Menu.js';

const router = express.Router();

// simple low-stock and usage summary
router.get('/inventory-summary', async (req, res) => {
  try {
    const ingredients = await Ingredient.find().lean();
    const low = ingredients.filter(i => (i.stock || 0) <= (i.lowStockThreshold || 5));

    // usage: count ingredient occurrences in orders (basic)
    const orders = await Order.find().lean();
    const usage = {};
    for (const o of orders) {
      for (const it of o.items || []) {
        const menu = await Menu.findById(it.menuId).lean();
        if (!menu) continue;
        for (const ing of menu.ingredients || []) {
          usage[ing.name] = (usage[ing.name] || 0) + (ing.quantity * (it.qty || 1));
        }
      }
    }

    res.json({ lowStock: low, usage });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to compute analytics' });
  }
});

export default router;
