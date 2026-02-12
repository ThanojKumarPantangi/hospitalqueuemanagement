// utils/password.util.js
export const validatePassword = (password) => {
  if (typeof password !== "string") {
    return { ok: false, reason: "Password must be a string" };
  }
  const minLen = parseInt(process.env.PASSWORD_MIN_LENGTH || "12", 10);
  if (password.length < minLen) {
    return { ok: false, reason: `Password must be at least ${minLen} characters` };
  }

  const hasLower = /[a-z]/.test(password);
  const hasUpper = /[A-Z]/.test(password);
  const hasDigit = /\d/.test(password);
  const hasSymbol = /[^A-Za-z0-9]/.test(password);

  if (!hasLower || !hasUpper || !hasDigit || !hasSymbol) {
    return { ok: false, reason: "Password must include uppercase, lowercase, number, and symbol" };
  }

  return { ok: true };
};
