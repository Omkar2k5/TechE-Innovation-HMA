import mongoose from 'mongoose';
const { Schema } = mongoose;

// Sub-schema for order items
const orderItemSchema = new Schema({
  menuItemId: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  unitPrice: {
    type: Number,
    required: true,
    min: 0
  },
  totalPrice: {
    type: Number,
    required: true,
    min: 0
  },
  specialInstructions: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['pending', 'preparing', 'ready', 'served'],
    default: 'pending'
  },
  orderedAt: {
    type: Date,
    default: Date.now
  }
}, { _id: true });

// Sub-schema for customer information
const customerSchema = new Schema({
  name: {
    type: String,
    trim: true
  },
  phone: {
    type: String,
    trim: true
  },
  email: {
    type: String,
    trim: true
  },
  groupSize: {
    type: Number,
    min: 1,
    default: 1
  }
}, { _id: false });

// Sub-schema for billing details
const billingSchema = new Schema({
  subtotal: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  tax: {
    type: Number,
    min: 0,
    default: 0
  },
  serviceCharge: {
    type: Number,
    min: 0,
    default: 0
  },
  discount: {
    type: Number,
    min: 0,
    default: 0
  },
  total: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'card', 'upi', 'other'],
    default: 'cash'
  },
  paidAmount: {
    type: Number,
    min: 0,
    default: 0
  },
  changeAmount: {
    type: Number,
    min: 0,
    default: 0
  },
  isPaid: {
    type: Boolean,
    default: false
  },
  paidAt: {
    type: Date
  }
}, { _id: false });

// Sub-schema for ordered items (matching new structure)
const orderedItemSchema = new Schema({
  itemId: {
    type: String,
    required: true
  },
  itemName: {
    type: String,
    required: true,
    trim: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  totalPrice: {
    type: Number,
    required: true,
    min: 0
  }
}, { _id: false });

// Sub-schema for bill details
const billDetailsSchema = new Schema({
  subtotal: {
    type: Number,
    required: true,
    min: 0
  },
  tax: {
    type: Number,
    min: 0,
    default: 0
  },
  grandTotal: {
    type: Number,
    required: true,
    min: 0
  },
  paymentMethod: {
    type: String,
    enum: ['CASH', 'CARD', 'UPI', 'OTHER'],
    default: null
  },
  paymentStatus: {
    type: String,
    enum: ['PAID', 'PENDING'],
    default: 'PENDING'
  }
}, { _id: false });

// Sub-schema for order time
const orderTimeSchema = new Schema({
  placedAt: {
    type: Date,
    required: true,
    default: Date.now
  },
  completedAt: {
    type: Date,
    default: null
  }
}, { _id: false });

// Main Order Schema - One document per hotel with orders array
const orderSchema = new Schema({
  _id: {
    type: String, // Hotel ID (e.g., "ASD001")
    required: true,
  },
  hotelName: {
    type: String,
    required: true,
    trim: true
  },
  orders: [{
    orderId: {
      type: String,
      required: true
    },
    tableId: {
      type: String,
      required: true,
      trim: true
    },
    orderStatus: {
      type: String,
      enum: ['ONGOING', 'COMPLETED', 'CANCELLED'],
      default: 'ONGOING'
    },
    orderedItems: [orderedItemSchema],
    billDetails: billDetailsSchema,
    orderTime: orderTimeSchema,
    waiterAssigned: {
      type: String,
      required: true
    },
    isActive: {
      type: Boolean,
      default: true
    }
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  _id: false
});

// Pre-save middleware to update timestamps
orderSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Index for better performance
orderSchema.index({ '_id': 1 });
orderSchema.index({ 'orders.orderId': 1 });
orderSchema.index({ 'orders.tableId': 1 });
orderSchema.index({ 'orders.orderStatus': 1 });
orderSchema.index({ 'orders.orderTime.placedAt': -1 });
orderSchema.index({ 'orders.billDetails.paymentStatus': 1 });

const Order = mongoose.model('Order', orderSchema, 'orders');

export default Order;