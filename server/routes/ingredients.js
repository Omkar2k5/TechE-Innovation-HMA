import express from 'express';
import Ingredient from '../models/Ingredient.js';

const router = express.Router();

// Create ingredient
router.post('/', async (req, res) => {
  try {
    const ing = await Ingredient.create(req.body);
    res.json(ing);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create ingredient' });
  }
});

// List ingredients
router.get('/', async (req, res) => {
  try {
    const list = await Ingredient.find().populate('supplier').lean();
    res.json(list);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch ingredients' });
  }
});

// Update ingredient
router.put('/:id', async (req, res) => {
  try {
    const ing = await Ingredient.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(ing);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update ingredient' });
  }
});

// Adjust stock (manual)
router.post('/:id/adjust', async (req, res) => {
  const { delta, reason } = req.body;
  try {
    const ing = await Ingredient.findById(req.params.id);
    if (!ing) return res.status(404).json({ error: 'Not found' });
    ing.stock = (ing.stock || 0) + Number(delta || 0);
    await ing.save();
    res.json({ ok: true, ingredient: ing });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to adjust stock' });
  }
});

export default router;
