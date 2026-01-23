export const tokenBookedTemplate = ({
  name = "Patient",
  tokenNumber,
  departmentName,
  appointmentDate,
}) => {
  return `
    <div style="font-family: Arial, sans-serif; padding: 16px;">
      <h2>✅ Token Booked Successfully</h2>
      <p>Hi <b>${name}</b>,</p>
      <p>Your token has been booked at <b>Kumar Hospitals</b>.</p>

      <div style="padding: 12px; border: 1px solid #ddd; border-radius: 8px;">
        <p><b>Token Number:</b> ${tokenNumber}</p>
        <p><b>Department:</b> ${departmentName}</p>
        <p><b>Appointment Date:</b> ${appointmentDate}</p>
      </div>

      <p style="margin-top: 14px;">Please arrive 10–15 minutes early.</p>
      <p style="font-size: 12px; color: gray;">This is an automated email. Please do not reply.</p>
    </div>
  `;
};