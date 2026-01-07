import {
  fetchDoctorProfileByUserId,
  updateDoctorProfileByRole,
  fetchPublicDoctors,
} from "../services/doctorProfile.service.js";

/**
 * 👨‍⚕️ Doctor → own profile
 */
export const getMyDoctorProfile = async (req, res) => {
  try {
    const profile = await fetchDoctorProfileByUserId(req.user.id);

    return res.status(200).json({
      success: true,
      profile,
    });
  } catch (error) {
    return res.status(404).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * 👨‍💼 Admin → any doctor profile
 */
export const getDoctorProfileById = async (req, res) => {
  try {
    const { userId } = req.params;

    const profile = await fetchDoctorProfileByUserId(userId);

    return res.status(200).json({
      success: true,
      profile,
    });
  } catch (error) {
    return res.status(404).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * 👨‍⚕️ Doctor updates own profile
 */
export const updateMyDoctorProfile = async (req, res) => {
  try {
    const profile = await updateDoctorProfileByRole({
      actor: req.user,
      targetUserId: req.user._id,
      payload: req.body,
    });

    res.status(200).json({
      success: true,
      profile,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * 👨‍💼 Admin updates any doctor profile
 */
export const adminUpdateDoctorProfile = async (req, res) => {
  try {
    const { userId } = req.params;

    const profile = await updateDoctorProfileByRole({
      actor: req.user,
      targetUserId: userId,
      payload: req.body,
    });

    res.status(200).json({
      success: true,
      profile,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};


export const getPublicDoctors = async (req, res) => {
  try {
    const { department, specialization } = req.query;

    const doctors = await fetchPublicDoctors({
      department,
      specialization,
    });

    res.status(200).json({
      success: true,
      doctors,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};