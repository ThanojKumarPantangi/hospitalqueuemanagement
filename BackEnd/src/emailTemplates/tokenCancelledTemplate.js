export const tokenCancelledTemplate = ({
  name = "Patient",
  hospitalName = "Smart Q",
  tokenNumber = "-",
  departmentName = "-",
  appointmentDate = "-",
  cancelledBy = "You",
  supportEmail = "support@Smart Q.com",
}) => {
  const year = new Date().getFullYear();

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Token Cancelled</title>
</head>

<body style="margin:0;padding:0;background:#F1F5F9;font-family:Arial,Helvetica,sans-serif;">
  <center style="width:100%;background:#F1F5F9;padding:28px 12px;">

    <table role="presentation" cellpadding="0" cellspacing="0" border="0"
      style="width:100%;max-width:640px;background:#ffffff;border-radius:18px;overflow:hidden;box-shadow:0 10px 30px rgba(15,23,42,0.10);">

      <!-- Header -->
      <tr>
        <td style="background:linear-gradient(90deg,#EF4444,#F97316);padding:22px 22px;">
          <div style="color:#ffffff;font-size:14px;font-weight:800;letter-spacing:1px;text-transform:uppercase;">
            ${hospitalName}
          </div>
          <div style="color:#ffffff;font-size:22px;font-weight:900;margin-top:6px;">
            Token Cancelled ❌
          </div>
          <div style="color:rgba(255,255,255,0.92);font-size:13px;margin-top:6px;">
            Your token has been cancelled successfully.
          </div>
        </td>
      </tr>

      <!-- Body -->
      <tr>
        <td style="padding:26px 22px;">
          
          <div style="font-size:15px;color:#0F172A;font-weight:800;">
            Hi ${name},
          </div>

          <div style="margin-top:10px;font-size:14px;line-height:22px;color:#334155;">
            Your token booking has been cancelled by <b>${cancelledBy}</b>.
            If this was not you, please contact support immediately.
          </div>

          <!-- Cancel Card -->
          <table role="presentation" cellpadding="0" cellspacing="0" border="0"
            style="width:100%;margin-top:18px;background:#FFF7ED;border:1px solid #FED7AA;border-radius:16px;">
            <tr>
              <td style="padding:18px;">

                <div style="font-size:12px;color:#9A3412;font-weight:900;letter-spacing:1px;text-transform:uppercase;">
                  Cancelled Booking Details
                </div>

                <div style="margin-top:14px;">
                  <div style="font-size:12px;color:#FB923C;font-weight:700;">
                    Token Number
                  </div>
                  <div style="font-size:28px;color:#9A3412;font-weight:900;margin-top:4px;">
                    ${tokenNumber}
                  </div>

                  <div style="margin-top:14px;height:1px;background:#FED7AA;"></div>

                  <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="width:100%;margin-top:14px;">
                    <tr>
                      <td style="width:50%;padding-right:8px;vertical-align:top;">
                        <div style="font-size:12px;color:#FB923C;font-weight:700;">Department</div>
                        <div style="margin-top:4px;font-size:14px;color:#0F172A;font-weight:800;">
                          ${departmentName}
                        </div>
                      </td>
                      <td style="width:50%;padding-left:8px;vertical-align:top;">
                        <div style="font-size:12px;color:#FB923C;font-weight:700;">Appointment Date</div>
                        <div style="margin-top:4px;font-size:14px;color:#0F172A;font-weight:800;">
                          ${appointmentDate}
                        </div>
                      </td>
                    </tr>
                  </table>
                </div>

              </td>
            </tr>
          </table>

          <!-- Rebook Tip -->
          <table role="presentation" cellpadding="0" cellspacing="0" border="0"
            style="width:100%;margin-top:16px;background:#F8FAFC;border:1px solid #E2E8F0;border-radius:14px;">
            <tr>
              <td style="padding:14px;">
                <div style="font-size:13px;color:#334155;line-height:20px;">
                  📌 You can book a new token anytime from the app.
                </div>
              </td>
            </tr>
          </table>

          <!-- Footer -->
          <div style="margin-top:18px;font-size:12px;color:#64748B;line-height:18px;">
            Need help? Contact us at
            <a href="mailto:${supportEmail}" style="color:#0284C7;text-decoration:underline;">
              ${supportEmail}
            </a>
          </div>

        </td>
      </tr>

      <!-- Bottom Footer -->
      <tr>
        <td style="padding:16px 22px;background:#F8FAFC;border-top:1px solid #E2E8F0;">
          <div style="font-size:11px;color:#94A3B8;line-height:16px;text-align:center;">
            © ${year} ${hospitalName}. This is an automated email. Please do not reply.
          </div>
        </td>
      </tr>

    </table>
  </center>
</body>
</html>
  `;
};