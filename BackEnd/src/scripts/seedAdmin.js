import bcrypt from "bcrypt";
import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "../models/user.model.js";

dotenv.config({ path: '../.env' });

const BCRYPT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS || "12", 10);

if (!process.env.MONGO_URI) {
  console.error("MONGO_URI not set");
  process.exit(1);
}

await mongoose.connect(process.env.MONGO_URI);

const existingAdmin = await User.findOne({ role: "ADMIN" });
if (existingAdmin) {
  console.log("Admin already exists. Skipping seed.");
  process.exit(0);
}

const passwordHash = await bcrypt.hash("Admin@123", BCRYPT_ROUNDS);
await User.create({
  name: "Super Admin",
  email: "admin@hospital.com",
  phone: "9999999999",
  password: passwordHash,
  role: "ADMIN",
  isPhoneVerified: true,
  isActive: true,
  failedLoginAttempts:0,
  mfaEnabled:false,
  mfaLockedUntil:null,
});

console.log("Admin created");
process.exit(0);