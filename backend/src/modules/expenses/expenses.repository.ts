import prisma from "../../common/database/prisma.js";
import { CreateExpenseRequest, UpdateExpenseRequest, ExpenseListQuery } from "./expenses.types.js";

export class ExpensesRepository {

  async create(data: CreateExpenseRequest) {
    return prisma.expense.create({
      data: {
        expenseDate: data.expenseDate ? new Date(data.expenseDate) : undefined,
        category: data.category,
        amount: data.amount,
        note: data.note,
      },
    });
  }

  async findAll(query: ExpenseListQuery) {
    return prisma.expense.findMany({
      where: {
        expenseDate: {
          gte: query.from ? new Date(query.from) : undefined,
          lte: query.to ? new Date(query.to) : undefined,
        },
      },
      orderBy: { expenseDate: "desc" },
    });
  }

  async findById(id: string) {
    return prisma.expense.findUnique({ where: { id } });
  }

  async update(id: string, data: UpdateExpenseRequest) {
    return prisma.expense.update({
      where: { id },
      data: {
        expenseDate: data.expenseDate ? new Date(data.expenseDate) : undefined,
        category: data.category,
        amount: data.amount,
        note: data.note,
      },
    });
  }

  async delete(id: string) {
    return prisma.expense.delete({ where: { id } });
  }

}

export const expensesRepository = new ExpensesRepository();
