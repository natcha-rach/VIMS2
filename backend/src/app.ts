import express from "express";
import helmet from "helmet";
import cors from "cors";
import { rateLimit } from "express-rate-limit";
import router from "./routes/index.js";
import { errorHandler } from "./common/middleware/errorHandler.js";
import { env } from "./common/config/env.js";

const app = express();

// ==========================================
// Security Middleware
// ==========================================
//
// helmet: ตั้งค่า HTTP security headers มาตรฐาน (กัน XSS/clickjacking พื้นฐาน ฯลฯ)
//
app.use(helmet());

// cors: อนุญาตเฉพาะโดเมนของ frontend ที่กำหนดไว้ใน .env เท่านั้น
// (ไม่เปิดกว้างให้ทุกโดเมนเรียก API ได้ ต่างจากตอนที่ frontend
//  คุยกับ Supabase ตรงๆ ซึ่งควบคุมผ่าน anon key + RLS แทน)
app.use(
  cors({
    origin: env.CORS_ORIGIN,
    credentials: true,
  })
);

app.use(express.json());

// ==========================================
// Rate Limiting
// ==========================================
//
// จำกัดจำนวน request โดยรวม กันการยิงถล่ม API เบื้องต้น
//
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 นาที
  limit: 300,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(globalLimiter);

// จำกัดเข้มกว่าเฉพาะ /api/auth/login กัน brute-force เดารหัสผ่าน
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "พยายาม login บ่อยเกินไป กรุณารอสักครู่แล้วลองใหม่",
  },
});

app.get("/", (_req, res) => {
  res.json({
    status: "ok",
    service: "VIMS API",
    message: "VIMS API is running"
  });
});

app.get("/health", (_req, res) => {
  res.status(200).json({
    status: "healthy"
  });
});


app.use("/api/auth/login", loginLimiter);

app.use("/api", router);

app.use(errorHandler);

export default app;
