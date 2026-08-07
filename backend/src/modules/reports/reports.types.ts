import { ReportPeriod } from "../../common/utils/dateRange.js";

export interface ReportQuery {
  period?: ReportPeriod; // default "day"

  date?: string; // ISO date, default = วันนี้
}

export interface SummaryReport {
  period: ReportPeriod;

  from: Date;

  to: Date;

  salesCount: number;

  totalSalesAmount: number;

  totalCostOfGoodsSold: number;

  grossProfit: number;

  currentStockCount: number;

  byPaymentMethod: {
    paymentMethod: string;
    salesCount: number;
    totalAmount: number;
  }[];
}

export interface CashflowReport {
  period: ReportPeriod;

  from: Date;

  to: Date;

  cashIn: number; // เงินที่ได้จากการขาย

  cashOutLots: number; // เงินที่จ่ายซื้อล็อตในช่วงนี้

  cashOutExpenses: number; // ค่าใช้จ่ายอื่นๆในช่วงนี้

  netCashFlow: number; // cashIn - cashOutLots - cashOutExpenses
}
