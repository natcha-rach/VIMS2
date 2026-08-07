import { Request, Response, NextFunction } from "express";
import { expensesService } from "./expenses.service.js";

export class ExpensesController {

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const expense = await expensesService.createExpense(req.body);

      return res.status(201).json({
        success: true,
        message: "บันทึกค่าใช้จ่ายสำเร็จ",
        data: expense,
      });
    } catch (error) {
      next(error);
    }
  }

  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const { from, to } = req.query;

      const expenses = await expensesService.listExpenses({
        from: from as string | undefined,
        to: to as string | undefined,
      });

      return res.status(200).json({
        success: true,
        message: "Get expenses success",
        data: expenses,
      });
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const expense = await expensesService.updateExpense((req.params.id as string), req.body);

      return res.status(200).json({
        success: true,
        message: "แก้ไขค่าใช้จ่ายสำเร็จ",
        data: expense,
      });
    } catch (error) {
      next(error);
    }
  }

  async remove(req: Request, res: Response, next: NextFunction) {
    try {
      await expensesService.deleteExpense((req.params.id as string));

      return res.status(200).json({
        success: true,
        message: "ลบค่าใช้จ่ายสำเร็จ",
        data: null,
      });
    } catch (error) {
      next(error);
    }
  }

}

export const expensesController = new ExpensesController();
