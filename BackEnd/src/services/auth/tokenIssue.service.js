import { generateAccessToken,generateRefreshToken } from "../../utils/jwt.util.js";
import RefreshToken from "../../models/refreshToken.model.js";
import { v4 as uuidv4 } from "uuid";
import crypto from "crypto";

export const issueTokens = async (user, session) => {
  const refreshJti = uuidv4();

  const accessPayload = {
    id: user._id,
    role: user.role,
    name: user.name,
    sessionId: session._id,
  };

  const refreshPayload = {
    id: user._id,
    role: user.role,
    sessionId: session._id,
    jti: refreshJti,
  };

  const accessToken = generateAccessToken(accessPayload);
  const refreshToken = generateRefreshToken(refreshPayload);

  const tokenHash = crypto
    .createHash("sha256")
    .update(refreshToken)
    .digest("hex");

  await RefreshToken.create({
    user: user._id,
    session: session._id,
    jti: refreshJti,
    tokenHash,
    revoked: false,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  });

  return { accessToken, refreshToken };
};