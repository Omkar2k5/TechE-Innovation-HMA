import { Router } from "express";
import Hotel from "../models/Hotel.js";

const router = Router();

// POST /hotels → Add a new hotel document strictly into HMA.hotel_management.hotels
router.post("/", async (req, res, next) => {
  try {
    const data = req.body || {};

    if (!data._id || !data.name || !data.address || !data.contact || !data.taxConfig) {
      return res.status(400).json({ message: "Missing required fields (_id, name, address, contact, taxConfig)." });
    }

    // Use the Mongoose model bound to the exact dotted collection
    const created = await Hotel.create(data);
    return res.status(201).json({ message: "Hotel created", hotel: created });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: "Hotel with this _id already exists" });
    }
    next(err);
  }
});

export default router;