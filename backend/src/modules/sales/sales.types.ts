// ==========================================
// Sales Module Types
// ==========================================
//
// Sale เกิดขึ้นจากการ "ขาย" Item ที่ยัง IN_STOCK อยู่
// การขาย/ยกเลิกขาย ผูกกับ Item เสมอ (1 Item ขายได้ 1 ครั้งต่อรอบ)
//

export type PaymentMethod = "CASH" | "TRANSFER" | "GOVERNMENT";

export interface SellItemRequest {
  salePrice: number;

  paymentMethod: PaymentMethod;

  channel?: string; // ดีฟอลต์ "ถนนคนเดิน"

  note?: string;
}

export interface SalesListQuery {
  from?: string;

  to?: string;

  paymentMethod?: PaymentMethod;
}
