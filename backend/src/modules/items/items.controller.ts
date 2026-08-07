import { Request, Response, NextFunction } from "express";
import { itemsService } from "./items.service.js";

export class ItemsController {

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const item = await itemsService.createItem(req.body);

      return res.status(201).json({
        success: true,
        message: "เพิ่มสินค้าสำเร็จ",
        data: item,
      });
    } catch (error) {
      next(error);
    }
  }

  async bulkCreate(req: Request, res: Response, next: NextFunction) {
    try {
      const items = await itemsService.bulkCreateItems(req.body);

      return res.status(201).json({
        success: true,
        message: `เพิ่มสินค้าสำเร็จ ${items.length} ชิ้น`,
        data: items,
      });
    } catch (error) {
      next(error);
    }
  }

  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const { status, lotId } = req.query;

      const items = await itemsService.listItems({
        status: status as "IN_STOCK" | "SOLD" | undefined,
        lotId: lotId as string | undefined,
      });

      return res.status(200).json({
        success: true,
        message: "Get items success",
        data: items,
      });
    } catch (error) {
      next(error);
    }
  }

  async getOne(req: Request, res: Response, next: NextFunction) {
    try {
      const item = await itemsService.getItem((req.params.id as string));

      return res.status(200).json({
        success: true,
        message: "Get item success",
        data: item,
      });
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const item = await itemsService.updateItem((req.params.id as string), req.body);

      return res.status(200).json({
        success: true,
        message: "แก้ไขสินค้าสำเร็จ",
        data: item,
      });
    } catch (error) {
      next(error);
    }
  }

  async remove(req: Request, res: Response, next: NextFunction) {
    try {
      await itemsService.deleteItem((req.params.id as string));

      return res.status(200).json({
        success: true,
        message: "ลบสินค้าสำเร็จ",
        data: null,
      });
    } catch (error) {
      next(error);
    }
  }

}

export const itemsController = new ItemsController();
