import { Router } from "express";
import { authController } from "./auth.controller.js";
import { validate } from "../../common/middleware/validate.js";
import { registerSchema, loginSchema } from "./auth.validation.js";
import { authMiddleware } from "../../common/middleware/auth.js";

const router = Router();

// เดิม /register เปิดให้ใครก็สมัครได้ (endpoint สาธารณะ) — ไม่เหมาะกับร้านคนเดียว
// ตอนนี้ต้อง login ก่อนถึงจะสร้างบัญชีใหม่ได้ (เผื่ออนาคตเจ้าของร้านอยากเพิ่ม
// บัญชีพนักงาน/staff เอง) บัญชีแรกสุด (เจ้าของร้าน) สร้างผ่าน `npm run seed` แทน
router.post(
  "/register",
  authMiddleware,
  validate(registerSchema),
  authController.register.bind(authController)
);

router.post(
  "/login",
  validate(loginSchema),
  authController.login.bind(authController)
);

router.get(
  "/me",
  authMiddleware,
  authController.me.bind(authController)
);

export default router;