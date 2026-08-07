import prisma from "../../common/database/prisma.js";
import { Role } from "@prisma/client";
import { RegisterRequest } from "./auth.types.js";

export class AuthRepository {


  // ==========================================
  // Find User By Email
  // ==========================================
  //
  // ใช้ตรวจสอบว่า Email ถูกใช้แล้วหรือยัง
  //
  async findByEmail(email: string) {

    return prisma.user.findUnique({

      where: {
        email,
      },

    });

  }



  // ==========================================
  // Find User By Username
  // ==========================================
  //
  // ใช้ตรวจสอบ Username ซ้ำ
  //
  async findByUsername(username: string) {

    return prisma.user.findUnique({

      where: {
        username,
      },

    });

  }




  // ==========================================
  // Create User
  // ==========================================
  //
  // สร้าง User ใหม่ใน Database
  //
  // Security Rule:
  //
  // User ที่สมัครผ่าน Public Register
  // จะได้รับ Role = STAFF เท่านั้น
  //
  // ห้ามรับ Role จาก Client
  //
  async create(
    data: RegisterRequest & {
      passwordHash: string;
    }
  ) {


    return prisma.user.create({

      data: {

        email: data.email,

        username: data.username,


        // Password ที่ผ่าน bcrypt แล้ว

        passwordHash: data.passwordHash,


        firstName: data.firstName,

        lastName: data.lastName,


        // Default Permission
        //
        // User ใหม่เริ่มต้นเป็น STAFF

        role: Role.STAFF,

      },

    });

  }

}


export const authRepository = new AuthRepository();