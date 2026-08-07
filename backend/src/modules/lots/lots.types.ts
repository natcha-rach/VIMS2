// ==========================================
// Lots Module Types
// ==========================================
//
// Lot = 1 ครั้งที่รับของเข้าร้าน เช่น 1 กระสอบเสื้อมือสอง
//
// แยก Type ออกจาก Prisma Model เพื่อให้ Controller/Service
// ไม่ผูกกับ Database โดยตรง (แพทเทิร์นเดียวกับ users.types.ts)
//

export interface CreateLotRequest {
  lotName: string;

  purchaseDate?: string; // ISO date string, default = วันนี้

  source?: string;

  totalCost: number;

  totalItems?: number;

  note?: string;

  imageUrl?: string;
}

export interface UpdateLotRequest {
  lotName?: string;

  purchaseDate?: string;

  source?: string;

  totalCost?: number;

  totalItems?: number;

  note?: string;

  imageUrl?: string;
}

export interface LotListQuery {
  // สำหรับกรองรายการล็อตในอนาคต เช่น ช่วงวันที่
  from?: string;

  to?: string;
}
