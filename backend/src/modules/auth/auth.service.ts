import bcrypt from "bcrypt";
import { AppError } from "../../common/errors/AppError.js";
import { generateToken } from "../../common/security/jwt.js";
import { authRepository } from "./auth.repository.js";
import { LoginRequest, RegisterRequest } from "./auth.types.js";


export class AuthService {


  // ==========================================
  // Register New User
  // ==========================================
  //
  // Flow:
  //
  // Request
  //   |
  // Validate
  //   |
  // Check Duplicate
  //   |
  // Hash Password
  //   |
  // Create User
  //
  async register(data: RegisterRequest) {


    const existingEmail =
      await authRepository.findByEmail(data.email);


    if (existingEmail) {

      throw new AppError(
        "Email already exists",
        400
      );

    }



    const existingUsername =
      await authRepository.findByUsername(
        data.username
      );


    if (existingUsername) {

      throw new AppError(
        "Username already exists",
        400
      );

    }



    // Convert plain password
    // into bcrypt hash

    const passwordHash =
      await bcrypt.hash(
        data.password,
        10
      );



    const user =
      await authRepository.create({

        ...data,

        passwordHash,

      });



    return {

      id: user.id,

      email: user.email,

      username: user.username,

      role: user.role,

    };

  }




  // ==========================================
  // Login User
  // ==========================================
  //
  // Flow:
  //
  // Email
  //  |
  // Find User
  //  |
  // Compare Password
  //  |
  // Generate JWT
  //
  async login(data: LoginRequest) {


    const user =
      await authRepository.findByEmail(
        data.email
      );



    if (!user) {

      throw new AppError(
        "Invalid credentials",
        401
      );

    }



    const isPasswordValid =
      await bcrypt.compare(

        data.password,

        user.passwordHash

      );



    if (!isPasswordValid) {

      throw new AppError(
        "Invalid credentials",
        401
      );

    }




    // JWT Payload
    //
    // เก็บข้อมูลที่ Middleware ต้องใช้
    //
    // เพื่อทำ Authorization

    const accessToken =
      generateToken({

        userId: user.id,

        email: user.email,

        username: user.username,

        role: user.role,

      });





    return {

      user: {

        id: user.id,

        email: user.email,

        username: user.username,

        role: user.role,

      },


      accessToken,

    };

  }

}


export const authService = new AuthService();