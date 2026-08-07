import { Request, Response, NextFunction } from "express";
import { reportsService } from "./reports.service.js";
import { ReportPeriod } from "../../common/utils/dateRange.js";

export class ReportsController {

  async summary(req: Request, res: Response, next: NextFunction) {
    try {
      const { period, date } = req.query;

      const report = await reportsService.getSummary({
        period: period as ReportPeriod | undefined,
        date: date as string | undefined,
      });

      return res.status(200).json({
        success: true,
        message: "Get summary report success",
        data: report,
      });
    } catch (error) {
      next(error);
    }
  }

  async cashflow(req: Request, res: Response, next: NextFunction) {
    try {
      const { period, date } = req.query;

      const report = await reportsService.getCashflow({
        period: period as ReportPeriod | undefined,
        date: date as string | undefined,
      });

      return res.status(200).json({
        success: true,
        message: "Get cashflow report success",
        data: report,
      });
    } catch (error) {
      next(error);
    }
  }

}

export const reportsController = new ReportsController();
