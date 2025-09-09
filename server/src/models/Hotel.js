import mongoose from "mongoose";

const AddressSchema = new mongoose.Schema(
  {
    street: String,
    city: String,
    state: String,
    zip: String,
    country: String,
  },
  { _id: false }
);

const ContactSchema = new mongoose.Schema(
  {
    phone: String,
    email: String,
  },
  { _id: false }
);

const TaxConfigSchema = new mongoose.Schema(
  {
    taxPercentage: { type: Number, default: 0 },
    serviceCharge: { type: Number, default: 0 },
  },
  { _id: false }
);

const FeatureMapSchema = new mongoose.Schema(
  {
    // Flexible map for feature flags (e.g., feature1..featureN)
  },
  { strict: false, _id: false }
);

const RoleSchema = new mongoose.Schema(
  {
    roleId: String,
    role: String,
    owner_Name: String,
    owner_Phone: String,
    owner_Email: String,
    owner_Password: String,
    // Only persisted for the Owner role
    Passwordreset: { type: Boolean, default: undefined },
    features: { type: FeatureMapSchema, default: {} },
  },
  { _id: false, strict: false }
);

// Ensure Passwordreset is set to true only for the Owner role
RoleSchema.pre("validate", function (next) {
  if (this.role === "owner" && this.Passwordreset === undefined) {
    this.Passwordreset = true;
  }
  // For non-owner roles, keep it undefined so it won't be saved
  if (this.role !== "owner") {
    this.Passwordreset = undefined;
  }
  next();
});

const HotelSchema = new mongoose.Schema(
  {
    _id: { type: String },
    name: { type: String, required: true },
    createdBy: { type: String },
    address: { type: AddressSchema, required: true },
    contact: { type: ContactSchema, required: true },
    taxConfig: { type: TaxConfigSchema, required: true },
    settings: {
      businessHours: String,
      timezone: String,
    },
    roles: { type: [RoleSchema], default: [] },
    feature: { type: FeatureMapSchema, default: {} },
  },
  { timestamps: true, collection: "hotels", autoCreate: false }
);

export default mongoose.model("Hotel", HotelSchema);