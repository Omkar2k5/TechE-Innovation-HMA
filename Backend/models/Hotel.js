import mongoose from 'mongoose';
const { Schema } = mongoose;

// Sub-schema for address
const addressSchema = new Schema({
  street: { type: String, required: true },
  city: { type: String, required: true },
  state: { type: String, required: true },
  zip: { type: String, required: true },
  country: { type: String, required: true }
}, { _id: false });

// Sub-schema for contact
const contactSchema = new Schema({
  phone: { type: String, required: true },
  email: { type: String, required: true }
}, { _id: false });

// Sub-schema for tax configuration
const taxConfigSchema = new Schema({
  taxPercentage: { type: Number, default: 0 },
  serviceCharge: { type: Number, default: 0 }
}, { _id: false });

// Sub-schema for role features
const featuresSchema = new Schema({
  feature1: { type: Boolean, default: false },
  feature2: { type: Boolean, default: false },
  feature3: { type: Boolean, default: false }
}, { _id: false });

// Sub-schema for roles
const roleSchema = new Schema({
  roleId: { type: String, required: true },
  role: {
    type: String,
    required: true,
    enum: ['owner', 'receptionalist', 'cook', 'manager']
  },
  features: featuresSchema,
  // Owner-specific fields
  owner_Name: { type: String },
  owner_Phone: { type: String },
  "Owner Email": { type: String },
  "Owner username": { type: String },
  "Owner Password": { type: String },
  // Manager-specific fields
  "Manager Name": { type: String },
  "Manager Email": { type: String },
  "Manager Phone": { type: String },
  "Manager Password": { type: String },
  // Receptionist-specific fields
  "Receptionalist Name": { type: String },
  "Receptionalist Email": { type: String },
  "Receptionalist Phone": { type: String },
  "Receptionalist Password": { type: String },
  // Cook-specific fields
  "Cook Name": { type: String },
  "Cook Email": { type: String },
  "Cook Phone": { type: String },
  "Cook Password": { type: String }
}, { _id: false });

// Main Hotel Schema
const hotelSchema = new Schema({
  _id: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  address: addressSchema,
  contact: contactSchema,
  taxConfig: taxConfigSchema,
  roles: [roleSchema]
}, {
  timestamps: true,
  _id: false
});

const Hotel = mongoose.model('Hotel', hotelSchema, 'hotels');

export default Hotel;
