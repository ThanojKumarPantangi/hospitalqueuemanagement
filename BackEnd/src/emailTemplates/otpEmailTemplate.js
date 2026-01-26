export const otpEmailTemplate = ({
  otp,
  appName = process.env.MAIL_FROM_NAME || "Kumar Hospitals",
  expiryMinutes = 5,
  supportEmail = process.env.MAIL_FROM || "support@example.com",
}) => {
  return `
  <div style="margin:0;padding:0;background:#f5f7fb;font-family:Arial,sans-serif;">
    <div style="max-width:520px;margin:30px auto;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e6e8ee;">
      
      <div style="padding:18px 22px;background:#111827;color:#fff;">
        <h2 style="margin:0;font-size:18px;">${appName}</h2>
        <p style="margin:6px 0 0;font-size:13px;opacity:0.9;">OTP Verification</p>
      </div>

      <div style="padding:22px;">
        <p style="margin:0 0 12px;font-size:14px;color:#111827;">
          Your One-Time Password (OTP) is:
        </p>

        <div style="text-align:center;margin:18px 0;">
          <div style="
            display:inline-block;
            padding:14px 22px;
            font-size:26px;
            font-weight:700;
            letter-spacing:6px;
            color:#111827;
            background:#f3f4f6;
            border-radius:10px;
            border:1px dashed #cbd5e1;
          ">
            ${otp}
          </div>
        </div>

        <p style="margin:0 0 12px;font-size:13px;color:#374151;">
          This OTP will expire in <b>${expiryMinutes} minutes</b>.
        </p>

        <p style="margin:0;font-size:13px;color:#6b7280;">
          If you didn’t request this, please ignore this email or contact support:
          <a href="mailto:${supportEmail}" style="color:#2563eb;text-decoration:none;">
            ${supportEmail}
          </a>
        </p>
      </div>

      <div style="padding:14px 22px;background:#f9fafb;border-top:1px solid #e6e8ee;">
        <p style="margin:0;font-size:12px;color:#9ca3af;">
          © ${new Date().getFullYear()} ${appName}. All rights reserved.
        </p>
      </div>
    </div>
  </div>
  `;
};