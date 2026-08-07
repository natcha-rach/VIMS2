import prisma from "../../common/database/prisma.js";
import { AppError } from "../../common/errors/AppError.js";
import { SellItemRequest, SalesListQuery } from "./sales.types.js";

export class SalesRepository {

  // ==========================================
  // Sell
  // ==========================================
  //
  // ทำเป็น transaction เดียว: เช็คสถานะ + สร้าง Sale + เปลี่ยนสถานะ Item
  // เพื่อกันกรณีกดขายซ้อนกัน 2 ครั้งพร้อมกัน (race condition)
  // เช่น มือถือค้างแล้วกดปุ่มขายซ้ำ
  //

  async sellItem(itemId: string, data: SellItemRequest) {
    return prisma.$transaction(async (tx: any) => {
      const item = await tx.item.findUnique({ where: { id: itemId } });

      if (!item) {
        throw new AppError("ไม่พบสินค้านี้", 404);
      }

      if (item.status !== "IN_STOCK") {
        throw new AppError("สินค้านี้ถูกขายไปแล้ว หรือไม่อยู่ในสต็อก", 409);
      }

      const sale = await tx.sale.create({
        data: {
          itemId: item.id,
          salePrice: data.salePrice,
          costPrice: item.costPrice, // copy ต้นทุน ณ ตอนขาย
          paymentMethod: data.paymentMethod,
          channel: data.channel,
          note: data.note,
        },
      });

      await tx.item.update({
        where: { id: item.id },
        data: { status: "SOLD" },
      });

      return sale;
    });
  }

  // ==========================================
  // Cancel Sale
  // ==========================================
  //
  // กรณีบันทึกขายผิด: ลบ Sale ทิ้ง + คืนสถานะ Item เป็น IN_STOCK
  //

  async cancelSale(itemId: string) {
    return prisma.$transaction(async (tx: any) => {
      const item = await tx.item.findUnique({
        where: { id: itemId },
        include: { sale: true },
      });

      if (!item) {
        throw new AppError("ไม่พบสินค้านี้", 404);
      }

      if (item.status !== "SOLD" || !item.sale) {
        throw new AppError("สินค้านี้ยังไม่ถูกขาย ยกเลิกไม่ได้", 409);
      }

      await tx.sale.delete({ where: { id: item.sale.id } });

      await tx.item.update({
        where: { id: item.id },
        data: { status: "IN_STOCK" },
      });

      return item;
    });
  }

  async findAll(query: SalesListQuery) {
    return prisma.sale.findMany({
      where: {
        paymentMethod: query.paymentMethod,
        saleDate: {
          gte: query.from ? new Date(query.from) : undefined,
          lte: query.to ? new Date(query.to) : undefined,
        },
      },
      include: {
        item: {
          select: { id: true, itemName: true, size: true, lotId: true },
        },
      },
      orderBy: { saleDate: "desc" },
    });
  }

}

export const salesRepository = new SalesRepository();
