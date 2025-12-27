import { sendOTP, verifyOTP } from "../services/otp.service.js";

export const sendOTPController = async (req, res) => {

    try {
        const { phone,email } = req.body;
        await sendOTP(phone,email);

        res.status(200).json({
            message: "OTP sent successfully",
        });
      
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

export const verifyOTPController = async (req, res) => {
  try {
    const { phone, otp } = req.body;

    await verifyOTP(phone, otp);

    res.status(200).json({
      message: "Phone number verified successfully",
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};