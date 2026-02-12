import DoctorProfile from "../models/doctorProfile.model.js";
import User from "../models/user.model.js";

export const fetchDoctorProfileByUserId = async (userId) => {
  // Ensure user exists
  const user = await User.findById(userId)
    .select("name role doctorRollNo isVerified isAvailable isActive email phone");

  if (!user) {
    throw new Error("User not found");
  }

  // Ensure user is a doctor
  if (user.role !== "DOCTOR") {
    throw new Error("User is not a doctor");
  }

  // Fetch doctor profile with department
  const profile = await DoctorProfile.findOne({ user: userId })
    .populate("department", "name consultationFee slotDurationMinutes")
    .lean();
  if (!profile) {
    throw new Error("Doctor profile not found");
  }

  return {
    user: {
      _id: user._id,
      name: user.name,
      doctorRollNo: user.doctorRollNo,
      isVerified: user.isVerified,
      isAvailable: user.isAvailable,
      isActive: user.isActive,
      email: user.email,
      phone:user.phone,
    },
    profile,
  };
};

const DOCTOR_ALLOWED_FIELDS = [
  "bio",
  "opdTimings",
];

const ADMIN_ALLOWED_FIELDS = [
  ...DOCTOR_ALLOWED_FIELDS,
  "department",
  "specialization",
  "experienceYears",
  "qualifications",
];

export const updateDoctorProfileByRole = async ({
  actor,
  targetUserId,
  payload,
}) => {
  // 1Validate target user
  const user = await User.findById(targetUserId).select("role");
  if (!user || user.role !== "DOCTOR") {
    throw new Error("Target user is not a doctor");
  }

  //  Ownership check
  if (
    actor.role === "DOCTOR" &&
    actor._id.toString() !== targetUserId.toString()
  ) {
    throw new Error("Doctors can update only their own profile");
  }

  // Find profile
  let profile = await DoctorProfile.findOne({ user: targetUserId });

  //  CREATE → ADMIN ONLY
  if (!profile) {
    if (actor.role !== "ADMIN") {
      throw new Error("Only admin can create doctor profile");
    }

    const requiredFields = ["department", "specialization"];
    for (const field of requiredFields) {
      if (!payload[field]) {
        throw new Error(`${field} is required to create doctor profile`);
      }
    }

    profile = await DoctorProfile.create({
      user: targetUserId,
      department: payload.department,
      specialization: payload.specialization,
      experienceYears: payload.experienceYears,
      qualifications: payload.qualifications,
      opdTimings: payload.opdTimings,
      bio: payload.bio,
    });

    return profile;
  }

  //  UPDATE
  const allowedFields =
    actor.role === "ADMIN" ? ADMIN_ALLOWED_FIELDS : DOCTOR_ALLOWED_FIELDS;

  const updateData = {};
  for (const key of allowedFields) {
    if (payload[key] !== undefined) {
      updateData[key] = payload[key];
    }
  }

  if (Object.keys(updateData).length === 0) {
    throw new Error("No permitted fields to update");
  }

  // Department change validation ONLY when department is changing
  if (
    updateData.department !== undefined &&
    updateData.department?.toString() !== profile.department?.toString()
  ) {
    const token = await Token.findOne({
      assignedDoctor: targetUserId,
      status: "CALLED",
    });

    if (token) {
      throw new Error("Doctor is currently serving a patient");
    }
  }

  //  Validate OPD timings
  if (updateData.opdTimings) {
    for (const slot of updateData.opdTimings) {
      if (!slot.startTime || !slot.endTime) {
        throw new Error("OPD timing must include startTime and endTime");
      }
      if (slot.startTime >= slot.endTime) {
        throw new Error("Invalid OPD timing range");
      }
    }
  }

  //  Apply update
  profile = await DoctorProfile.findOneAndUpdate(
    { user: targetUserId },
    { $set: updateData },
    { new: true, runValidators: true }
  );

  return profile;
};

export const fetchPublicDoctors = async ({
  department,
  specialization,
}) => {
  // Base user filter (public visibility)
  const userFilter = {
    role: "DOCTOR",
    isActive: true,
    isVerified: true,
  };

  const users = await User.find(userFilter)
    .select("name isAvailable")
    .lean();

  if (users.length === 0) return [];

  const userIds = users.map(u => u._id);

  //  Profile filter (OPERATIONAL)
  const profileFilter = {
    user: { $in: userIds },
  };

  if (department) {
    profileFilter.department = department;
  }

  if (specialization) {
    profileFilter.specialization = specialization;
  }

  //  Fetch profiles with department
  const profiles = await DoctorProfile.find(profileFilter)
    .populate("department", "name consultationFee")
    .select("user specialization experienceYears department")
    .lean();

  const profileMap = new Map(
    profiles.map(p => [p.user.toString(), p])
  );

  //  Merge user + profile data
  return users
    .map(u => {
      const profile = profileMap.get(u._id.toString());
      if (!profile) return null;

      return {
        userId: u._id,
        name: u.name,
        specialization: profile.specialization,
        experienceYears: profile.experienceYears,
        consultationFee: profile.department.consultationFee,
        department: {
          id: profile.department._id,
          name: profile.department.name,
        },
        isAvailable: u.isAvailable,
      };
    })
    .filter(Boolean);
};