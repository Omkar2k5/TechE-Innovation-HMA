import mongoose from 'mongoose';

const staffSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  firstName: {
    type: String,
    required: true,
    trim: true
  },
  lastName: {
    type: String,
    required: true,
    trim: true
  },
  phone: {
    type: String,
    required: true
  },
  role: {
    type: String,
    required: true,
    enum: ['owner', 'manager', 'receptionist', 'cook', 'waiter'],
    lowercase: true
  },
  hotelId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hotel',
    required: true
  },
  employeeId: {
    type: String,
    sparse: true
  },
  permissions: [{
    type: String
  }],
  roleSpecific: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended'],
    default: 'active'
  },
  lastLogin: {
    type: Date
  }
}, {
  timestamps: true
});

// Create compound index for faster queries
staffSchema.index({ email: 1, hotelId: 1 });
staffSchema.index({ hotelId: 1, role: 1 });

const Staff = mongoose.model('Staff', staffSchema, 'staff');

export default Staff;