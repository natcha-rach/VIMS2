// ==========================================
// Import Express Router
// ==========================================
//
// Router คือ Object ของ Express
// ใช้สำหรับรวมกลุ่ม API Route
//
// เช่น:
// /api/auth/*
// /api/users/*
//
// แล้วนำไปเชื่อมกับ app.ts

import { Router } from "express";


// ==========================================
// Import Module Routes
// ==========================================
//
// แต่ละ Module จะดูแล Route ของตัวเอง
//
// Auth Module:
// - register
// - login
//
// Users Module:
// - profile
// - user management
//

import authRoutes from "../modules/auth/auth.routes.js";
import usersRoutes from "../modules/users/users.routes.js";
import lotsRoutes from "../modules/lots/lots.routes.js";
import itemsRoutes from "../modules/items/items.routes.js";
import salesRoutes from "../modules/sales/sales.routes.js";
import expensesRoutes from "../modules/expenses/expenses.routes.js";
import reportsRoutes from "../modules/reports/reports.routes.js";
import settingsRoutes from "../modules/settings/settings.routes.js";



// ==========================================
// Create Main Router
// ==========================================
//
// สร้าง Router หลักของระบบ
//
// Request Flow:
//
// Client
//   |
//   ↓
// Express App (app.ts)
//   |
//   ↓
// Main Router (ไฟล์นี้)
//   |
//   ├── Auth Router
//   |
//   └── Users Router
//

const router = Router();



// ==========================================
// Register Auth Module
// ==========================================
//
// ทุก API ที่อยู่ใน authRoutes
// จะถูกเติม Prefix:
//
// /api/auth
//
// ตัวอย่าง:
//
// POST /api/auth/register
// POST /api/auth/login
//

router.use("/auth", authRoutes);



// ==========================================
// Register Users Module
// ==========================================
//
// ทุก API ที่อยู่ใน usersRoutes
// จะถูกเติม Prefix:
//
// /api/users
//
// ตัวอย่าง:
//
// GET /api/users/me
//
// Flow:
//
// Request
//   |
//   ↓
// authMiddleware
//   |
//   ↓
// usersController
//   |
//   ↓
// usersService
//   |
//   ↓
// usersRepository
//   |
//   ↓
// Database
//

router.use("/users", usersRoutes);



// ==========================================
// Register Lots Module
// ==========================================
//
// ทุก API ที่อยู่ใน lotsRoutes
// จะถูกเติม Prefix:
//
// /api/lots
//
// ตัวอย่าง:
//
// POST /api/lots       -> รับของเข้าใหม่ 1 ล็อต
// GET  /api/lots        -> ดูล็อตทั้งหมด
// GET  /api/lots/:id     -> ดูล็อตเดียว พร้อมสินค้าในล็อต
// PATCH /api/lots/:id    -> แก้ไขล็อต
// DELETE /api/lots/:id   -> ลบล็อต (ลบไม่ได้ถ้ายังมีสินค้าอยู่)
//

router.use("/lots", lotsRoutes);



// ==========================================
// Register Items Module
// ==========================================
//
// ทุก API ที่อยู่ใน itemsRoutes
// จะถูกเติม Prefix:
//
// /api/items
//
// ตัวอย่าง:
//
// POST /api/items        -> แยกสินค้า 1 ชิ้นจากล็อต
// POST /api/items/bulk    -> แยกสินค้าหลายชิ้นพร้อมกัน (ทีละ 2-3 ตัวจากกระสอบ)
// GET  /api/items?status=IN_STOCK  -> ดูสินค้า กรองตามสถานะ/ล็อตได้
// GET  /api/items/:id     -> ดูสินค้าเดียว
// PATCH /api/items/:id    -> แก้ไขสินค้า (แก้ไม่ได้ถ้าขายไปแล้ว)
// DELETE /api/items/:id   -> ลบสินค้า (ลบไม่ได้ถ้าขายไปแล้ว)
//

router.use("/items", itemsRoutes);



// ==========================================
// Register Sales Module
// ==========================================
//
// /api/sales
//
// GET /api/sales?from=&to=&paymentMethod=  -> ดูรายการขาย
//
// หมายเหตุ: การ "ขาย" และ "ยกเลิกการขาย" จริงๆ อยู่ที่
// POST /api/items/:id/sell และ POST /api/items/:id/cancel-sale
// (อยู่ใน itemsRoutes เพราะเป็นการเปลี่ยนสถานะของ Item)
//

router.use("/sales", salesRoutes);



// ==========================================
// Register Expenses Module
// ==========================================
//
// /api/expenses
//
// ค่าใช้จ่ายอื่นๆ นอกเหนือจากต้นทุนเสื้อ เช่น ค่าเช่าแผง ค่าเดินทาง
//

router.use("/expenses", expensesRoutes);



// ==========================================
// Register Reports Module
// ==========================================
//
// /api/reports
//
// GET /api/reports/summary?period=day|month|year   -> ยอดขาย/กำไร/สต็อกคงเหลือ
// GET /api/reports/cashflow?period=day|month|year   -> กระแสเงินสด
//

router.use("/reports", reportsRoutes);



// ==========================================
// Register Settings Module
// ==========================================
//
// /api/settings
//
// GET  /api/settings/money-buckets              -> อ่านสัดส่วนถังเงิน
// PUT  /api/settings/money-buckets              -> ตั้งสัดส่วนถังเงินใหม่ (รวมต้อง = 100%)
// POST /api/settings/money-buckets/calculate    -> คำนวณจำนวนเงินแต่ละถังจากยอดที่ระบุ
//

router.use("/settings", settingsRoutes);



// ==========================================
// Export Router
// ==========================================
//
// ส่ง Router นี้กลับไปให้ app.ts ใช้งาน
//

export default router;