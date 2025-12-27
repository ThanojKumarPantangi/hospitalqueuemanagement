import OTP from "../models/otp.model.js";
import User from "../models/user.model.js";
import crypto from "crypto";

const OTP_EXPIRY_MINUTES = 5;
const MAX_VERIFY_ATTEMPTS = 5;
const LOCK_TIME_MINUTES = 10;

const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const hashOTP = (otp) => {
  return crypto.createHash("sha256").update(otp).digest("hex");
};

/* ---------- send OTP ---------- */
export const sendOTP = async (phone, email) => {
  const user = await User.findOne({ phone, email });
  if (!user) throw new Error("User not found");

  const existingOTP = await OTP.findOne({
    phone,
    expiresAt: { $gt: new Date() },
  });

  if (existingOTP) {
    throw new Error("OTP already sent. Please wait.");
  }


  const otp = generateOTP();
  console.log(otp);
  const hashedOtp = hashOTP(otp);

  // 🗄️ Store ONCE
  await OTP.create({
    phone,
    email,
    otp: hashedOtp,
    expiresAt: new Date(Date.now() + OTP_EXPIRY_MINUTES * 60000),
    attempts: 0,
    lockedUntil: null,
  });

  // 📤 Send SAME OTP to multiple channels
  // sendSms(phone, otp);    // SMS
  //sendEmail(email, otp); // Email

  return true;
};


/* ---------- verify OTP ---------- */
export const verifyOTP = async (phone, otp) => {
  const otpRecord = await OTP.findOne({ phone });

  if (!otpRecord) {
    throw new Error("Invalid OTP");
  }

  if (
    otpRecord.lockedUntil &&
    otpRecord.lockedUntil > new Date()
  ) {
    throw new Error("Too many wrong attempts. Try again later.");
  }

  if (otpRecord.expiresAt < new Date()) {
    throw new Error("OTP expired");
  }

  const hashedOtp = hashOTP(otp);
  if (otpRecord.otp !== hashedOtp) {
    otpRecord.attempts += 1;

    if (otpRecord.attempts >= MAX_VERIFY_ATTEMPTS) {
      otpRecord.lockedUntil = new Date(
        Date.now() + LOCK_TIME_MINUTES * 60 * 1000
      );
    }

    await otpRecord.save();
    throw new Error("Invalid OTP");
  }

  await User.findOneAndUpdate(
    { phone },
    { isPhoneVerified: true }
  );

  await OTP.deleteMany({ phone });

  return true;
};
