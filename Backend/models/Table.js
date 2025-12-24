import mongoose from 'mongoose';
const { Schema } = mongoose;

// Sub-schema for individual table
const tableSchema = new Schema({
  tableId: {
    type: String,
    required: true
  },
  capacity: {
    type: Number,
    required: true,
    min: 1
  },
  status: {
    type: String,
    required: true,
    enum: ['VACANT', 'OCCUPIED', 'RESERVED', 'MAINTENANCE'],
    default: 'VACANT'
  },
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
}, { _id: false });

// Main Table collection schema
const tableCollectionSchema = new Schema({
  _id: {
    type: String,
    required: true // This will be the hotel ID
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  tables: [tableSchema],
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
  _id: false, // Use custom _id
  collection: 'Table' // Specify collection name to match your database
});

// Middleware to update the updatedAt field
tableCollectionSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

const Table = mongoose.model('Table', tableCollectionSchema, 'Table');

export default Table;