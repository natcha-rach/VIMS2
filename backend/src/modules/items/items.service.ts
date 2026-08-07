import { AppError } from "../../common/errors/AppError.js";
import { itemsRepository } from "./items.repository.js";
import {
  CreateItemRequest,
  UpdateItemRequest,
  BulkCreateItemsRequest,
  ItemListQuery,
} from "./items.types.js";

export class ItemsService {

  private async assertLotExists(lotId: string) {
    const exists = await itemsRepository.lotExists(lotId);

    if (!exists) {
      throw new AppError("ไม่พบล็อตที่ระบุ", 404);
    }
  }

  async createItem(data: CreateItemRequest) {
    await this.assertLotExists(data.lotId);

    return itemsRepository.create(data);
  }

  async bulkCreateItems(data: BulkCreateItemsRequest) {
    await this.assertLotExists(data.lotId);

    return itemsRepository.createMany(data.lotId, data.items);
  }

  async listItems(query: ItemListQuery) {
    return itemsRepository.findAll(query);
  }

  async getItem(id: string) {
    const item = await itemsRepository.findById(id);

    if (!item) {
      throw new AppError("ไม่พบสินค้านี้", 404);
    }

    return item;
  }

  async updateItem(id: string, data: UpdateItemRequest) {
    const item = await this.getItem(id);

    // กันแก้ต้นทุน/ราคาของเสื้อที่ขายไปแล้ว เพื่อไม่ให้ตัวเลขบัญชีย้อนหลังผิดเพี้ยน
    if (item.status === "SOLD") {
      throw new AppError(
        "สินค้านี้ขายไปแล้ว แก้ไขข้อมูลไม่ได้ (ถ้าบันทึกผิด ให้ยกเลิกการขายก่อน)",
        409
      );
    }

    // ถ้าจะย้ายไปล็อตอื่น ต้องเช็คก่อนว่าล็อตปลายทางมีอยู่จริง
    // (เหมือน assertLotExists ตอน create แต่แยกเรียกตรงนี้ เพราะ update ไม่บังคับต้องมี lotId)
    if (data.lotId) {
      await this.assertLotExists(data.lotId);
    }

    return itemsRepository.update(id, data);
  }

  async deleteItem(id: string) {
    const item = await this.getItem(id);

    if (item.status === "SOLD") {
      throw new AppError(
        "ลบไม่ได้ เพราะสินค้านี้ขายไปแล้ว กรุณายกเลิกการขายก่อน",
        409
      );
    }

    return itemsRepository.delete(id);
  }

}

export const itemsService = new ItemsService();
