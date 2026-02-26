import {
  createVisit,
  getPatientVisitsService,
} from "../services/visit/visit.service.js";

import Visit from "../models/visit.model.js";

export const createVisitController = async (req, res) => {
  try {
    const {
      tokenId,
      symptoms,
      diagnosis,
      prescriptions,
      followUpDate,
      vitals,
    } = req.body;

    const visit = await createVisit({
      tokenId,
      doctorId: req.user._id,
      symptoms,
      diagnosis,
      prescriptions,
      followUpDate,
      vitals,
    });

    res.status(201).json({
      message: "Visit Record Created Successfully",
      visit,
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const getPatientVisitsController = async (req, res) => {
  try {
    const { role, id: userId } = req.user;

    let patientId;

    // 🧑‍⚕️ Doctor/Admin → patientId comes from params
    if (role === "DOCTOR" || role === "ADMIN") {
      patientId = req.params.patientId;

      if (!patientId) {
        return res.status(400).json({
          message: "Patient ID is required",
        });
      }

      // 🔐 Doctor must be related to this patient
      if (role === "DOCTOR") {
        const hasAccess = await Visit.exists({
          patient: patientId,
          doctor: userId,
        });

        if (!hasAccess) {
          return res.status(403).json({
            message: "Access denied",
          });
        }
      }
    }

    // 🧑 Patient → patientId comes from JWT
    if (role === "PATIENT") {
      patientId = userId;
    }

    const visits = await getPatientVisitsService(patientId);

    return res.status(200).json({
      success: true,
      count: visits.length,
      visits,
    });

  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch patient visits",
      error: error.message,
    });
  }
};