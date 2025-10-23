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

// Sub-schema for ordered items (kitchen-focused with preparation tracking)
const orderedItemSchema = new Schema({
  menuItemId: {
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
  preparationTimeMinutes: {
    type: Number,
    required: true,
    min: 0
  },
  status: {
    type: String,
    enum: ['PENDING', 'PREPARING', 'READY', 'SERVED'],
    default: 'PENDING'
  },
  startedAt: {
    type: Date,
    default: null
  },
  completedAt: {
    type: Date,
    default: null
  },
  specialInstructions: {
    type: String,
    trim: true
  }
}, { _id: false });


// Sub-schema for order timing (kitchen perspective)
const orderTimeSchema = new Schema({
  placedAt: {
    type: Date,
    required: true,
    default: Date.now
  },
  startedPreparationAt: {
    type: Date,
    default: null
  },
  allItemsReadyAt: {
    type: Date,
    default: null
  },
  servedAt: {
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
    billId: {
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
      enum: ['PENDING', 'PREPARING', 'READY', 'SERVED', 'CANCELLED'],
      default: 'PENDING'
    },
    priority: {
      type: String,
      enum: ['LOW', 'NORMAL', 'HIGH', 'URGENT'],
      default: 'NORMAL'
    },
    orderedItems: [orderedItemSchema],
    orderTime: orderTimeSchema,
    waiterAssigned: {
      type: String,
      required: true
    },
    cookAssigned: {
      type: String,
      default: null
    },
    estimatedCompletionTime: {
      type: Date,
      default: null
    },
    notes: {
      type: String,
      trim: true
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
orderSchema.index({ 'orders.billId': 1 });
orderSchema.index({ 'orders.tableId': 1 });
orderSchema.index({ 'orders.orderStatus': 1 });
orderSchema.index({ 'orders.priority': 1 });
orderSchema.index({ 'orders.orderTime.placedAt': -1 });
orderSchema.index({ 'orders.orderedItems.status': 1 });

const Order = mongoose.model('Order', orderSchema, 'orders');

export default Order;