import { Role } from "@prisma/client";


declare global {

  namespace Express {


    interface Request {


      // ข้อมูล User ที่ผ่าน JWT Authentication

      user?: {

        // User ID จาก JWT

        userId: string;


        // Email User

        email: string;


        // Username

        username: string;


        // Role สำหรับ Authorization

        role: Role;

      };


    }


  }

}


export {};