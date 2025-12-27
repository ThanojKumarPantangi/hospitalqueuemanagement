import RefreshToken from "../models/refreshToken.model.js";
import bcrypt from "bcrypt";
import {  verifyRefreshToken,
  generateAccessToken,
  generateRefreshToken, } from "../utils/jwt.util.js";

export const rotateRefreshToken = async (incomingToken) => {
  const decoded = verifyRefreshToken(incomingToken);

  const storedTokens = await RefreshToken.find({
    user: decoded.id,
    revoked: false,
  });

  let matchedToken = null;

  for (const t of storedTokens) {
    const isMatch = await bcrypt.compare(incomingToken, t.token);
    if (isMatch) {
      matchedToken = t;
      break;
    }
  }

  if (!matchedToken) {

    await RefreshToken.updateMany(
      { user: decoded.id },
      { revoked: true }
    );
    throw new Error("Refresh token reuse detected");
  }


  matchedToken.revoked = true;

  const payload = { id: decoded.id, role: decoded.role };

  const newAccessToken = generateAccessToken(payload);
  const newRefreshToken = generateRefreshToken(payload);

  const hashedNewToken = await bcrypt.hash(newRefreshToken, 10);

  matchedToken.replacedByToken = hashedNewToken;
  await matchedToken.save();

  await RefreshToken.create({
    user: decoded.id,
    token: hashedNewToken,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  });

  return {
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
  };
};