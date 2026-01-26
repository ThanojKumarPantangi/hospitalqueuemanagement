import axios from "axios";

export const sendSms2Factor = async (phone, otp) => {
  const apiKey = process.env.TWO_FACTOR_API_KEY;

  if (!apiKey) throw new Error("2Factor API key missing");

  // 2Factor OTP API (autogenerate OTP on their side)
  // But you are generating OTP in backend, so we use "SMS API" route.
  // 2Factor supports sending custom message using their SMS API.

  const message = `Your OTP is ${otp}. Valid for 5 minutes. - Hospital Queue`;

  const url = `https://2factor.in/API/V1/${apiKey}/SMS/${phone}/${encodeURIComponent(
    message
  )}`;

  const response = await axios.get(url);

  if (response.data?.Status !== "Success") {
    throw new Error(response.data?.Details || "Failed to send OTP SMS");
  }

  return true;
};