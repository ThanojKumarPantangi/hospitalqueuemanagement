import crypto from "crypto";
import bcrypt from "bcryptjs";


export const generateRecoveryCodes = async (count = 5) => {
  const plainCodes = [];
  const hashedCodes = [];

  for (let i = 0; i < count; i++) {
    const code = crypto
      .randomBytes(4)
      .toString("hex")
      .toUpperCase()
      .match(/.{1,4}/g)
      .join("-");

    plainCodes.push(code);

    const hash = await bcrypt.hash(code, 10);
    hashedCodes.push(hash);
  }
  return { plainCodes, hashedCodes };
};