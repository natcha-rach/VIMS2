import { AppError } from "../../common/errors/AppError.js";
import { expensesRepository } from "./expenses.repository.js";
import { CreateExpenseRequest, UpdateExpenseRequest, ExpenseListQuery } from "./expenses.types.js";

export class ExpensesService {

  async createExpense(data: CreateExpenseRequest) {
    return expensesRepository.create(data);
  }

  async listExpenses(query: ExpenseListQuery) {
    return expensesRepository.findAll(query);
  }

  async getExpense(id: string) {
    const expense = await expensesRepository.findById(id);

    if (!expense) {
      throw new AppError("ไม่พบรายการค่าใช้จ่ายนี้", 404);
    }

    return expense;
  }

  async updateExpense(id: string, data: UpdateExpenseRequest) {
    await this.getExpense(id);

    return expensesRepository.update(id, data);
  }

  async deleteExpense(id: string) {
    await this.getExpense(id);

    return expensesRepository.delete(id);
  }

}

export const expensesService = new ExpensesService();
