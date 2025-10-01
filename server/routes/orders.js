import express from 'express';
import Order from '../models/Order.js';
import Menu from '../models/Menu.js';
import Ingredient from '../models/Ingredient.js';

const router = express.Router();

// Create order and deduct inventory
router.post('/', async (req, res) => {
  try {
    const { items } = req.body;
    const order = await Order.create({ items });

    // Deduct ingredients based on menu recipes
    for (const it of items) {
      if (!it.menuId) continue;
      const menu = await Menu.findById(it.menuId).lean();
      if (!menu || !menu.ingredients) continue;
      for (const ing of menu.ingredients) {
        // find ingredient by name
        const dbIng = await Ingredient.findOne({ name: new RegExp(`^${ing.name}$`, 'i') });
        if (dbIng) {
          dbIng.stock = (dbIng.stock || 0) - (ing.quantity * (it.qty || 1));
          await dbIng.save();
        }
      }
    }

    res.json(order);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create order' });
  }
});

export default router;
