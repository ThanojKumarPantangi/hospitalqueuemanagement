import bcrypt from "bcrypt";
import User from "../../models/user.model.js";

const BCRYPT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS || "12", 10);

export const createAdminService = async ({ name, email, phone, password }) => {
  const exists = await User.findOne({ $or: [{ email }, { phone }] });
  if (exists) throw new Error("Admin already exists");

  const hash = await bcrypt.hash(password, BCRYPT_ROUNDS);

  return User.create({
    name:name.trim().toLowerCase(),
    email: email.trim().toLowerCase(),
    phone,
    password: hash,
    role: "ADMIN",
    isPhoneVerified: true,
    isActive: true,
  });
};
