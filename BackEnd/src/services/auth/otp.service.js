import OTP from "../../models/otp.model.js";
import User from "../../models/user.model.js";
import crypto from "crypto";
import { sendSms2Factor } from "../../utils/sendSms2factor.js";
import { otpEmailTemplate } from "../../emailTemplates/otpEmailTemplate.js";
import { sendEmail } from "../../utils/sendEmail.js";


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
export const sendOTP = async (email) => {
  const user = await User.findOne({ email });
  if (!user) throw new Error("User not found");

  if (!user.phone) {
    throw new Error("Phone number not registered");
  }

  const existingOTP = await OTP.findOne({
    email,
    expiresAt: { $gt: new Date() },
  });

  if (existingOTP) {
    throw new Error("OTP already sent. Please wait.");
  }

  const otp = generateOTP();
  const hashedOtp = hashOTP(otp);

  await OTP.create({
    email,
    phone: user.phone, // derived, not trusted
    otp: hashedOtp,
    expiresAt: new Date(Date.now() + OTP_EXPIRY_MINUTES * 60000),
    attempts: 0,
    lockedUntil: null,
  });

  // sendSms2Factor(user.phone, otp);
  
  await sendEmail({
    to: email,
    subject: `${process.env.MAIL_FROM_NAME || "Smart Q"} OTP Verification`,
    html: otpEmailTemplate({
    otp,
    expiryMinutes: OTP_EXPIRY_MINUTES,
    }),
  });

  return true;
};

/* ---------- verify OTP ---------- */
export const verifyOTP = async (email, otp) => {
  const otpRecord = await OTP.findOne({ email });

  if (!otpRecord) {
    throw new Error("Invalid or expired OTP");
  }

  if (
    otpRecord.lockedUntil &&
    otpRecord.lockedUntil > new Date()
  ) {
    throw new Error("Too many attempts. Try again later.");
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

  //  Mark phone verified using EMAIL lookup
  await User.findOneAndUpdate(
    { email },
    { isPhoneVerified: true }
  );

  //  Clean up OTPs for this user
  await OTP.deleteMany({ email });

  return true;
};
