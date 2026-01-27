export const tokenBookedTemplate = ({
  name = "Patient",
  hospitalName = "Smart Q",
  tokenNumber = "-",
  departmentName = "-",
  appointmentDate = "-",
  priority = "NORMAL",
  queuePosition = null,
  supportEmail = "support@Smart Q.com",
}) => {
  const year = new Date().getFullYear();

  const priorityConfig = {
    EMERGENCY: { bg: "#FEF2F2", text: "#DC2626", icon: "🚨", label: "EMERGENCY" },
    SENIOR: { bg: "#FFFBEB", text: "#D97706", icon: "⭐", label: "SENIOR CARE" },
    NORMAL: { bg: "#F0F9FF", text: "#0284C7", icon: "📅", label: "STANDARD" },
  };

  const config = priorityConfig[priority] || priorityConfig.NORMAL;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    @media only screen and (max-width: 600px) {
      .inner-padding { padding: 20px !important; }
      .token-text { font-size: 48px !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background-color:#F8FAFC;font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <center style="width:100%;table-layout:fixed;background-color:#F8FAFC;padding-bottom:40px;">
    <div style="max-width:600px;margin:0 auto;">
      
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:20px;">
        <tr>
          <td align="center" style="padding:20px 0;">
            <div style="font-size:18px;font-weight:700;color:#1E293B;letter-spacing:-0.5px;display:flex;align-items:center;justify-content:center;">
              <span style="background:#4F46E5;width:24px;height:24px;border-radius:6px;display:inline-block;margin-right:8px;"></span>
              ${hospitalName}
            </div>
          </td>
        </tr>
      </table>

      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#ffffff;border-radius:24px;border:1px solid #E2E8F0;overflow:hidden;">
        
        <tr>
          <td style="background:${config.bg};padding:12px 24px;text-align:center;">
             <span style="color:${config.text};font-size:12px;font-weight:800;letter-spacing:1px;text-transform:uppercase;">
               ${config.icon} ${config.label} ACCESS
             </span>
          </td>
        </tr>

        <tr>
          <td class="inner-padding" style="padding:40px 48px;">
            <h1 style="margin:0;font-size:28px;font-weight:800;color:#0F172A;line-height:1.2;">
              Confirmed.
            </h1>
            <p style="margin:12px 0 0 0;font-size:16px;color:#64748B;line-height:1.5;">
              Hello ${name}, your appointment at <strong>${departmentName}</strong> is ready. Please find your digital token below.
            </p>

            <div style="margin-top:32px;border:2px solid #F1F5F9;border-radius:20px;position:relative;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="center" style="padding:32px 20px;border-bottom:2px dashed #F1F5F9;">
                    <div style="font-size:13px;font-weight:700;color:#94A3B8;text-transform:uppercase;letter-spacing:2px;">Your Token Number</div>
                    <div class="token-text" style="font-size:64px;font-weight:900;color:#4F46E5;margin:10px 0;letter-spacing:-2px;">
                      ${tokenNumber}
                    </div>
                    <div style="display:inline-block;background:#F1F5F9;padding:6px 14px;border-radius:8px;font-size:13px;color:#475569;font-weight:600;">
                      ${appointmentDate}
                    </div>
                  </td>
                </tr>
                <tr>
                  <td style="padding:24px;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td width="50%" style="padding-bottom:16px;">
                           <div style="font-size:11px;color:#94A3B8;font-weight:700;text-transform:uppercase;">Department</div>
                           <div style="font-size:15px;color:#1E293B;font-weight:700;margin-top:4px;">${departmentName}</div>
                        </td>
                        <td width="50%" style="padding-bottom:16px;">
                           <div style="font-size:11px;color:#94A3B8;font-weight:700;text-transform:uppercase;">Queue Status</div>
                           <div style="font-size:15px;color:#1E293B;font-weight:700;margin-top:4px;">
                            ${queuePosition !== null ? `Position #${queuePosition}` : "Waiting"}
                           </div>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </div>

            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:24px;">
              <tr>
                <td style="background:#F8FAFC;border-radius:12px;padding:16px;">
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                    <tr>
                      <td width="32" valign="top" style="font-size:20px;">💡</td>
                      <td style="font-size:14px;color:#475569;line-height:1.5;padding-left:10px;">
                        <strong>Quick Arrival:</strong> We recommend arriving 15 minutes before your slot. Please keep your previous medical files handy.
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>

          </td>
        </tr>
      </table>

      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:30px;">
        <tr>
          <td align="center">
            <p style="font-size:14px;color:#64748B;margin:0;">
              Need to reschedule or have questions?
            </p>
            <div style="margin-top:12px;">
              <a href="mailto:${supportEmail}" style="color:#4F46E5;font-weight:700;text-decoration:none;font-size:14px;">Contact Support Center &rarr;</a>
            </div>
            
            <div style="margin-top:40px;padding-top:20px;border-top:1px solid #E2E8F0;">
              <p style="font-size:12px;color:#94A3B8;line-height:1.6;">
                © ${year} ${hospitalName}. All rights reserved.<br>
                This is an automated security notification.
              </p>
            </div>
          </td>
        </tr>
      </table>

    </div>
  </center>
</body>
</html>
  `;
};