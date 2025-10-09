import mongoose from 'mongoose';
const { Schema } = mongoose;

// Sub-schema for individual menu item
const menuItemSchema = new Schema({
  itemId: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  ingredients: [{
    type: String,
    trim: true
  }],
  price: {
    type: Number,
    min: 0
  },
  category: {
    type: String,
    enum: ['appetizer', 'main', 'dessert', 'beverage', 'special'],
    default: 'main'
  },
  isAvailable: {
    type: Boolean,
    default: true
  },
  preparationTime: {
    type: Number, // in minutes
    min: 0
  },
  allergens: [{
    type: String,
    enum: ['gluten', 'dairy', 'nuts', 'eggs', 'soy', 'shellfish', 'fish']
  }],
  nutritionalInfo: {
    calories: { type: Number, min: 0 },
    protein: { type: Number, min: 0 },
    carbs: { type: Number, min: 0 },
    fat: { type: Number, min: 0 }
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, { _id: true });

// Sub-schema for saved ingredients (for reuse across menu items)
const savedIngredientSchema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    enum: ['vegetable', 'meat', 'dairy', 'grain', 'spice', 'sauce', 'other'],
    default: 'other'
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, { _id: false });

// Main Menu Schema - One document per hotel
const menuSchema = new Schema({
  _id: {
    type: String, // Hotel ID (e.g., "ASD001")
    required: true,
  },
  hotelName: {
    type: String,
    required: true,
    trim: true
  },
  menuItems: [menuItemSchema],
  savedIngredients: [savedIngredientSchema],
  menuCategories: [{
    name: { type: String, required: true },
    displayOrder: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true }
  }],
  menuSettings: {
    defaultPreparationTime: { type: Number, default: 15 }, // minutes
    autoGenerateItemId: { type: Boolean, default: true },
    showNutritionalInfo: { type: Boolean, default: false },
    showAllergens: { type: Boolean, default: true }
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  _id: false
});

// Update lastUpdated on save
menuSchema.pre('save', function(next) {
  this.lastUpdated = new Date();
  next();
});

// Index for better performance
menuSchema.index({ '_id': 1 });
menuSchema.index({ 'menuItems.itemId': 1 });
menuSchema.index({ 'menuItems.name': 'text' });

const Menu = mongoose.model('Menu', menuSchema, 'menus');

export default Menu;