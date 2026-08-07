import { Request, Response, NextFunction } from "express";
import { verifyToken } from "../security/jwt.js";
import { Role } from "@prisma/client";


export function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const authHeader = req.headers.authorization;


    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }


    const token = authHeader.split(" ")[1];


    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Invalid token format",
      });
    }


    const decoded = verifyToken(token);


    if (typeof decoded === "string") {
      return res.status(401).json({
        success: false,
        message: "Invalid token",
      });
    }


    req.user = {
      userId: decoded.userId as string,
      email: decoded.email as string,
      username: decoded.username as string,
      role: decoded.role as Role,
    };


    next();

  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token",
    });
  }
}