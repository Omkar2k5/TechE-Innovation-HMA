import mongoose from "mongoose";

const SuperAdminSchema = new mongoose.Schema(
  {
    _id: { type: String },
    name: String,
    email: String,
    phone: String,
    username: String,
    password: String,
    // Allow flexible fields
  },
  { timestamps: true, collection: "hotel_management.super-admin", strict: false, autoCreate: false }
);

export default mongoose.model("SuperAdmin", SuperAdminSchema);