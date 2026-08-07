import { Role } from "@prisma/client";


// ==========================================
// Register Request
// ==========================================
//
// Data ที่ Client ส่งมาเพื่อสร้าง Account
//
// หมายเหตุ:
// - ห้ามรับ role จาก Client
// - Backend จะกำหนด Default Role = STAFF
//

export interface RegisterRequest {

  // User email สำหรับ Login
  email: string;


  // Username สำหรับระบุตัวตน
  username: string;


  // Password ก่อนทำ bcrypt hash
  password: string;


  // ข้อมูล Profile

  firstName?: string;

  lastName?: string;
}



// ==========================================
// Login Request
// ==========================================
//
// ใช้สำหรับ Authentication
//

export interface LoginRequest {

  email: string;

  password: string;

}



// ==========================================
// Auth User Response
// ==========================================
//
// ข้อมูล User ที่ส่งกลับ Frontend
//

export interface AuthResponse {

  id: string;

  email: string;

  username: string;


  // Role สำหรับ Authorization

  role: Role;
}