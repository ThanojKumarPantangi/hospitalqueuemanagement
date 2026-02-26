import Department from "../models/department.model.js";
import User from "../models/user.model.js";
import Token from "../models/token.model.js";
import { createAdminService } from "../services/users/admin.service.js";
import { verifyPatientQrToken } from "../utils/patientQr.util.js";

const getStartOfISTDay = (date = new Date()) => {
  const d = new Date(date);

  // Convert to IST by adding 5:30
  const istOffsetMs = 5.5 * 60 * 60 * 1000;
  const istDate = new Date(d.getTime() + istOffsetMs);

  // Start of IST day
  istDate.setHours(0, 0, 0, 0);

  // Convert back to UTC Date object for DB match
  return new Date(istDate.getTime() - istOffsetMs);
};

export const createDepartment = async (req, res) => {
  try {
    //  Admin-only
    if (req.user.role !== "ADMIN") {
      return res.status(403).json({
        success: false,
        message: "Admin access required",
      }); 
    }
    const { name, maxCounters, consultationFee, slotDurationMinutes } = req.body;

    // Basic validation
    if (!name || consultationFee == null || slotDurationMinutes == null) {
      return res.status(400).json({
        success: false,
        message: "name, consultationFee, and slotDurationMinutes are required",
      });
    }

    const exists = await Department.exists({ name: name.trim().toLowerCase() });
    if (exists) {
      throw new Error("Department with this name already exists");
    }

    const department = await Department.create({
      name: name.trim().toLowerCase(),
      isOpen: true,
      maxCounters: maxCounters ?? 1,
      consultationFee: Number(consultationFee),
      slotDurationMinutes: Number(slotDurationMinutes),
    });

    return res.status(201).json({
      success: true,
      message: "Department created successfully",
      department,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const updateDepartmentSettings = async (req, res) => {
  try {
    if (req.user.role !== "ADMIN") {
      return res.status(403).json({
        success: false,
        message: "Admin access required",
      });
    }

  const ADMIN_DEPARTMENT_EDIT_FIELDS = [
    "name",
    "maxCounters",
    "consultationFee",
    "slotDurationMinutes",
  ];

    const { departmentId } = req.params;
    const payload = req.body;

    const updateData = {};
    for (const field of ADMIN_DEPARTMENT_EDIT_FIELDS) {
      if (payload[field] !== undefined) {
        updateData[field] = payload[field];
      }
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        success: false,
        message: "No valid fields to update",
      });
    }

    if (updateData.name) {
      const normalizedName = updateData.name.trim().toLowerCase();

      const exists = await Department.exists({
        name: normalizedName,
        _id: { $ne: departmentId },
      });

      if (exists) {
        return res.status(400).json({
          success: false,
          message: "Department with this name already exists",
        });
      }

      updateData.name = normalizedName;
    }

    const department = await Department.findByIdAndUpdate(
      departmentId,
      { $set: updateData },
      { new: true, runValidators: true }
    ).lean();

    if (!department) {
      return res.status(404).json({
        success: false,
        message: "Department not found",
      });
    }

    return res.status(200).json({
      success: true,
      department,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const updateDepartmentStatus = async (req, res) => {
  try {
    const { isOpen } = req.body;
    if (typeof isOpen !== "boolean") {
      return res.status(400).json({ message: "isOpen must be boolean" });
    }

    const department = await Department.findById(req.params.departmentId);
    if (!department) {
      return res.status(404).json({ message: "Department not found" });
    }

    department.isOpen = isOpen;
    await department.save();

    res.status(200).json({
      message: `Department ${isOpen ? "opened" : "closed"} successfully`,
      isOpen: department.isOpen,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error updating department status",
      error: error.message,
    });
  }
};

export const createDoctor = async (req, res) => {
  try {
    const { name, email, doctorRollNo, departmentIds} = req.body;

    if (!Array.isArray(departmentIds) || departmentIds.length === 0) {
      return res.status(400).json({
        message: "At least one department must be assigned",
      });
    }

    const doctor = await User.create({
      name:name.trim().toLowerCase(),
      email: email.trim().toLowerCase(),
      doctorRollNo,
      role: "DOCTOR",
      departments: departmentIds,
      isVerified: false,
      isActive: true,
      isAvailable: true,
    });

    res.status(201).json({
      message: "Doctor pre-registered successfully",
      doctor,
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const verifyDoctor = async (req, res) => {
  try {
    const { doctorId } = req.body;

    const doctor = await User.findById(doctorId);
    if (!doctor || doctor.role !== "DOCTOR") {
      return res.status(404).json({ message: "Doctor not found" });
    }

    doctor.isVerified = true;
    await doctor.save();

    res.status(200).json({
      message: "Doctor verified successfully",
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const getNotVerifiedDoctors = async (req, res) => {
  try {
    const doctors = await User.find({
      role: "DOCTOR",
      isVerified: false,
    })
      .select("-password")
      .populate("departments", "name");

    res.status(200).json({
      count: doctors.length,
      doctors,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch not verified doctors",
    });
  }
};

export const updateDoctorDepartments = async (req, res) => {
  try {
    const { doctorId } = req.params;
    const { departmentId } = req.body;

    if (!departmentId) {
      return res.status(400).json({
        message: "Department is required",
      });
    }

    const doctor = await User.findOne({
      _id: doctorId,
      role: "DOCTOR",
    });

    const token=await Token.findOne({assignedDoctor:doctorId,status:"CALLED"})
    if(token){
      return res.status(400).json({
        message: "Doctor is currently serving a patient",
      });
    }

    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }

    // store as single department
    doctor.departments = departmentId;
    await doctor.save();

    res.status(200).json({
      message: "Doctor department updated successfully",
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const getDoctorById = async (req, res) => {
  try {
    const doctor = await User.findOne({
      _id: req.params.doctorId,
      role: "DOCTOR",
    })
      .select("-password")
      .populate("departments", "name");

    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }

    res.status(200).json(doctor);
  } catch (error) {
    res.status(500).json({ message: "Error retrieving doctor", error: error.message });
  }
};

export const getDoctors = async (req, res) => {
  try {
    const { isVerified, isActive, isAvailable, departmentId } = req.query;

    let filter = { role: "DOCTOR" };

    if (isVerified !== undefined) {
      filter.isVerified = isVerified === "true";
    }

    if (isActive !== undefined) {
      filter.isActive = isActive === "true";
    }

    if (isAvailable !== undefined) {
      filter.isAvailable = isAvailable === "true";
    }

    if (departmentId) {
      filter.departments = departmentId;
    }

    const doctors = await User.find(filter)
      .select("-password")
      .populate("departments", "name");

    res.status(200).json(doctors);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const markDoctorOnLeave = async (req, res) => {
  try {
    const doctorId =
      req.user.role === "ADMIN"
        ? req.body.doctorId
        : req.user.id;

    const doctor = await User.findById(doctorId);
    if (!doctor || doctor.role !== "DOCTOR") {
      return res.status(404).json({ message: "Doctor not found" });
    }

    const activeToken = await Token.findOne({
      assignedDoctor: doctorId,
      status: "CALLED",
    });

    if (activeToken) {
      return res.status(400).json({
        message: "Doctor is currently serving a patient",
      });
    }

    doctor.isAvailable = false;
    doctor.isActive = true;
    await doctor.save();

    res.status(200).json({
      message:
        req.user.role === "ADMIN"
          ? "Doctor marked as on leave"
          : "You are now on break",
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const markDoctorAvailable = async (req, res) => {
  try {
    const doctorId =
      req.user.role === "ADMIN"
        ? req.body.doctorId
        : req.user.id;

    const doctor = await User.findById(doctorId);
    if (!doctor || doctor.role !== "DOCTOR") {
      return res.status(404).json({ message: "Doctor not found" });
    }

    if (!doctor.isVerified) {
      return res.status(400).json({
        message: "Doctor must be verified before becoming available",
      });
    }

    if (!doctor.isActive) {
      return res.status(400).json({
        message: "Inactive doctor must be activated first",
      });
    }

    doctor.isAvailable = true;
    await doctor.save();

    res.status(200).json({
      message:
        req.user.role === "ADMIN"
          ? "Doctor marked as available"
          : "You are now available",
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const markDoctorInactive = async (req, res) => {
  try {
    const { doctorId } = req.body;

    if (!doctorId) {
      return res.status(400).json({
        message: "Doctor ID is required",
      });
    }

    const doctor = await User.findOne({
      _id: doctorId,
      role: "DOCTOR",
    });

    if (!doctor) {
      return res.status(404).json({
        message: "Doctor not found",
      });
    }

    // Mark doctor inactive
    doctor.isAvailable = false;
    doctor.isActive = false;
    await doctor.save();

    // Reset any active tokens assigned to this doctor
    await Token.updateMany(
      {
        assignedDoctor: doctorId,
        status: "CALLED",
      },
      {
        status: "WAITING",
        assignedDoctor: null,
        calledAt: null,
      }
    );

    return res.status(200).json({
      message: "Doctor marked as inactive",
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to mark doctor as inactive",
      error: error.message,
    });
  }
};

export const activateDoctor = async (req, res) => {
  try {
    const { doctorId } = req.body;

    const doctor = await User.findById(doctorId);
    if (!doctor || doctor.role !== "DOCTOR") {
      return res.status(404).json({ message: "Doctor not found" });
    }

    doctor.isActive = true;
    doctor.isAvailable = true;

    await doctor.save();

    res.status(200).json({
      message: "Doctor reactivated successfully",
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const createAdminController = async (req, res) => {
  try {
    const admin = await createAdminService(req.body);
    res.status(201).json({ message: "Admin created", adminId: admin._id });
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
};

export const getDepartmentsStatus = async (req, res) => {
  try {
    //  IST day range
    const dayStart = getStartOfISTDay(new Date());
    const dayEnd = new Date(dayStart);
    dayEnd.setDate(dayEnd.getDate() + 1);

    // Get ALL departments
    const departments = await Department.find({}).lean();

    const result = await Promise.all(
      departments.map(async (dept) => {
        // CLOSED department → no token queries
        if (!dept.isOpen) {
          return {
            _id: dept._id,
            name: dept.name,
            maxCounters: dept.maxCounters,
            slotDurationMinutes: dept.slotDurationMinutes,
            consultationFee: dept.consultationFee,
            isOpen: false,
            serving: "-",
            waiting: 0,
          };
        }

        // OPEN department → fetch token info
        const [currentToken, waitingCount] = await Promise.all([
          Token.findOne({
            department: dept._id,
            appointmentDate: { $gte: dayStart, $lt: dayEnd },
            status: "CALLED",
          })
            .sort({ calledAt: -1 })
            .lean(),

          Token.countDocuments({
            department: dept._id,
            appointmentDate: { $gte: dayStart, $lt: dayEnd },
            status: "WAITING",
          }),
        ]);

        return {
          _id: dept._id,
          name: dept.name,
          maxCounters: dept.maxCounters,
          slotDurationMinutes: dept.slotDurationMinutes,
          consultationFee: dept.consultationFee,
          isOpen: true,
          serving: currentToken ? currentToken.tokenNumber : "-",
          waiting: waitingCount,
        };
      })
    );

    res.status(200).json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Failed to fetch department status",
    });
  }
};

export const getAdminDashboardSummary = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const [
      totalDoctors,
      activeDoctors,
      availableDoctors,
      pendingDoctors,
      openDepartments,
      closedDepartments,
      todayTokens,
      waitingTokens,
      completedTokens,
    ] = await Promise.all([
      User.countDocuments({ role: "DOCTOR" }),
      User.countDocuments({ role: "DOCTOR", isVerified: true ,isActive:true}),
      User.countDocuments({ role: "DOCTOR", isVerified: true ,isAvailable:true}),
      User.countDocuments({ role: "DOCTOR", isVerified: false }),
      Department.countDocuments({ isOpen: true }),
      Department.countDocuments({ isOpen: false }),
      Token.countDocuments({ appointmentDate: { $gte: today, $lt: tomorrow } }), 
      Token.countDocuments({ appointmentDate: { $gte: today, $lt: tomorrow }, status: "WAITING"}),
      Token.countDocuments({ appointmentDate: { $gte: today, $lt: tomorrow }, status: "COMPLETED"})
    ]);

    res.status(200).json({
      totalDoctors,
      activeDoctors,
      availableDoctors,
      pendingDoctors,
      openDepartments,
      closedDepartments,
      todayTokens,
      waitingTokens,
      completedTokens,
    });
  } catch (error) {
    res.status(500).json({ message: "Error generating dashboard summary", error: error.message });
  }
};

export const verifyPatientQrController = async (req, res) => {
  try {
    if (req.user.role !== "ADMIN") {
      return res.status(403).json({ message: "Access denied" });
    }

    const { qrText } = req.body;
    if (!qrText) {
      return res.status(400).json({ message: "QR text required" });
    }

    // expected format: PATIENT_QR:<token>
    const parts = qrText.split("PATIENT_QR:");
    if (parts.length !== 2) {
      return res.status(400).json({ message: "Invalid QR format" });
    }

    const token = parts[1].trim();

    const decoded = verifyPatientQrToken(token);

    const patient = await User.findById(decoded.patientId).select(
      "_id name phone role isActive"
    );

    if (!patient || patient.role !== "PATIENT" || !patient.isActive) {
      return res.status(404).json({ message: "Patient not found" });
    }

    res.json({
      patientId: patient._id,
      name: patient.name,
      phone: patient.phone,
    });
  } catch (error) {
    res.status(400).json({ message: error.message || "QR verification failed" });
  }
};

export const lookupUserByPhoneOrEmail = async (req, res) => {
  try {
    const { phone, email } = req.query;

    // Validate input
    if (!phone && !email) {
      return res.status(400).json({
        message: "Please provide phone or email",
      });
    }

    // Build query safely
    const query = {};

    if (phone) {
      const cleanedPhone = String(phone).trim();

      // Basic validation (India 10-digit)
      if (!/^\d{10}$/.test(cleanedPhone)) {
        return res.status(400).json({
          message: "Invalid phone number format (must be 10 digits)",
        });
      }

      query.phone = cleanedPhone;
    }

    if (email) {
      const cleanedEmail = String(email).trim().toLowerCase();

      // Basic email validation
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanedEmail)) {
        return res.status(400).json({
          message: "Invalid email format",
        });
      }

      query.email = cleanedEmail;
    }

    // Find user
    const user = await User.findOne(query).select("_id name phone email role");

    if (!user) {
      return res.status(404).json({
        message: "Patient not found",
      });
    }

    // Optional: only allow patient lookup
    if (user.role !== "PATIENT") {
      return res.status(403).json({
        message: "Only patients can be searched using this lookup",
      });
    }

    return res.status(200).json({
      patientId: user._id,
      name: user.name,
      phone: user.phone,
      email: user.email,
    });
  } catch (error) {
    console.error("lookupUserByPhoneOrEmail error:", error);
    return res.status(500).json({
      message: "Server error",
    });
  }
};

export const getUserByIdentifierController = async (req, res) => {
  try {
    const { identifier } = req.query;

    if (!identifier) {
      return res.status(400).json({
        message: "Identifier is required",
      });
    }

    // email OR phone lookup
    const user = await User.findOne({
      $or: [
        { email: identifier },
        { phone: identifier },
      ],
    }).select("_id name email phone role");

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    return res.status(200).json({
      user,
    });

  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch user",
    });
  }
};
