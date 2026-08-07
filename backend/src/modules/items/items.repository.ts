import prisma from "../../common/database/prisma.js";
import { CreateItemRequest, UpdateItemRequest, BulkCreateItemInput, ItemListQuery } from "./items.types.js";

export class ItemsRepository {

  async create(data: CreateItemRequest) {
    return prisma.item.create({
      data: {
        lotId: data.lotId,
        itemName: data.itemName,
        size: data.size,
        condition: data.condition,
        costPrice: data.costPrice,
        sellPrice: data.sellPrice,
        imageUrl: data.imageUrl,
      },
    });
  }

  async createMany(lotId: string, items: BulkCreateItemInput[]) {
    // ใช้ transaction ทีละรายการแทน createMany ของ Prisma
    // เพราะ createMany ไม่คืนแถวที่สร้าง (ต้องใช้ id ต่อในหน้า sell)
    return prisma.$transaction(
      items.map((item) =>
        prisma.item.create({
          data: {
            lotId,
            itemName: item.itemName,
            size: item.size,
            condition: item.condition,
            costPrice: item.costPrice,
            sellPrice: item.sellPrice,
            imageUrl: item.imageUrl,
          },
        })
      )
    );
  }

  async findAll(query: ItemListQuery) {
    return prisma.item.findMany({
      where: {
        status: query.status,
        lotId: query.lotId,
      },
      include: {
        lot: {
          select: { id: true, lotName: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async findById(id: string) {
    return prisma.item.findUnique({
      where: { id },
      include: {
        lot: {
          select: { id: true, lotName: true },
        },
        sale: true,
      },
    });
  }

  async update(id: string, data: UpdateItemRequest) {
    return prisma.item.update({
      where: { id },
      // ส่ง data ทั้งก้อนตรงๆ ได้เลย เพราะ key ตรงกับชื่อ field ใน Prisma schema อยู่แล้ว
      // (lotId ถ้าไม่ได้ส่งมาจะเป็น undefined -> Prisma จะไม่แตะ field นั้น ไม่ใช่การ set เป็น null)
      data,
    });
  }

  async delete(id: string) {
    return prisma.item.delete({
      where: { id },
    });
  }

  async lotExists(lotId: string) {
    const lot = await prisma.lot.findUnique({ where: { id: lotId } });
    return lot !== null;
  }

}

export const itemsRepository = new ItemsRepository();
