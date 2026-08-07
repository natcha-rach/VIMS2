import "dotenv/config";

export const env = {
  NODE_ENV: process.env.NODE_ENV || "development",
  PORT: Number(process.env.PORT) || 3000,
  DATABASE_URL: process.env.DATABASE_URL,

  // โดเมนของ frontend ที่อนุญาตให้เรียก API ได้ (คั่นด้วย , ได้ถ้ามีหลายโดเมน)
  // dev: หน้าเว็บเปิดจาก Live Server / file ตรงๆ มักเป็น http://127.0.0.1:5500 หรือ http://localhost:5500
  CORS_ORIGIN: (process.env.CORS_ORIGIN || "http://localhost:5500").split(","),
};
