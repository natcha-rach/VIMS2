import { Router } from "express";
import { reportsController } from "./reports.controller.js";
import { authMiddleware } from "../../common/middleware/auth.js";

const router = Router();

router.use(authMiddleware);

// GET /api/reports/summary?period=day|month|year&date=2026-08-15
router.get(
  "/summary",
  reportsController.summary.bind(reportsController)
);

// GET /api/reports/cashflow?period=day|month|year&date=2026-08-15
router.get(
  "/cashflow",
  reportsController.cashflow.bind(reportsController)
);

export default router;
