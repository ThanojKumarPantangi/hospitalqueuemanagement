import bcrypt from "bcrypt";
import User from "../models/user.model.js";

export const createAdminService = async ({ name, email, phone, password }) => {
  const exists = await User.findOne({ $or: [{ email }, { phone }] });
  if (exists) throw new Error("Admin already exists");

  const hash = await bcrypt.hash(password, 10);

  return User.create({
    name,
    email,
    phone,
    password: hash,
    role: "ADMIN",
    isPhoneVerified: true,
    isActive: true,
  });
};
