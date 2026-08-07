export const jwtConfig = {
  secret: process.env.JWT_SECRET || "vims-development-secret",

  expiresIn: process.env.JWT_EXPIRES_IN || "1h",
};