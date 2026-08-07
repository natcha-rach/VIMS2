import { z } from "zod";

export const createLotSchema = z.object({
  lotName: z
    .string()
    .min(1, "กรุณาระบุชื่อล็อต")
    .max(200),

  purchaseDate: z.iso.datetime({ offset: true }).optional(),

  source: z.string().max(200).optional(),

  totalCost: z
    .number()
    .nonnegative("ต้นทุนต้องไม่ติดลบ"),

  totalItems: z
    .number()
    .int()
    .nonnegative()
    .optional(),

  note: z.string().max(1000).optional(),

  imageUrl: z.url("รูปแบบ URL ไม่ถูกต้อง").optional(),
});

export const updateLotSchema = createLotSchema.partial();
