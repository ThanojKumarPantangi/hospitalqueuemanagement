import {
  startConsultationService,
  getConsultationService,
  endConsultationService
} from "../services/consulation/consultation.service.js";

export const startConsultation = async (req, res) => {

  try {

    const { tokenId } = req.body;
    const doctorId = req.user.id;

    const session = await startConsultationService({
      tokenId,
      doctorId,
    });

    res.status(201).json({
      success: true,
      roomId: session.roomId,
      sessionId: session._id
    });

  } catch (error) {

    res.status(400).json({
      success: false,
      message: error.message
    });

  }

};


export const getConsultation = async (req, res) => {

  try {

    const { tokenId } = req.params;

    const session = await getConsultationService(tokenId);

    if (!session) {
      return res.json({ active: false });
    }

    res.json({
      active: true,
      roomId: session.roomId,
      doctorJoined: session.doctorJoined,
      patientJoined: session.patientJoined
    });

  } catch (error) {

    res.status(500).json({
      message: "Failed to fetch consultation session"
    });

  }

};


export const endConsultation = async (req, res) => {

  try {

    const { roomId } = req.body;

    await endConsultationService(roomId);

    res.json({
      success: true,
      message: "Consultation ended"
    });

  } catch (error) {

    res.status(400).json({
      success: false,
      message: error.message
    });

  }

};