import mongoose from 'mongoose';
const { Schema } = mongoose;

// Sub-schema for bill items
const billItemSchema = new Schema({
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
  unitPrice: {
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

// Sub-schema for payment details
const paymentDetailsSchema = new Schema({
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
    enum: ['PAID', 'PENDING', 'CANCELLED'],
    default: 'PENDING'
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
  paidAt: {
    type: Date,
    default: null
  }
}, { _id: false });

// Main Bill Schema - One document per hotel with bills array
const billSchema = new Schema({
  _id: {
    type: String, // Hotel ID (e.g., "ASD001")
    required: true,
  },
  hotelName: {
    type: String,
    required: true,
    trim: true
  },
  bills: [{
    billId: {
      type: String,
      required: true,
      unique: true
    },
    orderId: {
      type: String,
      required: true
    },
    tableId: {
      type: String,
      required: true,
      trim: true
    },
    customerInfo: {
      name: {
        type: String,
        trim: true
      },
      phone: {
        type: String,
        trim: true
      },
      groupSize: {
        type: Number,
        min: 1,
        default: 1
      }
    },
    items: [billItemSchema],
    paymentDetails: paymentDetailsSchema,
    waiterAssigned: {
      type: String,
      required: true
    },
    billGeneratedAt: {
      type: Date,
      required: true,
      default: Date.now
    },
    isActive: {
      type: Boolean,
      default: true
    },
    notes: {
      type: String,
      trim: true
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
billSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Index for better performance
billSchema.index({ '_id': 1 });
billSchema.index({ 'bills.billId': 1 });
billSchema.index({ 'bills.orderId': 1 });
billSchema.index({ 'bills.tableId': 1 });
billSchema.index({ 'bills.paymentDetails.paymentStatus': 1 });
billSchema.index({ 'bills.billGeneratedAt': -1 });

const Bill = mongoose.model('Bill', billSchema, 'bills');

export default Bill;
