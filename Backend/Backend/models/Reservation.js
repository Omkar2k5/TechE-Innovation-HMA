import mongoose from 'mongoose';

// Individual reservation schema
const individualReservationSchema = new mongoose.Schema({
  reservationId: {
    type: String,
    required: true
  },
  reservationType: {
    type: String,
    enum: ['walk-in', 'online', 'walkin', 'reservation'], // keeping both formats for compatibility
    required: true
  },
  customerDetails: {
    name: {
      type: String,
      required: true
    },
    phone: {
      type: String,
      required: true
    },
    email: {
      type: String,
      required: function() {
        return this.reservationType === 'online' || this.reservationType === 'reservation';
      }
    },
    guests: {
      type: Number,
      required: true,
      min: 1
    }
  },
  tableId: {
    type: String,
    required: true
  },
  tableNumber: {
    type: String,
    required: true
  },
  reservationDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  reservationTime: {
    type: String,
    required: true
  },
  duration: {
    type: Number, // in hours
    default: 2
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'reserved', 'seated', 'completed', 'cancelled'],
    default: 'pending'
  },
  bufferStart: {
    type: Date,
    required: true
  },
  start: {
    type: Date,
    required: true
  },
  end: {
    type: Date,
    required: true
  },
  specialRequests: {
    type: String,
    default: ''
  },
  notes: {
    type: String,
    default: ''
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Main reservation document schema (one per hotel)
const reservationSchema = new mongoose.Schema({
  _id: {
    type: String,
    required: true
  },
  hotelName: {
    type: String,
    required: true
  },
  reservations: [individualReservationSchema],
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for efficient queries
reservationSchema.index({ 'reservations.status': 1 });
reservationSchema.index({ 'reservations.reservationType': 1 });
reservationSchema.index({ 'reservations.reservationDate': 1 });
reservationSchema.index({ 'reservations.tableId': 1 });

export default mongoose.model('Reservation', reservationSchema);
