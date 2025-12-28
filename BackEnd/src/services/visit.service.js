import Visit from "../models/visit.model.js";
import Token from "../models/token.model.js";

export const createVisit=async({
        tokenId,
        doctorId,
        symptoms,
        diagnosis,
        prescriptions = [],
    })=>{
        const token =await Token.findById(tokenId)
        .populate("patient")
        .populate("department");

        if(!token) throw new Error("Token Not Found");

        if(token.status!=="CALLED" && token.status!=="COMPLETED"){
            throw new Error("Token is not in the valid state for visit creation")
        }

        const visit=await Visit.create({
            patient: token.patient._id,
            doctor: doctorId,
            department: token.department._id,
            token: token._id,
            symptoms,
            diagnosis,
            prescriptions,
        });
        return visit;
};

export const getPatientVisitsService = async (
  patientId,
  { limit = 10 } = {}
) => {
  return Visit.find({ patient: patientId })
    .populate("doctor", "name")
    .populate("department", "name")
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();
};