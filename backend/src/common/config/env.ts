import "dotenv/config";

export const env = {
  NODE_ENV: process.env.NODE_ENV || "development",
  PORT: Number(process.env.PORT) || 3000,
  DATABASE_URL: process.env.DATABASE_URL,

  // โดเมนของ frontend ที่อนุญาตให้เรียก API ได้ (คั่นด้วย , ได้ถ้ามีหลายโดเมน)
  // dev: Live Server (VS Code extension) เปิดที่ http://127.0.0.1:5500 เป็นค่าเริ่มต้น
  // (บางเครื่อง/บาง config อาจขึ้น http://localhost:5500 แทน) ใส่ไว้ทั้งคู่กันพลาด
  // เพราะเบราว์เซอร์มองว่า localhost กับ 127.0.0.1 เป็นคนละ origin กัน แม้จะเป็นเครื่องเดียวกัน
  CORS_ORIGIN: (process.env.CORS_ORIGIN || "http://localhost:5500,http://127.0.0.1:5500").split(","),
};
