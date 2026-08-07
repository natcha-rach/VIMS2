// ==========================================
// Date Range Helper
// ==========================================
//
// ใช้แปลง period (day/month/year) + วันที่อ้างอิง
// ให้เป็นช่วงเวลา [start, end) สำหรับ query รายงาน
//
// ตัวอย่าง:
//
// getPeriodRange("month", "2026-08-15")
// -> { start: 2026-08-01T00:00:00, end: 2026-09-01T00:00:00 }
//

export type ReportPeriod = "day" | "month" | "year";

export function getPeriodRange(period: ReportPeriod, referenceDate?: string) {
  const ref = referenceDate ? new Date(referenceDate) : new Date();

  if (Number.isNaN(ref.getTime())) {
    throw new Error("วันที่อ้างอิงไม่ถูกต้อง");
  }

  let start: Date;
  let end: Date;

  if (period === "day") {
    start = new Date(ref.getFullYear(), ref.getMonth(), ref.getDate());
    end = new Date(ref.getFullYear(), ref.getMonth(), ref.getDate() + 1);
  } else if (period === "month") {
    start = new Date(ref.getFullYear(), ref.getMonth(), 1);
    end = new Date(ref.getFullYear(), ref.getMonth() + 1, 1);
  } else {
    start = new Date(ref.getFullYear(), 0, 1);
    end = new Date(ref.getFullYear() + 1, 0, 1);
  }

  return { start, end };
}
