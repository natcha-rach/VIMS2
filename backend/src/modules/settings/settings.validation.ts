import { z } from "zod";

const moneyBucketSchema = z.object({
  key: z.string().min(1).max(50),

  label: z.string().min(1).max(100),

  percent: z.number().min(0).max(100),
});

export const updateMoneyBucketsSchema = z
  .object({
    buckets: z
      .array(moneyBucketSchema)
      .min(1, "ต้องมีอย่างน้อย 1 ถัง"),
  })
  .refine(
    (data) => {
      const total = data.buckets.reduce((sum, b) => sum + b.percent, 0);
      // กันปัญหาทศนิยม float บวกกันแล้วไม่ลงตัวพอดี 100.000000001
      return Math.abs(total - 100) < 0.01;
    },
    {
      message: "เปอร์เซ็นต์ของทุกถังรวมกันต้องเท่ากับ 100",
      path: ["buckets"],
    }
  );

export const calculateMoneyBucketsSchema = z.object({
  amount: z.number().nonnegative("จำนวนเงินต้องไม่ติดลบ"),
});
