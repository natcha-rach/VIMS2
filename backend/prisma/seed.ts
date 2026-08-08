// ==========================================
// Seed: สร้างบัญชีเจ้าของร้านคนแรก
// ==========================================
//
// รันครั้งเดียวตอนตั้งระบบใหม่ (หรือรันซ้ำได้ ถ้า email ซ้ำจะข้ามให้อัตโนมัติ)
//
// วิธีใช้:
//   1. ตั้งค่า OWNER_EMAIL / OWNER_USERNAME / OWNER_PASSWORD ใน .env ก่อน (ไม่ตั้งจะใช้ค่า default ด้านล่าง)
//   2. รัน: npm run seed
//
// **สำคัญ**: หลัง seed แล้ว ให้ไปเปลี่ยนรหัสผ่านทันทีถ้าใช้ค่า default
//

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  const email = process.env.OWNER_EMAIL || "owner@shop.local";
  const username = process.env.OWNER_USERNAME || "owner";
  const password = process.env.OWNER_PASSWORD || "ChangeMe123!";
  const passwordHash = await bcrypt.hash(password, 10);

const user = await prisma.user.upsert({
  where: {
    username,
  },

  update: {
    email,
    passwordHash,
    role: "ADMIN",
  },

  create: {
    email,
    username,
    passwordHash,
    role: "ADMIN",
  },
});

  console.log("สร้างบัญชีเจ้าของร้านสำเร็จ:");
  console.log(`  email: ${user.email}`);
  console.log(`  username: ${user.username}`);
  console.log(`  password: ${password} (ถ้าเป็นค่า default ให้รีบเปลี่ยนหลัง login ครั้งแรก)`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
