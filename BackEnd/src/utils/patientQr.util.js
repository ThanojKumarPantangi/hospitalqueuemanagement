import jwt from "jsonwebtoken";

export const generatePatientQrToken = (patientId) => {
  return jwt.sign(
    {
      type: "PATIENT_QR",
      patientId,
    },
    process.env.PATIENT_QR_EXPIRES,
    { expiresIn: "5m" } // short-lived
  );
};

export const verifyPatientQrToken = (token) => {
  const decoded = jwt.verify(token, process.env.PATIENT_QR_SECRET);

  if (decoded.type !== "PATIENT_QR") {
    throw new Error("Invalid QR token");
  }

  return decoded;
};