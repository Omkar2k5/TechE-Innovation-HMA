import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import dotenv from "dotenv";
import hotelsRouter from "./routes/hotels.js";
import superAdminRouter from "./routes/superAdmin.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json({ limit: "1mb" }));

const PORT = process.env.PORT || 4000;
// Default to hotel_management DB instead of HMA
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/hotel_management";

// Mongo connection
mongoose
  .connect(MONGODB_URI, {
    serverSelectionTimeoutMS: 5000,
    dbName: "hotel_management",
  })
  .then(() => console.log("MongoDB connected"))
  .catch((err) => {
    console.error("MongoDB connection error:", err.message);
    process.exit(1);
  });

app.get("/health", (_req, res) => res.json({ ok: true }));

// Routes
app.use("/api/hotels", hotelsRouter);
app.use("/api/super-admin", superAdminRouter);

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ message: "Internal server error" });
});

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));