import express from 'express';
import Supplier from '../models/Supplier.js';

const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const s = await Supplier.create(req.body);
    res.json(s);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create supplier' });
  }
});

router.get('/', async (req, res) => {
  try {
    const list = await Supplier.find().lean();
    res.json(list);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch suppliers' });
  }
});

export default router;
