import express from 'express';
import PurchaseOrder from '../models/PurchaseOrder.js';
import Ingredient from '../models/Ingredient.js';

const router = express.Router();

// Create PO
router.post('/', async (req, res) => {
  try {
    const po = await PurchaseOrder.create(req.body);
    res.json(po);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create purchase order' });
  }
});

// List POs
router.get('/', async (req, res) => {
  try {
    const list = await PurchaseOrder.find().populate('supplier').populate('items.ingredient').lean();
    res.json(list);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch purchase orders' });
  }
});

// Mark received -> update stock for items
router.post('/:id/receive', async (req, res) => {
  try {
    const po = await PurchaseOrder.findById(req.params.id);
    if (!po) return res.status(404).json({ error: 'PO not found' });
    if (po.status === 'RECEIVED') return res.json({ ok: true, po });

    // update ingredient stock
    for (const it of po.items) {
      if (it.ingredient) {
        const ing = await Ingredient.findById(it.ingredient);
        if (ing) {
          ing.stock = (ing.stock || 0) + Number(it.qty || 0);
          if (it.pricePerUnit) ing.costPerUnit = Number(it.pricePerUnit);
          await ing.save();
        }
      } else if (it.name) {
        // try to find by name
        const ing = await Ingredient.findOne({ name: new RegExp(`^${it.name}$`, 'i') });
        if (ing) {
          ing.stock = (ing.stock || 0) + Number(it.qty || 0);
          await ing.save();
        }
      }
    }

    po.status = 'RECEIVED';
    po.receivedAt = new Date();
    await po.save();
    res.json({ ok: true, po });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to receive PO' });
  }
});

export default router;
