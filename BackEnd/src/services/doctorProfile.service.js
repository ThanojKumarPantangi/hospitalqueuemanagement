import DoctorProfile from "../models/doctorProfile.model.js";
import User from "../models/user.model.js";

export const fetchDoctorProfileByUserId = async (userId) => {
  // 1️⃣ Ensure user exists
  const user = await User.findById(userId)
    .select("name role doctorRollNo isVerified departments isAvailable");

  if (!user) {
    throw new Error("User not found");
  }

  // 2️⃣ Ensure user is a doctor
  if (user.role !== "DOCTOR") {
    throw new Error("User is not a doctor");
  }

  // 3️⃣ Fetch doctor profile
  const profile = await DoctorProfile.findOne({ user: userId })
    .populate("user", "name doctorRollNo isVerified")
    .lean();

  if (!profile) {
    throw new Error("Doctor profile not found");
  }

  return {
    ...profile,
    user,
  };
};

const DOCTOR_ALLOWED_FIELDS = [
  "bio",
  "consultationFee",
  "slotDurationMinutes",
  "opdTimings",
];

export const updateDoctorProfileByRole = async ({
  actor,
  targetUserId,
  payload,
}) => {
  // 1️⃣ Ensure target user exists & is a doctor
  const user = await User.findById(targetUserId).select("role");

  if (!user || user.role !== "DOCTOR") {
    throw new Error("Target user is not a doctor");
  }

  // 2️⃣ Ownership check for doctors
  if (actor.role === "DOCTOR" && actor._id.toString() !== targetUserId.toString()) {
    throw new Error("Doctors can update only their own profile");
  }

  // 3️⃣ Field-level permission filtering
  let updateData = {};

  if (actor.role === "ADMIN") {
    updateData = payload; // full access
  } else {
    // DOCTOR
    for (const key of DOCTOR_ALLOWED_FIELDS) {
      if (payload[key] !== undefined) {
        updateData[key] = payload[key];
      }
    }
  }

  if (Object.keys(updateData).length === 0) {
    throw new Error("No permitted fields to update");
  }

  // 4️⃣ Validate OPD timings (basic safety)
  if (updateData.opdTimings) {
    for (const slot of updateData.opdTimings) {
      if (slot.startTime >= slot.endTime) {
        throw new Error("Invalid OPD timing range");
      }
    }
  }

  // 5️⃣ Update profile
  const profile = await DoctorProfile.findOneAndUpdate(
    { user: targetUserId },
    updateData,
    { new: true }
  );

  if (!profile) {
    throw new Error("Doctor profile not found");
  }

  return profile;
};

export const fetchPublicDoctors = async ({
  department,
  specialization,
}) => {
  const userFilter = {
    role: "DOCTOR",
    isActive: true,
    isVerified: true,
  };

  if (department) {
    userFilter.departments = department;
  }

  const doctors = await User.find(userFilter)
    .select("name departments isAvailable")
    .lean();

  const userIds = doctors.map(d => d._id);

  const profileFilter = {
    user: { $in: userIds },
  };

  if (specialization) {
    profileFilter.specialization = specialization;
  }

  const profiles = await DoctorProfile.find(profileFilter)
    .select("user specialization experienceYears consultationFee")
    .lean();

  const profileMap = new Map(
    profiles.map(p => [p.user.toString(), p])
  );

  return doctors.map(d => {
    const profile = profileMap.get(d._id.toString());

    return {
      userId: d._id,
      name: d.name,
      specialization: profile?.specialization || null,
      experienceYears: profile?.experienceYears || null,
      consultationFee: profile?.consultationFee || null,
      departments: d.departments,
      isAvailable: d.isAvailable,
    };
  });
};