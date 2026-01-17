import { getPatientProfileByUserId,getPatientProfileForDoctor,updatePatientProfile} from "../services/patientProfile.service.js";

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
