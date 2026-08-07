import { Router } from "express";
import { usersController } from "./users.controller.js";
import { authMiddleware } from "../../common/middleware/auth.js";

const router = Router();

router.get(
  "/me",
  authMiddleware,
  usersController.me.bind(usersController)
);

export default router;