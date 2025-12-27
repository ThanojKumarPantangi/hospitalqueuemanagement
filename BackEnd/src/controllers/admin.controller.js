import Department from "../models/department.model.js";
import User from "../models/user.model.js";
import Token from "../models/token.model.js";
import { createAdminService } from "../services/admin.service.js";



export const createDepartment=async(req,res)=>{
    try {
        const {name,maxCounters}=req.body;
        const department = await Department.create({
            name,
            maxCounters,
        });
        res.status(201).json({
            message: "Department created successfully",
            department,
        });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

export const closeDepartment = async (req, res) => {
  try {
    const department = await Department.findById(req.params.departmentId);

    if (!department) {
      return res.status(404).json({ message: "Department not found" });
    }

    department.isOpen = false;
    await department.save();

    res.status(200).json({ message: "Department closed successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error closing department", error: error.message });
  }
};

export const createDoctor = async (req, res) => {
  try {
    const { name, email, doctorRollNo, departmentIds = [] } = req.body;

    if (!Array.isArray(departmentIds) || departmentIds.length === 0) {
      return res.status(400).json({
        message: "At least one department must be assigned",
      });
    }

    const doctor = await User.create({
      name,
      email,
      doctorRollNo,
      role: "DOCTOR",
      departments: departmentIds,
      isVerified: false,
      isActive: true,
      isAvailable: false,
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
    const { departmentIds } = req.body;

    if (!Array.isArray(departmentIds) || departmentIds.length === 0) {
      return res.status(400).json({
        message: "At least one department is required",
      });
    }

    const doctor = await User.findOne({
      _id: doctorId,
      role: "DOCTOR",
    });

    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }

    doctor.departments = departmentIds;
    await doctor.save();

    res.status(200).json({
      message: "Doctor departments updated successfully",
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
    const { doctorId } = req.body;

    const doctor = await User.findById(doctorId);
    if (!doctor) {
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

    res.status(200).json({ message: "Doctor marked as on leave" });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const markDoctorAvailable = async (req, res) => {
  try {
    const { doctorId } = req.body;

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
      message: "Doctor marked as available",
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const markDoctorInactive = async (req, res) => {
  const { doctorId } = req.body;

  const doctor = await User.findById(doctorId);
  if (!doctor) throw new Error("Doctor not found");

  doctor.isAvailable = false;
  doctor.isActive = false;
  await doctor.save();

  await Token.updateMany(
    { assignedDoctor: doctorId, status: "CALLED" },
    { status: "WAITING", assignedDoctor: null, calledAt: null }
  );

  res.status(200).json({ message: "Doctor marked as inactive" });
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
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const departments = await Department.find({ isOpen: true }).lean();

    const result = [];

    for (const dept of departments) {
      const currentToken = await Token.findOne({
        department: dept._id,
        appointmentDate: today,
        status: "CALLED",
      })
        .sort({ calledAt: -1 })
        .lean();

      result.push({
        departmentId: dept._id,
        departmentName: dept.name,
        currentToken: currentToken ? currentToken.tokenNumber : null,
        status: currentToken ? "SERVING" : "WAITING",
      });
    }

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

    const [
      totalDoctors,
      verifiedDoctors,
      pendingDoctors,
      openDepartments,
      todayTokens,
    ] = await Promise.all([
      User.countDocuments({ role: "DOCTOR" }),
      User.countDocuments({ role: "DOCTOR", isVerified: true }),
      User.countDocuments({ role: "DOCTOR", isVerified: false }),
      Department.countDocuments({ isOpen: true }),
      Token.countDocuments({ appointmentDate: { $gte: today } }), 
    ]);

    res.status(200).json({
      totalDoctors,
      verifiedDoctors,
      pendingDoctors,
      openDepartments,
      todayTokens,
    });
  } catch (error) {
    res.status(500).json({ message: "Error generating dashboard summary", error: error.message });
  }
};