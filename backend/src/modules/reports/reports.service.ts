import { AppError } from "../../common/errors/AppError.js";
import { getPeriodRange } from "../../common/utils/dateRange.js";
import { reportsRepository } from "./reports.repository.js";
import { ReportQuery, SummaryReport, CashflowReport } from "./reports.types.js";

export class ReportsService {

  private resolveRange(query: ReportQuery) {
    const period = query.period ?? "day";

    if (!["day", "month", "year"].includes(period)) {
      throw new AppError("period ต้องเป็น day, month หรือ year", 400);
    }

    try {
      const { start, end } = getPeriodRange(period, query.date);
      return { period, start, end };
    } catch {
      throw new AppError("date ไม่ถูกต้อง", 400);
    }
  }

  async getSummary(query: ReportQuery): Promise<SummaryReport> {
    const { period, start, end } = this.resolveRange(query);

    const [sales, currentStockCount] = await Promise.all([
      reportsRepository.getSalesInRange(start, end),
      reportsRepository.getCurrentStockCount(),
    ]);

    const totalSalesAmount = sales.reduce((sum: number, s: any) => sum + Number(s.salePrice), 0);
    const totalCostOfGoodsSold = sales.reduce((sum: number, s: any) => sum + Number(s.costPrice), 0);

    const byPaymentMethodMap = new Map<string, { salesCount: number; totalAmount: number }>();

    for (const sale of sales) {
      const key = sale.paymentMethod;
      const existing = byPaymentMethodMap.get(key) ?? { salesCount: 0, totalAmount: 0 };

      existing.salesCount += 1;
      existing.totalAmount += Number(sale.salePrice);

      byPaymentMethodMap.set(key, existing);
    }

    const byPaymentMethod = Array.from(byPaymentMethodMap.entries()).map(
      ([paymentMethod, v]) => ({ paymentMethod, ...v })
    );

    return {
      period,
      from: start,
      to: end,
      salesCount: sales.length,
      totalSalesAmount,
      totalCostOfGoodsSold,
      grossProfit: totalSalesAmount - totalCostOfGoodsSold,
      currentStockCount,
      byPaymentMethod,
    };
  }

  async getCashflow(query: ReportQuery): Promise<CashflowReport> {
    const { period, start, end } = this.resolveRange(query);

    const [sales, cashOutLots, cashOutExpenses] = await Promise.all([
      reportsRepository.getSalesInRange(start, end),
      reportsRepository.getLotsCostInRange(start, end),
      reportsRepository.getExpensesInRange(start, end),
    ]);

    const cashIn = sales.reduce((sum: number, s: any) => sum + Number(s.salePrice), 0);

    return {
      period,
      from: start,
      to: end,
      cashIn,
      cashOutLots,
      cashOutExpenses,
      netCashFlow: cashIn - cashOutLots - cashOutExpenses,
    };
  }

}

export const reportsService = new ReportsService();
