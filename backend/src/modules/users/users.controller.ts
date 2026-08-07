import { Request, Response, NextFunction } from "express";
import { usersService } from "./users.service.js";

export class UsersController {

  async me(
    req: Request,
    res: Response,
    next: NextFunction
  ) {

    try {

      const user = await usersService.getProfile(
        req.user!.userId
      );

      return res.status(200).json({
        success: true,
        message: "Get profile success",
        data: user,
      });

    } catch (error) {
      next(error);
    }

  }

}

export const usersController = new UsersController();