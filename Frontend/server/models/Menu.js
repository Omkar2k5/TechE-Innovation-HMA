import mongoose from 'mongoose';

const IngredientSchema = new mongoose.Schema({
  name: { type: String, required: true },
  quantity: { type: Number, required: true },
  unit: { type: String, required: true }
}, { _id: false });

const MenuSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, default: 0 },
  category: { type: String },
  ingredients: [IngredientSchema],
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.models.Menu || mongoose.model('Menu', MenuSchema);
