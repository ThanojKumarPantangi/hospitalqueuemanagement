import { sendEmail } from "../utils/sendEmail.js";

export const testEmailController = async (req, res) => {
  try {
    const { to } = req.body;

    const result = await sendEmail({
      to,
      subject: "Test Email - Kumar Hospitals",
      html: `<h2>Hello!</h2><p>This email is sent using Brevo API from Render.</p>`,
    });

    res.status(200).json({
      success: true,
      message: "Email sent successfully",
      data: result,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};
