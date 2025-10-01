import mongoose from 'mongoose';

const OrderItemSchema = new mongoose.Schema({
  menuId: { type: mongoose.Schema.Types.ObjectId, ref: 'Menu' },
  name: { type: String },
  qty: { type: Number, default: 1 }
}, { _id: false });

const OrderSchema = new mongoose.Schema({
  items: [OrderItemSchema],
  status: { type: String, default: 'NEW' },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.models.Order || mongoose.model('Order', OrderSchema);
