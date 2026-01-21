import { transporter } from "./mailTransporter.js";

export const sendEmail = async ({ to, subject, html }) => {
  return transporter.sendMail({
    from: `"${process.env.MAIL_FROM_NAME}" <${process.env.MAIL_FROM}>`,
    to,
    subject,
    html,
  });
};
