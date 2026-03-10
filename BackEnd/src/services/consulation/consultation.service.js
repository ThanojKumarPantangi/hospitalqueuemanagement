import ConsultationSession from "../../models/consultationSession.model.js";
import Token from "../../models/token.model.js"

export const startConsultationService = async ({
  tokenId,
  doctorId,
}) => {

  const roomId = `consultation:${tokenId}`;

  const token = await Token.findById(tokenId);

  const existing = await ConsultationSession.findOne({
    token: tokenId,
    active: true
  });

  if (existing) {
    // throw new Error("Consultation already active");
    return existing;
  }

  const session = await ConsultationSession.create({
    token: tokenId,
    roomId,
    doctor: doctorId,
    patient: token.patient,
    active: true
  });

  return session;
};


export const getConsultationService = async (tokenId) => {
  const session = await ConsultationSession.findOne({
    token: tokenId,
    active: true
  });

  return session;
};


export const endConsultationService = async (roomId) => {

  const session = await ConsultationSession.findOne({
    roomId,
    active: true
  });

  if (!session) {
    throw new Error("Session not found");
  }

  session.active = false;
  session.endedAt = new Date();

  await session.save();

  return session;
};