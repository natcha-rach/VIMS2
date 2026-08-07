# ==========================================================
# Dockerfile — Production image สำหรับ VIMS Shop Backend
# ==========================================================
#
# ใช้ multi-stage build:
#   Stage 1 "builder"  -> ลง dependency ทั้งหมด (รวม dev) + compile TypeScript -> dist/
#   Stage 2 "runtime"   -> ลงเฉพาะ production dependency + คัดลอกเฉพาะ dist/ ที่ compile แล้วมาใช้งาน
#
# ทำแบบนี้เพื่อให้ image สุดท้ายมีขนาดเล็ก และรันด้วย `node dist/server.js` จริง
# (ไม่ใช่ `npm run dev` ที่เป็นโหมด watch สำหรับพัฒนาเท่านั้น อย่างที่ Dockerfile เดิมทำ)


# ---------- Stage 1: Builder ----------
FROM node:22-alpine AS builder

# ตั้ง working directory ในตัว container
WORKDIR /app

# คัดลอกไฟล์ที่บอก dependency ก่อนไฟล์อื่น
# เพื่อให้ Docker cache ชั้นนี้ไว้ได้ (ถ้า package.json ไม่เปลี่ยน ไม่ต้อง npm install ใหม่ทุกครั้ง)
COPY package.json package-lock.json ./

# ลง dependency ทั้งหมด รวม devDependencies (ต้องใช้ tsc, prisma ตอน build)
RUN npm install

# คัดลอกโค้ดที่เหลือทั้งหมดเข้ามา
COPY . .

# generate Prisma Client ให้ตรงกับ schema.prisma ปัจจุบัน
# (ต้องรันก่อน build เพราะโค้ด TypeScript อ้างอิง type จาก client ที่ generate แล้ว)
RUN npx prisma generate

# compile TypeScript (src/) -> JavaScript (dist/) ตาม tsconfig.json
RUN npm run build


# ---------- Stage 2: Runtime ----------
FROM node:22-alpine AS runtime

WORKDIR /app

ENV NODE_ENV=production

# คัดลอกเฉพาะไฟล์ dependency มาก่อน แล้วลงเฉพาะ production dependency
# (ไม่เอา devDependencies อย่าง tsx/vitest มาด้วย ทำให้ image เล็กลง)
COPY package.json package-lock.json ./
RUN npm install --omit=dev

# ต้อง generate Prisma Client อีกครั้งใน stage นี้ด้วย
# เพราะ node_modules ชุดนี้เป็นคนละชุดกับใน builder (ลงใหม่แบบ production only)
COPY prisma ./prisma
RUN npx prisma generate

# คัดลอกเฉพาะผลลัพธ์ที่ compile แล้วจาก stage builder เข้ามา
COPY --from=builder /app/dist ./dist

# เปิด port ที่แอปฟัง (ต้องตรงกับ PORT ใน .env / docker-compose)
EXPOSE 3000

# รันแอปจริงด้วย node ตรงๆ (ไม่ใช่ npm run dev / tsx watch)
CMD ["node", "dist/server.js"]
