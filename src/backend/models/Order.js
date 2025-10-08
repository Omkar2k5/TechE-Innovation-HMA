import mongoose from "mongoose";

const orderItemSchema = new mongoose.Schema({
  menuId: { type: mongoose.Schema.Types.ObjectId, ref: "Menu", required: true },
  name: { type: String, required: true },
  qty: { type: Number, default: 1 },
  price: { type: Number, required: true },
  status: { type: String, enum: ["pending", "in_progress", "ready", "served"], default: "pending" },
  fastPrep: { type: Boolean, default: false },
});

const orderSchema = new mongoose.Schema({
  table: { type: String, required: true },
  priority: { type: String, enum: ["low", "normal", "high"], default: "normal" },
  items: [orderItemSchema],
  totalAmount: { type: Number, default: 0 },
  status: {
    type: String,
    enum: ["pending", "in_progress", "ready", "completed", "cancelled"],
    default: "pending",
  },
  receivedAt: { type: Date, default: Date.now },
  completedAt: { type: Date, default: null },
  createdBy: { type: String, default: "receptionist" },
});

export default mongoose.model("Order", orderSchema);
