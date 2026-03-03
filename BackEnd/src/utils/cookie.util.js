const isProd = process.env.NODE_ENV === "production";

export const getCookieOptions = (maxAge) => ({
  httpOnly: true,
  secure: true,                
  sameSite: "None",       
  path: "/",
  ...(maxAge ? { maxAge } : {}),
});