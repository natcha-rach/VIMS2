import prisma from "../../common/database/prisma.js";
import { CreateLotRequest, UpdateLotRequest } from "./lots.types.js";

export class LotsRepository {

  async create(data: CreateLotRequest, createdById: string) {
    return prisma.lot.create({
      data: {
        lotName: data.lotName,
        purchaseDate: data.purchaseDate ? new Date(data.purchaseDate) : undefined,
        source: data.source,
        totalCost: data.totalCost,
        totalItems: data.totalItems ?? 0,
        note: data.note,
        imageUrl: data.imageUrl,
        createdById,
      },
    });
  }

  async findAll() {
    return prisma.lot.findMany({
      orderBy: { purchaseDate: "desc" },
      include: {
        _count: {
          select: { items: true },
        },
      },
    });
  }

  async findById(id: string) {
    return prisma.lot.findUnique({
      where: { id },
      include: {
        items: true,
        _count: {
          select: { items: true },
        },
      },
    });
  }

  async update(id: string, data: UpdateLotRequest) {
    return prisma.lot.update({
      where: { id },
      data: {
        lotName: data.lotName,
        purchaseDate: data.purchaseDate ? new Date(data.purchaseDate) : undefined,
        source: data.source,
        totalCost: data.totalCost,
        totalItems: data.totalItems,
        note: data.note,
        imageUrl: data.imageUrl,
      },
    });
  }

  async delete(id: string) {
    return prisma.lot.delete({
      where: { id },
    });
  }

}

export const lotsRepository = new LotsRepository();
