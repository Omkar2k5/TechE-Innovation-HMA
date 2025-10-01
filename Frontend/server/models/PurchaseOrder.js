import mongoose from 'mongoose';

const POItemSchema = new mongoose.Schema({
  ingredient: { type: mongoose.Schema.Types.ObjectId, ref: 'Ingredient' },
  name: { type: String },
  qty: { type: Number, default: 0 },
  unit: { type: String },
  pricePerUnit: { type: Number, default: 0 }
}, { _id: false });

const PurchaseOrderSchema = new mongoose.Schema({
  supplier: { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier' },
  items: [POItemSchema],
  status: { type: String, default: 'OPEN' }, // OPEN, RECEIVED, CANCELLED
  createdAt: { type: Date, default: Date.now },
  receivedAt: { type: Date }
});

export default mongoose.models.PurchaseOrder || mongoose.model('PurchaseOrder', PurchaseOrderSchema);
