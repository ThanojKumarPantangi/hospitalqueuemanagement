export const resetPasswordTemplate = ({
  name,
  resetUrl,
  device = "Unknown device",
  location = "Unknown location",
  time = new Date().toLocaleString(),
  logoUrl = "https://your-domain.com/logo.png", // ✅ replace this
}) => {
  const year = new Date().getFullYear();
  const refId = `REF-${Math.floor(Math.random() * 10000000)}`;

  return `
<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="x-apple-disable-message-reformatting">
  <meta name="format-detection" content="telephone=no,address=no,email=no,date=no,url=no">
  <title>Reset Your Password</title>

  <style>
    html, body {
      margin: 0 !important;
      padding: 0 !important;
      height: 100% !important;
      width: 100% !important;
      background: #F1F5F9;
    }

    * { -ms-text-size-adjust: 100%; -webkit-text-size-adjust: 100%; }

    table, td {
      mso-table-lspace: 0pt !important;
      mso-table-rspace: 0pt !important;
    }

    table {
      border-spacing: 0 !important;
      border-collapse: collapse !important;
      table-layout: fixed !important;
      margin: 0 auto !important;
    }

    img { -ms-interpolation-mode: bicubic; }
    a { text-decoration: none; }
    div[style*="margin: 16px 0"] { margin: 0 !important; }

    *[x-apple-data-detectors],
    .unstyle-auto-detected-links *,
    .aBn {
      border-bottom: 0 !important;
      cursor: default !important;
      color: inherit !important;
      text-decoration: none !important;
      font-size: inherit !important;
      font-family: inherit !important;
      font-weight: inherit !important;
      line-height: inherit !important;
    }

    .a6S { display: none !important; opacity: 0.01 !important; }
    .im { color: inherit !important; }
    img.g-img + div { display: none !important; }

    @media screen and (max-width: 600px) {
      .email-container { width: 100% !important; margin: auto !important; }
      .px { padding-left: 18px !important; padding-right: 18px !important; }
      .title { font-size: 22px !important; line-height: 30px !important; }
      .text { font-size: 15px !important; line-height: 23px !important; }
      .btn a { padding: 14px 18px !important; }
    }
  </style>
</head>

<body width="100%" style="margin:0; padding:0 !important; mso-line-height-rule: exactly; background:#F1F5F9;">
  <center role="article" aria-roledescription="email" lang="en" style="width:100%; background:#F1F5F9;">

    <!-- PREHEADER -->
    <div style="display:none; font-size:1px; line-height:1px; max-height:0px; max-width:0px; opacity:0; overflow:hidden; mso-hide:all;">
      Secure password reset request for your Kumar Hospitals account. Expires in 15 minutes.
    </div>

    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="width:600px; max-width:600px;" class="email-container">

      <!-- TOP SPACE -->
      <tr><td height="36" style="font-size:0; line-height:0;">&nbsp;</td></tr>

      <!-- BRAND (LOGO + NAME) -->
      <tr>
        <td align="center" style="padding: 0 0 18px 0;">
          <table role="presentation" cellspacing="0" cellpadding="0" border="0">
            <tr>
              <td style="vertical-align:middle;">
                <img
                  src="${logoUrl}"
                  width="38"
                  height="38"
                  alt="Kumar Hospitals"
                  style="
                    display:block;
                    width:38px;
                    height:38px;
                    border-radius:10px;
                    border:1px solid rgba(100,116,139,0.25);
                    background:#ffffff;
                  "
                />
              </td>
              <td style="padding-left: 10px; vertical-align:middle; font-family: Arial, Helvetica, sans-serif; font-size: 13px; font-weight: 800; color: #64748B; letter-spacing: 1.6px; text-transform: uppercase;">
                Kumar Hospitals
              </td>
            </tr>
          </table>
        </td>
      </tr>

      <!-- MAIN CARD -->
      <tr>
        <td style="background:#ffffff; border-radius:18px; overflow:hidden; box-shadow:0 10px 30px rgba(15, 23, 42, 0.10);">

          <!-- ACCENT STRIP -->
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
            <tr>
              <td style="height:8px; background: linear-gradient(90deg, #0284C7, #6366F1); font-size:0; line-height:0;">&nbsp;</td>
            </tr>
          </table>

          <!-- CONTENT -->
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
            <tr>
              <td class="px" style="padding: 38px 42px;">

                <!-- ICON -->
                <table role="presentation" align="center" cellspacing="0" cellpadding="0" border="0" style="margin:auto;">
                  <tr>
                    <td style="background:#E0F2FE; border-radius:999px; padding:16px; border:1px solid #BAE6FD;">
                      <div style="font-size:30px; line-height:30px;">🔐</div>
                    </td>
                  </tr>
                </table>

                <!-- TITLE -->
                <div class="title" style="margin-top:18px; text-align:center; font-family: Arial, Helvetica, sans-serif; font-size:26px; line-height:34px; font-weight:900; color:#0F172A;">
                  Reset your password
                </div>

                <!-- SUBTEXT -->
                <div class="text" style="margin-top:12px; text-align:center; font-family: Arial, Helvetica, sans-serif; font-size:16px; line-height:24px; color:#475569;">
                  Hi <strong style="color:#0F172A;">${name || "Valued Patient"}</strong>,<br><br>
                  We received a request to reset your password for the Kumar Hospitals Patient Portal.
                  If you made this request, click the button below.
                </div>

                <!-- CTA BUTTON -->
                <table role="presentation" align="center" cellspacing="0" cellpadding="0" border="0" style="margin:auto; margin-top:22px;">
                  <tr>
                    <td class="btn" style="border-radius:12px; background:#0284C7;">
                      <a href="${resetUrl}" target="_blank"
                        style="
                          display:block;
                          font-family: Arial, Helvetica, sans-serif;
                          font-size:16px;
                          font-weight:800;
                          color:#ffffff;
                          padding:14px 26px;
                          border-radius:12px;
                          background:#0284C7;
                          border:1px solid #0284C7;
                        ">
                        Set New Password →
                      </a>
                    </td>
                  </tr>
                </table>

                <!-- EXPIRY NOTE -->
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-top:22px;">
                  <tr>
                    <td style="background:#F8FAFC; border:1px solid #E2E8F0; border-radius:14px; padding:14px 14px;">
                      <div style="font-family: Arial, Helvetica, sans-serif; font-size:13px; line-height:20px; color:#475569;">
                        ⏳ This link expires in <strong style="color:#0F172A;">15 minutes</strong>.
                        If you didn’t request this, you can ignore this email safely.
                      </div>
                    </td>
                  </tr>
                </table>

                <!-- DETAILS -->
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-top:18px;">
                  <tr>
                    <td style="border-radius:14px; border:1px solid #E2E8F0; background:#ffffff; padding:16px;">
                      <div style="font-family: Arial, Helvetica, sans-serif; font-size:12px; font-weight:900; letter-spacing:1px; text-transform:uppercase; color:#64748B;">
                        Request details
                      </div>

                      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-top:10px;">
                        <tr>
                          <td style="font-family: Arial, Helvetica, sans-serif; font-size:13px; color:#94A3B8; padding:4px 0; width:32%;">Device</td>
                          <td style="font-family: Arial, Helvetica, sans-serif; font-size:13px; color:#334155; font-weight:700; padding:4px 0;">${device}</td>
                        </tr>
                        <tr>
                          <td style="font-family: Arial, Helvetica, sans-serif; font-size:13px; color:#94A3B8; padding:4px 0;">Location</td>
                          <td style="font-family: Arial, Helvetica, sans-serif; font-size:13px; color:#334155; font-weight:700; padding:4px 0;">${location}</td>
                        </tr>
                        <tr>
                          <td style="font-family: Arial, Helvetica, sans-serif; font-size:13px; color:#94A3B8; padding:4px 0;">Time</td>
                          <td style="font-family: Arial, Helvetica, sans-serif; font-size:13px; color:#334155; font-weight:700; padding:4px 0;">${time}</td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>

                <!-- SECURITY WARNING -->
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-top:18px;">
                  <tr>
                    <td style="border-left:4px solid #F59E0B; background:#FFFBEB; padding:14px; border-radius:12px;">
                      <div style="font-family: Arial, Helvetica, sans-serif; font-size:13px; line-height:20px; color:#92400E;">
                        <strong>Security tip:</strong> Never share this link with anyone. If you didn’t request this reset,
                        contact support immediately.
                      </div>
                    </td>
                  </tr>
                </table>

                <!-- DIVIDER -->
                <div style="margin-top:26px; height:1px; background:#E2E8F0;"></div>

                <!-- FALLBACK URL -->
                <div style="margin-top:18px; font-family: Arial, Helvetica, sans-serif; font-size:13px; color:#64748B;">
                  Having trouble with the button? Copy and paste this link:
                </div>

                <div style="margin-top:10px; font-family: monospace; font-size:12px; line-height:18px; color:#0284C7; word-break:break-all; background:#F1F5F9; border:1px solid #E2E8F0; padding:12px; border-radius:12px;">
                  <a href="${resetUrl}" style="color:#0284C7; text-decoration:underline;">${resetUrl}</a>
                </div>

              </td>
            </tr>
          </table>
        </td>
      </tr>

      <!-- FOOTER -->
      <tr>
        <td style="padding: 22px 10px 40px 10px;">
          <div style="text-align:center; font-family: Arial, Helvetica, sans-serif; font-size:12px; line-height:18px; color:#94A3B8;">
            © ${year} Kumar Hospitals. All rights reserved.<br>
            123 Health Valley, Jubilee Hills, Hyderabad, Telangana 500033
          </div>

          <div style="margin-top:12px; text-align:center; font-family: Arial, Helvetica, sans-serif; font-size:11px; line-height:16px; color:#CBD5E1;">
            This is an automated security email. Please do not reply.<br>
            Ref ID: ${refId}
          </div>
        </td>
      </tr>

    </table>
  </center>
</body>
</html>
`;
};