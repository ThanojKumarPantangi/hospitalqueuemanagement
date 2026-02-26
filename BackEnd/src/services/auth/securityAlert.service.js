import SecurityEvent from "../../models/securityEvent.model.js";
import { sendEmail } from "../../utils/sendEmail.js";

export const createSecurityEvent = async ({
  user,
  type,
  ip,
  country,
  deviceId,
  userAgent,
  riskScore,
}) => {
  await SecurityEvent.create({
    user: user._id,
    type,
    ip,
    country,
    deviceId,
    userAgent,
    riskScore,
  });
};

export const sendSecurityEmail = async ({
  user,
  ip,
  country,
  deviceId,
  riskScore,
}) => {
  const riskLevel =
    riskScore >= 80
      ? "High"
      : riskScore >= 50
      ? "Medium"
      : "Low";

  // Updated colors to be slightly more vibrant and modern
  const riskColor =
    riskLevel === "High"
      ? "#ef4444" // Modern Red
      : riskLevel === "Medium"
      ? "#f59e0b" // Modern Amber
      : "#10b981"; // Modern Emerald

  const riskBg = 
    riskLevel === "High"
      ? "#fef2f2"
      : riskLevel === "Medium"
      ? "#fffbeb"
      : "#ecfdf5";

  const html = `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Security Alert</title>
    <style>
      /* Graceful animations for supported email clients */
      @keyframes fadeUp {
        0% { opacity: 0; transform: translateY(20px); }
        100% { opacity: 1; transform: translateY(0); }
      }
      @keyframes pulseWarning {
        0% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4); }
        70% { box-shadow: 0 0 0 10px rgba(239, 68, 68, 0); }
        100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
      }
      .animated-container {
        animation: fadeUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
      }
      .pulse-badge {
        animation: pulseWarning 2s infinite;
      }
      body {
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      }
    </style>
  </head>
  <body style="margin:0;padding:0;background-color:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;">
    <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 20px; background-color:#f8fafc;">
      <tr>
        <td align="center">
          <table class="animated-container" width="100%" max-width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 10px 40px -10px rgba(0,0,0,0.08); max-width: 600px; width: 100%; border: 1px solid #e2e8f0;">
            
            <tr>
              <td style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); padding: 32px 24px; text-align: center;">
                <div style="background: rgba(255,255,255,0.1); width: 48px; height: 48px; border-radius: 50%; display: inline-block; margin-bottom: 12px; line-height: 48px;">
                  <span style="font-size: 24px;">🛡️</span>
                </div>
                <h2 style="margin:0;color:#ffffff;font-size:24px;font-weight:600;letter-spacing:-0.5px;">
                  Security Alert
                </h2>
              </td>
            </tr>

            <tr>
              <td style="padding: 40px 32px;">
                <p style="margin:0 0 16px 0;font-size:16px;color:#334155;font-weight:500;">
                  Hi ${user.name || "User"},
                </p>

                <p style="margin:0 0 24px 0;font-size:15px;color:#475569;line-height:1.6;">
                  We detected a new login activity on your account.
                  If this was you, no further action is needed.
                </p>

                <table width="100%" cellpadding="12" cellspacing="0" style="background:#f8fafc;border-radius:12px;font-size:14px;color:#334155;border:1px solid #e2e8f0;">
                  <tr>
                    <td style="border-bottom: 1px solid #e2e8f0; width: 35%;"><strong>IP Address:</strong></td>
                    <td style="border-bottom: 1px solid #e2e8f0; color: #0f172a;">${ip || "Unknown"}</td>
                  </tr>
                  <tr>
                    <td style="border-bottom: 1px solid #e2e8f0;"><strong>Location:</strong></td>
                    <td style="border-bottom: 1px solid #e2e8f0; color: #0f172a;">${country || "Unknown"}</td>
                  </tr>
                  <tr>
                    <td style="border-bottom: 1px solid #e2e8f0;"><strong>Device ID:</strong></td>
                    <td style="border-bottom: 1px solid #e2e8f0; color: #0f172a;">${deviceId || "Unknown"}</td>
                  </tr>
                  <tr>
                    <td><strong>Risk Level:</strong></td>
                    <td>
                      <span class="${riskLevel === "High" ? "pulse-badge" : ""}" style="background-color:${riskBg};color:${riskColor};padding:4px 12px;border-radius:9999px;font-weight:600;font-size:13px;display:inline-block; border: 1px solid ${riskColor}30;">
                        ${riskLevel} (${riskScore})
                      </span>
                    </td>
                  </tr>
                </table>

                ${
                  riskLevel === "High"
                    ? `
                <div style="margin-top:28px; background:#fef2f2; border-left:4px solid #ef4444; padding:16px; border-radius:0 8px 8px 0;">
                  <p style="margin:0 0 12px 0;color:#991b1b;font-weight:600;font-size:15px;">
                    ⚠️ Suspicious Activity Detected
                  </p>
                  <p style="margin:0 0 8px 0;color:#7f1d1d;font-size:14px;">We strongly recommend taking these steps:</p>
                  <ul style="color:#7f1d1d;font-size:14px;margin:0;padding-left:20px;line-height:1.6;">
                    <li>Change your password immediately</li>
                    <li>Enable Two-Step Verification</li>
                    <li>Review active sessions</li>
                  </ul>
                </div>
                `
                    : ""
                }

                <p style="margin-top:32px;font-size:14px;color:#64748b;line-height:1.6;text-align:center;border-top:1px solid #e2e8f0;padding-top:24px;">
                  If you did not perform this action, please secure your account immediately.
                </p>
              </td>
            </tr>

            <tr>
              <td style="background:#f1f5f9;padding:24px;text-align:center;">
                <p style="margin:0;font-size:12px;color:#94a3b8;line-height:1.5;">
                  This is an automated security notification.<br>Please do not reply to this email.
                </p>
              </td>
            </tr>

          </table>
        </td>
      </tr>
    </table>
  </body>
  </html>
  `;

  await sendEmail({
    to: user.email,
    subject: riskLevel === "High" ? "⚠️ Urgent Security Alert: New Login Activity Detected" : "Security Alert: New Login Activity Detected",
    html,
  });
};