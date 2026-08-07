import { Request, Response, NextFunction } from "express";
import { settingsService } from "./settings.service.js";

export class SettingsController {

  async getMoneyBuckets(req: Request, res: Response, next: NextFunction) {
    try {
      const buckets = await settingsService.getMoneyBuckets();

      return res.status(200).json({
        success: true,
        message: "Get money buckets success",
        data: buckets,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateMoneyBuckets(req: Request, res: Response, next: NextFunction) {
    try {
      const buckets = await settingsService.updateMoneyBuckets(req.body);

      return res.status(200).json({
        success: true,
        message: "บันทึกสัดส่วนถังเงินสำเร็จ",
        data: buckets,
      });
    } catch (error) {
      next(error);
    }
  }

  async calculateMoneyBuckets(req: Request, res: Response, next: NextFunction) {
    try {
      const { amount } = req.body;

      const result = await settingsService.calculateMoneyBuckets(amount);

      return res.status(200).json({
        success: true,
        message: "คำนวณถังเงินสำเร็จ",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

}

export const settingsController = new SettingsController();
