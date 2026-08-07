import { z } from "zod";

export const sellItemSchema = z.object({
  salePrice: z.number().nonnegative("ราคาขายต้องไม่ติดลบ"),

  paymentMethod: z.enum(["CASH", "TRANSFER", "GOVERNMENT"], {
    message: "วิธีจ่ายเงินต้องเป็น CASH, TRANSFER หรือ GOVERNMENT",
  }),

  channel: z.string().max(100).optional(),

  note: z.string().max(500).optional(),
});
