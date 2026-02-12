import PatientProfile from "../models/patientProfile.model.js";
import User from "../models/user.model.js";

export const getPatientProfileByUserId = async (userId) => {
  const user = await User.findById(userId)
    .select("name email phone role isPhoneVerified createdAt");
  if (!user) {
    throw new Error("User not found");
  }

  if (user.role !== "PATIENT") {
    throw new Error("Only patients have patient profiles");
  }

  const profile = await PatientProfile.findOne({ userId });

  if (!profile) {
    throw new Error("Patient profile not found");
  }

  return {
    user,
    profile,
  };
};

export const getPatientProfileForDoctor = async (patientUserId) => {
  const user = await User.findById(patientUserId)
    .select("name phone role isPhoneVerified");

  if (!user) {
    throw new Error("Patient not found");
  }

  if (user.role !== "PATIENT") {
    throw new Error("User is not a patient");
  }

  const profile = await PatientProfile.findOne({ userId: patientUserId });

  if (!profile) {
    throw new Error("Patient profile not found");
  }

  return {
    user,
    profile,
  };
};

export const updatePatientProfile = async (userId, updateData) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new Error("User not found");
  }

  if (user.role !== "PATIENT") {
    throw new Error("Only patients can update this profile");
  }

  // ---- USER fields (allow-list)
  const userUpdates = {};
  if (updateData.name) userUpdates.name = updateData.name;
  if (updateData.email) userUpdates.email = updateData.email;

  if (Object.keys(userUpdates).length > 0) {
    await User.findByIdAndUpdate(userId, userUpdates);
  }

  // ---- PATIENT PROFILE allow-list
  const profileUpdates = {};
  if (updateData.dateOfBirth) profileUpdates.dateOfBirth = updateData.dateOfBirth;
  if (updateData.gender) profileUpdates.gender = updateData.gender;
  if (updateData.bloodGroup) profileUpdates.bloodGroup = updateData.bloodGroup;
  if (updateData.emergencyContact) profileUpdates.emergencyContact = updateData.emergencyContact;
  if (updateData.address) profileUpdates.address = updateData.address;

  //  check if profile already exists
  const existingProfile = await PatientProfile.findOne({ userId });

  //  FIRST TIME — create ONLY when user saves modal
  if (!existingProfile) {
    const profile = await PatientProfile.create({
      userId,
      ...profileUpdates,
    });
    return profile;
  }

  //  UPDATE existing profile
  const updatedProfile = await PatientProfile.findOneAndUpdate(
    { userId },
    { $set: profileUpdates },
    {
      new: true,
      runValidators: true,
    }
  );

  return updatedProfile;
};