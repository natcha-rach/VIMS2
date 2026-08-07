import { Router } from "express";
import { salesController } from "./sales.controller.js";
import { authMiddleware } from "../../common/middleware/auth.js";

const router = Router();

router.use(authMiddleware);

// GET /api/sales?from=&to=&paymentMethod=
router.get(
  "/",
  salesController.list.bind(salesController)
);

export default router;
