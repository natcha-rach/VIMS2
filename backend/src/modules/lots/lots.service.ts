import { AppError } from "../../common/errors/AppError.js";
import { lotsRepository } from "./lots.repository.js";
import { CreateLotRequest, UpdateLotRequest } from "./lots.types.js";

export class LotsService {

  async createLot(data: CreateLotRequest, createdById: string) {
    return lotsRepository.create(data, createdById);
  }

  async listLots() {
    return lotsRepository.findAll();
  }

  async getLot(id: string) {
    const lot = await lotsRepository.findById(id);

    if (!lot) {
      throw new AppError("ไม่พบล็อตนี้", 404);
    }

    return lot;
  }

  async updateLot(id: string, data: UpdateLotRequest) {
    // ตรวจว่ามีอยู่จริงก่อน กัน error ไม่ชัดเจนจาก Prisma
    await this.getLot(id);

    return lotsRepository.update(id, data);
  }

  async deleteLot(id: string) {
    const lot = await this.getLot(id);

    // กันลบล็อตที่ยังมีสินค้าติดอยู่ (แยกออกไปเป็น item แล้ว) โดยไม่ตั้งใจ
    // เพราะจะทำให้ item ที่มีอยู่ lotId กลายเป็นค่าที่อ้างอิงไม่ได้
    if (lot.items.length > 0) {
      throw new AppError(
        "ลบล็อตนี้ไม่ได้ เพราะยังมีสินค้าที่แยกออกจากล็อตนี้อยู่ กรุณาลบ/ย้ายสินค้าก่อน",
        409
      );
    }

    return lotsRepository.delete(id);
  }

}

export const lotsService = new LotsService();
