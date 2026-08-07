import { z } from "zod";

export const createExpenseSchema = z.object({
  expenseDate: z.iso.datetime({ offset: true }).optional(),

  category: z
    .string()
    .min(1, "กรุณาระบุประเภทค่าใช้จ่าย")
    .max(100),

  amount: z.number().nonnegative("จำนวนเงินต้องไม่ติดลบ"),

  note: z.string().max(500).optional(),
});

export const updateExpenseSchema = createExpenseSchema.partial();
