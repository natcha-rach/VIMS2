import prisma from "../../common/database/prisma.js";

export class UsersRepository {

  async findById(id: string) {
    return prisma.user.findUnique({
      where: {
        id,
      },
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

}

export const usersRepository = new UsersRepository();