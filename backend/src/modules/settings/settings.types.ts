// ==========================================
// Settings Module Types
// ==========================================
//
// เก็บค่าตั้งค่าทั่วไปแบบ key-value ใน AppSetting
// ตอนนี้ใช้เก็บ "ระบบแบ่งถังเงิน" (money_buckets) เป็นหลัก
//

export interface MoneyBucket {
  key: string; // เช่น "cost_reserve"

  label: string; // เช่น "เก็บต้นทุน"

  percent: number; // 0-100
}

export interface MoneyBucketsSettings {
  buckets: MoneyBucket[];
}

export interface UpdateMoneyBucketsRequest {
  buckets: MoneyBucket[];
}

export interface CalculateMoneyBucketsRequest {
  amount: number;
}

export interface MoneyBucketCalculationResult extends MoneyBucket {
  amount: number; // จำนวนเงินจริงของถังนี้ = amount * percent / 100
}
