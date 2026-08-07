import { Request, Response, NextFunction } from "express";
import { authService } from "./auth.service.js";

export class AuthController {
  async register(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const user = await authService.register(req.body);

      return res.status(201).json({
        success: true,
        message: "Register success",
        data: user,
      });
    } catch (error) {
      next(error);
    }
  }


  async login(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const result = await authService.login(req.body);

      return res.status(200).json({
        success: true,
        message: "Login success",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async me(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    return res.status(200).json({
      success: true,
      message: "Get profile success",
      data: req.user,
    });

  } catch (error) {
    next(error);
  }
}
}

export const authController = new AuthController();