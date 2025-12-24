import express from 'express';
import Menu from '../models/Menu.js';
import Ingredient from '../models/Ingredient.js';

const router = express.Router();

// Create menu
router.post('/', async (req, res) => {
  try {
    const menu = await Menu.create(req.body);
    return res.json(menu);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create menu' });
  }
});

// List menus
router.get('/', async (req, res) => {
  try {
    const menus = await Menu.find().lean();
    res.json(menus);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch menus' });
  }
});

// Update
router.put('/:id', async (req, res) => {
  try {
    const menu = await Menu.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(menu);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update menu' });
  }
});

// Delete
router.delete('/:id', async (req, res) => {
  try {
    await Menu.findByIdAndDelete(req.params.id);
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete menu' });
  }
});

export default router;
