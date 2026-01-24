import { getPatientProfileByUserId,getPatientProfileForDoctor,updatePatientProfile} from "../services/patientProfile.service.js";
import QRCode from "qrcode";
import { generatePatientQrToken } from "../utils/patientQr.util.js";

export const getMyPatientProfileController = async (req, res) => {
  try {
    const userId = req.user.id;

    const data = await getPatientProfileByUserId(userId);

    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    res.status(404).json({
      success: false,
      message: error.message,
    });
  }
};

export const getPatientProfileForDoctorController = async (req, res) => {
  try {
    if (req.user.role !== "DOCTOR") {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    const { patientId } = req.params;
    const data = await getPatientProfileForDoctor(patientId);

    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    res.status(404).json({
      success: false,
      message: error.message,
    });
  }
};

export const updateMyPatientProfileController = async (req, res) => {
  try {
    if (req.body==='') {
      return res.status(403).json({
        success: false,
        message: "NO DATA PROVIDED",
      });
    }
    const updatedProfile = await updatePatientProfile(req.user.id, req.body);

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      data: updatedProfile,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const getPatientQrController = async (req, res) => {
  try {
    const token = generatePatientQrToken(req.user._id);

    // QR content (token only)
    const qrText = `PATIENT_QR:${token}`;

    // Generate QR image as base64
    const qrImage = await QRCode.toDataURL(qrText);

    res.json({
      qrImage, // frontend shows this in <img src="..." />
      expiresIn: "5 minutes",
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to generate QR" });
  }
};