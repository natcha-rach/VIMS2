// ==========================================
// User Module Types
// ==========================================
//
// ไฟล์นี้เก็บ Type Definition
// ที่ใช้ภายใน Users Module
//
// แยกออกจาก Prisma Model เพื่อให้:
// - Controller ไม่ผูกกับ Database โดยตรง
// - Service ควบคุม Data Flow ได้
// - เปลี่ยน Database ภายหลังง่ายขึ้น
//


// ==========================================
// User Profile Response
// ==========================================
//
// ใช้สำหรับส่งข้อมูล User กลับไปยัง Client
//
// ตัวอย่าง:
//
// GET /api/users/me
//
// Response:
//
// {
//   id: "...",
//   email: "...",
//   username: "admin"
// }
//

export interface UserProfileResponse {

  // Unique identifier ของ User
  id: string;


  // Email สำหรับ Login
  email: string;


  // Username ของระบบ
  username: string;


  // ชื่อจริง (Optional)
  firstName?: string | null;


  // นามสกุล (Optional)
  lastName?: string | null;


  // สถานะ Account
  // true = ใช้งานได้
  // false = ถูกปิด
  isActive: boolean;


  // วันที่สร้าง Account
  createdAt: Date;


  // วันที่แก้ไขล่าสุด
  updatedAt: Date;
}



// ==========================================
// Update User Request
// ==========================================
//
// ใช้ในอนาคต:
//
// PATCH /api/users/:id
//
// เช่น:
// เปลี่ยนชื่อ
// เปลี่ยนนามสกุล
//

export interface UpdateUserRequest {

  firstName?: string;

  lastName?: string;

}