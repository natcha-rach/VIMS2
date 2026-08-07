import { z } from "zod";

export const createItemSchema = z.object({
  lotId: z.uuid("lotId ไม่ถูกต้อง"),

  itemName: z
    .string()
    .min(1, "กรุณาระบุชื่อสินค้า")
    .max(200),

  size: z.string().max(20).optional(),

  condition: z.string().max(100).optional(),

  costPrice: z.number().nonnegative("ต้นทุนต้องไม่ติดลบ"),

  sellPrice: z.number().nonnegative("ราคาขายต้องไม่ติดลบ"),

  imageUrl: z.url("รูปแบบ URL ไม่ถูกต้อง").optional(),
});

// update: เหมือน create ทุกอย่างแต่เป็น optional หมด (แก้ทีละ field ได้)
// รวม lotId ไว้ด้วย เพื่อให้ "ย้ายสินค้าไปล็อตอื่น" ได้เหมือนระบบเดิม (shirt-shop-backend)
export const updateItemSchema = createItemSchema.partial();

const bulkItemInputSchema = createItemSchema.omit({ lotId: true });

export const bulkCreateItemsSchema = z.object({
  lotId: z.uuid("lotId ไม่ถูกต้อง"),

  items: z
    .array(bulkItemInputSchema)
    .min(1, "ต้องมีสินค้าอย่างน้อย 1 ชิ้น")
    .max(100, "เพิ่มได้ครั้งละไม่เกิน 100 ชิ้น"),
});
