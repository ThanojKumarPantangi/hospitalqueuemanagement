import User from "../models/user.model.js";
import Department from "../models/department.model.js";
import {createToken,
  getNextToken,
  skipCurrentTokenByDoctor,
  completeCurrentTokenByDoctor,
  cancelToken,
  getPatientActiveToken,
  getUpcomingTokensForPatient,
  getExpectedTokenNumber,
  getPatientTokenHistory,
  getDoctorQueueSummary,
} from "../services/token.service.js";

import { sendEmail } from "../utils/sendEmail.js";
import { tokenBookedTemplate } from "../emailTemplates/tokenBookedTemplate.js";

export const createTokenController = async (req, res) => {
  try {
    const { departmentId, priority, appointmentDate } = req.body;

    if (!req.user.isPhoneVerified) {
      return res.status(403).json({
        message: "Phone number not verified",
      });
    }

    const token = await createToken({
      patientId: req.user._id,
      departmentId,
      requestedPriority: priority,
      createdByRole: req.user.role,
      appointmentDate,
    });

    // ✅ Send response immediately (fast booking)
    res.status(201).json({
      message: "Token created successfully",
      token,
    });

    // ✅ Send confirmation email (does NOT affect booking)
    try {
      const dept = await Department.findById(departmentId).lean();

      if (req.user?.email) {
        await sendEmail({
          to: req.user.email,
          subject: `Token Confirmed - ${dept?.name || "Department"} | Kumar Hospitals`,
          html: tokenBookedTemplate({
            name: req.user.name,
            tokenNumber: token.tokenNumber,
            departmentName: dept?.name || "Unknown Department",
            appointmentDate: new Date(token.appointmentDate).toLocaleDateString(),
          }),
        });
      }
    } catch (emailErr) {
      console.log("Token confirmation email failed:", emailErr.message);
    }
  } catch (error) {
    return res.status(400).json({
      message: error.message,
    });
  }
};

export const callNextTokenController=async(req,res)=>{
    try {
        const doctor = await User.findOne({ _id: req.user._id });
        if (!doctor) {
        return res.status(400).json({
          message: "Doctor profile not found",
        });
      }
        const departmentId = doctor.departments;
        const token =await getNextToken(departmentId,req.user._id);
        if(!token){
            return res.status(200).json({
                message:"No Patient Waiting",
            });
        }

        res.status(200).json({
            message: "Next token called",
            token,
        });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

export const completeCurrentTokenController = async (req, res) => {
  try {
    const doctorId = req.user.id; 

    const token = await completeCurrentTokenByDoctor(doctorId);

    res.status(200).json({
      message: "Token completed",
      token,
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const skipCurrentTokenController = async (req, res) => {
  try {
    const doctorId = req.user.id;

    const token = await skipCurrentTokenByDoctor(doctorId);

    res.status(200).json({
      message: "Token skipped",
      token,
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const cancelTokenController = async (req, res) => {
  try {
    const { id: tokenId } = req.params;

    const token = await cancelToken(tokenId, req.user._id);

    res.status(200).json({
      message: "Token cancelled successfully",
      token,
    });

    try {
      const patient = await User.findById(token.patient).lean();
      const dept = await Department.findById(token.department).lean();

      if (patient?.email) {
        await sendEmail({
          to: patient.email,
          subject: `Token Cancelled - ${dept?.name || "Department"} | Kumar Hospitals`,
          html: tokenCancelledTemplate({
            name: patient.name,
            tokenNumber: token.tokenNumber,
            departmentName: dept?.name || "Department",
            appointmentDate: new Date(token.appointmentDate).toLocaleDateString(),
            cancelledBy: req.user.role || "User",
          }),
        });
      }
    } catch (emailErr) {
      console.log("Cancel token email failed:", emailErr.message);
    }

  } catch (error) {
    res.status(400).json({
      message: error.message,
    });
  }
};

export const getMyCurrentTokenController = async (req, res) => {
  try {
    const patientId = req.user.id;

    const token = await getPatientActiveToken(patientId);

    if (!token) {
      return res.json(null);
    }

    return res.json({
      _id: token._id,
      tokenNumber: token.tokenNumber,
      status: token.status,
      departmentId: token.department._id,
      departmentName: token.department.name,
      priority:token.priority,
      waitingCount: token.waitingCount,
      minMinutes: token.minMinutes,
      maxMinutes: token.maxMinutes,
    });
    
  } catch (error) {
    res.status(500).json({ message: "Error fetching token", error: error.message });
  }
};

export const getMyUpcomingTokens = async (req, res) => {
  try {
    const userId = req.user._id;
    const tokens = await getUpcomingTokensForPatient(userId);

    return res.status(200).json({
      success: true,
      count: tokens.length,
      data: tokens,
    });
    
  } catch (error) {
    console.error("Fetch Tokens Error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while fetching tokens",
    });
  }
};

export const getPatientTokenHistoryController = async (req, res) => {
  try {
    const patientId = req.user.id;

    const tokens = await getPatientTokenHistory(patientId);

    res.status(200).json(tokens);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch token history",
      error: error.message,
    });
  }
};

export const previewTokenNumber = async (req, res, next) => {
  try {
    const { departmentId, appointmentDate } = req.query;

    if (!departmentId || !appointmentDate) {
      return res.status(400).json({
        message: "departmentId and appointmentDate are required",
      });
    }

    const expectedTokenNumber = await getExpectedTokenNumber({
      departmentId,
      appointmentDate,
    });

    return res.status(200).json({
      expectedTokenNumber,
    });
  } catch (err) {
    next(err);
  }
};


/* ===================== GET QUEUE SUMMARY ===================== */

export const getDoctorQueueSummaryController = async (req, res) => {
  try {
    const  departmentId  = req.user.departments;
    const  userId=req.user._id;
    if (!departmentId) {
      return res.status(400).json({
        message: "Department ID is required",
      });
    }

    const summary = await getDoctorQueueSummary({ departmentId ,userId});

    res.status(200).json({
      success: true,
      data: summary,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
