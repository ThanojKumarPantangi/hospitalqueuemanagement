import {
  createVisit,
  getPatientVisits,
} from "../services/visit.service.js";

export const createVisitController=async(req,res)=>{
    try {
        const {tokenId,symptoms,diagnosis,prescriptions}=req.body;
        const visit=await createVisit({
            tokenId,
            doctorId:req.user._id,
            symptoms,
            diagnosis,
            prescriptions,
        });
        res.status(201).json({
            message:"Visit Record Created Successfully",
            visit,
        });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

export const getPatientVisitsController=async(req,res)=>{
    try {
        const {patientId}=req.params;

        if(req.user.role==="PATIENT" && 
            req.user._id.toString()!==patientId
        ){
            return res.status(403).json({
            message: "Access denied",
      });
        }
        const visits = await getPatientVisits(patientId);
        res.status(200).json({
            visits,
        });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
}