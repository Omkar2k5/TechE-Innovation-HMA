import { Router } from "express";
import mongoose from "mongoose";

const router = Router();

// POST /super-admin → Insert into HMA.hotel_management.super-admin
router.post("/", async (req, res, next) => {
  try {
    const data = req.body || {};
    if (!data || Object.keys(data).length === 0) {
      return res.status(400).json({ message: "Payload required" });
    }

    const db = mongoose.connection.db; // connected to HMA by URI
    const col = db.collection("hotel_management.super-admin");

    await col.insertOne(data);
    return res.status(201).json({ message: "Super admin document created", doc: data });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: "Duplicate key error" });
    }
    next(err);
  }
});

export default router;