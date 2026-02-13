const isProd = process.env.NODE_ENV === "production";

export const getCookieOptions = (maxAge) => ({
  httpOnly: true,
  secure: isProd,
  sameSite: isProd ? "None" : "Lax",
  path: "/",
  ...(maxAge ? { maxAge } : {}),
});