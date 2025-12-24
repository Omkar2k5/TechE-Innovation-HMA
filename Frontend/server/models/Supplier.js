import mongoose from 'mongoose';

const SupplierSchema = new mongoose.Schema({
  name: { type: String, required: true },
  contactName: { type: String },
  phone: { type: String },
  email: { type: String },
  paymentTerms: { type: String },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.models.Supplier || mongoose.model('Supplier', SupplierSchema);
