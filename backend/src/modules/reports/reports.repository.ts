import prisma from "../../common/database/prisma.js";

export class ReportsRepository {

  async getSalesInRange(start: Date, end: Date) {
    return prisma.sale.findMany({
      where: { saleDate: { gte: start, lt: end } },
    });
  }

  async getLotsCostInRange(start: Date, end: Date) {
    const result = await prisma.lot.aggregate({
      where: { purchaseDate: { gte: start, lt: end } },
      _sum: { totalCost: true },
    });

    return Number(result._sum.totalCost ?? 0);
  }

  async getExpensesInRange(start: Date, end: Date) {
    const result = await prisma.expense.aggregate({
      where: { expenseDate: { gte: start, lt: end } },
      _sum: { amount: true },
    });

    return Number(result._sum.amount ?? 0);
  }

  async getCurrentStockCount() {
    return prisma.item.count({ where: { status: "IN_STOCK" } });
  }

}

export const reportsRepository = new ReportsRepository();
