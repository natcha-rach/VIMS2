import { Request, Response, NextFunction } from "express";
import { lotsService } from "./lots.service.js";

export class LotsController {

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const lot = await lotsService.createLot(req.body, req.user!.userId);

      return res.status(201).json({
        success: true,
        message: "สร้างล็อตสำเร็จ",
        data: lot,
      });
    } catch (error) {
      next(error);
    }
  }

  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const lots = await lotsService.listLots();

      return res.status(200).json({
        success: true,
        message: "Get lots success",
        data: lots,
      });
    } catch (error) {
      next(error);
    }
  }

  async getOne(req: Request, res: Response, next: NextFunction) {
    try {
      const lot = await lotsService.getLot((req.params.id as string));

      return res.status(200).json({
        success: true,
        message: "Get lot success",
        data: lot,
      });
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const lot = await lotsService.updateLot((req.params.id as string), req.body);

      return res.status(200).json({
        success: true,
        message: "แก้ไขล็อตสำเร็จ",
        data: lot,
      });
    } catch (error) {
      next(error);
    }
  }

  async remove(req: Request, res: Response, next: NextFunction) {
    try {
      await lotsService.deleteLot((req.params.id as string));

      return res.status(200).json({
        success: true,
        message: "ลบล็อตสำเร็จ",
        data: null,
      });
    } catch (error) {
      next(error);
    }
  }

}

export const lotsController = new LotsController();
