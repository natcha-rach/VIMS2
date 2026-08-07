import jwt from "jsonwebtoken";
import { jwtConfig } from "../config/jwt.js";

export function generateToken(payload: object) {
  return jwt.sign(payload, jwtConfig.secret, {
    // jsonwebtoken's SignOptions.expiresIn คาดหวัง type แบบเจาะจง (number | StringValue)
    // แต่ค่าจาก process.env เป็น string ธรรมดา จึงต้อง cast ตรงนี้
    expiresIn: jwtConfig.expiresIn as jwt.SignOptions["expiresIn"],
  });
}

export function verifyToken(token: string) {
  return jwt.verify(token, jwtConfig.secret);
}