import { z } from "zod";

export const registerSchema = z.object({
  email: z.email("Email format is invalid"),

  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(50),

  password: z
    .string()
    .min(8, "Password must be at least 8 characters"),

  firstName: z.string().optional(),

  lastName: z.string().optional(),
});

export const loginSchema = z.object({
  email: z.email("Email format is invalid"),

  password: z.string().min(1, "Password is required"),
});