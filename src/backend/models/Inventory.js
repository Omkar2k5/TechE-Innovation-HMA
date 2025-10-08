import mongoose from "mongoose";

const inventorySchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  unit: { type: String, default: "grams" },
  category: { type: String, default: "General" },
  supplier: { type: String, default: "" },
  costPerUnit: { type: Number, default: 0 },
  stock: { type: Number, default: 0 },
  lowStockThreshold: { type: Number, default: 5 },
  expiry: { type: Date, default: null },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Update updatedAt before saving
inventorySchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

export default mongoose.model("Inventory", inventorySchema);
