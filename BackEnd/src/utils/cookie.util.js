const isProd = process.env.NODE_ENV === "production";
console.log("NODE_ENV:", process.env.NODE_ENV);
export const getCookieOptions = (maxAge) => ({
  httpOnly: true,
  secure: isProd,
  sameSite: isProd ? "None" : "Lax",
  path: "/",
  ...(maxAge ? { maxAge } : {}),
});