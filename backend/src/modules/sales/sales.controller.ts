import { Request, Response, NextFunction } from "express";
import { salesService } from "./sales.service.js";

export class SalesController {

  async sell(req: Request, res: Response, next: NextFunction) {
    try {
      const sale = await salesService.sellItem((req.params.id as string), req.body);

      return res.status(201).json({
        success: true,
        message: "บันทึกการขายสำเร็จ",
        data: sale,
      });
    } catch (error) {
      next(error);
    }
  }

  async cancelSale(req: Request, res: Response, next: NextFunction) {
    try {
      const item = await salesService.cancelSale((req.params.id as string));

      return res.status(200).json({
        success: true,
        message: "ยกเลิกการขายสำเร็จ คืนสต็อกแล้ว",
        data: item,
      });
    } catch (error) {
      next(error);
    }
  }

  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const { from, to, paymentMethod } = req.query;

      const sales = await salesService.listSales({
        from: from as string | undefined,
        to: to as string | undefined,
        paymentMethod: paymentMethod as "CASH" | "TRANSFER" | "GOVERNMENT" | undefined,
      });

      return res.status(200).json({
        success: true,
        message: "Get sales success",
        data: sales,
      });
    } catch (error) {
      next(error);
    }
  }

}

export const salesController = new SalesController();
