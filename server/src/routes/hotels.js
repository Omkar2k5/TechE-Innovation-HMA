import { Router } from "express";
import Hotel from "../models/Hotel.js";
import { sendOwnerWelcomeEmail } from "../services/mailer.js";

const router = Router();

// POST /hotels → Add a new hotel document
router.post("/", async (req, res, next) => {
  try {
    const data = req.body || {};

    if (!data._id || !data.name || !data.address || !data.contact || !data.taxConfig) {
      return res.status(400).json({ message: "Missing required fields (_id, name, address, contact, taxConfig)." });
    }

    // Create hotel
    const created = await Hotel.create(data);

    // Extract owner email/password from created doc (if present)
    const ownerRole = (created.roles || []).find((r) => r.role === "owner");
    const ownerEmail = ownerRole?.owner_Email;
    const ownerPassword = ownerRole?.owner_Password;

    // Fire-and-forget: send email with credentials (ignore failures)
    if (ownerEmail && ownerPassword) {
      const dashboardUrl = process.env.DASHBOARD_URL || "http://localhost:5173";
      sendOwnerWelcomeEmail({
        to: ownerEmail,
        hotelId: created._id,
        hotelName: created.name,
        email: ownerEmail,
        password: ownerPassword,
        dashboardUrl,
      }).catch((e) => console.warn("Email send failed:", e.message));
    }

    return res.status(201).json({ message: "Hotel created", hotel: created });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: "Hotel with this _id already exists" });
    }
    next(err);
  }
});

// GET /hotels/:id/features → Fetch minimal hotel info + feature flags
router.get("/:id/features", async (req, res, next) => {
  try {
    const { id } = req.params;
    const hotel = await Hotel.findOne({ _id: id }).select("_id name address contact feature");
    if (!hotel) return res.status(404).json({ message: "Hotel not found" });

    return res.json({
      hotel: {
        _id: hotel._id,
        name: hotel.name,
        address: hotel.address,
        contact: hotel.contact,
      },
      features: hotel.feature || {},
    });
  } catch (err) {
    next(err);
  }
});

// PATCH /hotels/:id/features → Toggle/set a specific feature flag
// Body: { key: string, enabled: boolean }
router.patch("/:id/features", async (req, res, next) => {
  try {
    const { id } = req.params;
    const { key, enabled } = req.body || {};
    if (!key || typeof enabled !== "boolean") {
      return res.status(400).json({ message: "key (string) and enabled (boolean) are required" });
    }

    const update = {};
    update[`feature.${key}`] = enabled;

    const updated = await Hotel.findOneAndUpdate(
      { _id: id },
      { $set: update },
      { new: true, projection: { _id: 1, name: 1, address: 1, contact: 1, feature: 1 } }
    );

    if (!updated) return res.status(404).json({ message: "Hotel not found" });

    return res.json({
      hotel: { _id: updated._id, name: updated.name, address: updated.address, contact: updated.contact },
      features: updated.feature || {},
    });
  } catch (err) {
    next(err);
  }
});

export default router;