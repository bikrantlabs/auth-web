import z from "zod";

export const emailSchema = z
  .email("Must be a valid email address")
  .toLowerCase()
  .trim();

export const passwordSchema = z
  .string({ error: "Password is required" })
  .min(8, "Password must be at least 8 characters")
  .max(128, "Password must not exceed 128 characters")
  // Require at least one uppercase, one lowercase, one digit
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/\d/, "Password must contain at least one number");

export const registerSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

export const verifyEmailSchema = z.object({
  email: emailSchema,
  code: z
    .string({ error: "Code is required" })
    .regex(/^\d{6}$/, "Code must be exactly 6 digits"),
});

export const loginSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});
