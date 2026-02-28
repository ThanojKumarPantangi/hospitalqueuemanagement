const isProd = process.env.NODE_ENV === "production";

export const getCookieOptions = (maxAge) => ({
  httpOnly: true,
  secure: isProd,
  sameSite: "strict",
  path: "/",
  ...(isProd && { domain: process.env.FRONTEND_URL}),
  ...(maxAge ? { maxAge } : {}),
});