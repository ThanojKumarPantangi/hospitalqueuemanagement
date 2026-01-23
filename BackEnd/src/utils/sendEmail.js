import axios from "axios";

export const sendEmail = async ({ to, subject, html }) => {
  try {
    if (!process.env.BREVO_API_KEY) throw new Error("BREVO_API_KEY is missing");
    if (!process.env.MAIL_FROM) throw new Error("MAIL_FROM is missing");
    if (!process.env.MAIL_FROM_NAME) throw new Error("MAIL_FROM_NAME is missing");
    if (!to) throw new Error("Receiver email (to) is missing");

    const payload = {
      sender: {
        name: process.env.MAIL_FROM_NAME,
        email: process.env.MAIL_FROM,
      },
      to: [{ email: to }],
      subject,
      htmlContent: html,
    };

    const response = await axios.post(
      "https://api.brevo.com/v3/smtp/email",
      payload,
      {
        headers: {
          "api-key": process.env.BREVO_API_KEY,
          "content-type": "application/json",
          accept: "application/json",
        },
      }
    );

    return response.data; // { messageId: "..." }
  } catch (err) {
    console.log("Brevo email error:", err?.response?.data || err.message);
    throw new Error(err?.response?.data?.message || "Failed to send email");
  }
};
