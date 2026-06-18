import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Email không hợp lệ'),
  password: z.string().min(6, 'Mật khẩu tối thiểu 6 ký tự'),
});

export const registerSchema = z
  .object({
    fullname: z.string().min(2, 'Họ tên tối thiểu 2 ký tự').max(80),
    email: z.string().email('Email không hợp lệ'),
    password: z
      .string()
      .min(8, 'Mật khẩu tối thiểu 8 ký tự')
      .regex(/[a-zA-Z]/, 'Cần có chữ cái')
      .regex(/[0-9]/, 'Cần có số'),
    confirmPassword: z.string(),
    acceptTerms: z.boolean(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Mật khẩu xác nhận không khớp',
    path: ['confirmPassword'],
  })
  .refine((d) => d.acceptTerms, {
    message: 'Bạn cần đồng ý điều khoản',
    path: ['acceptTerms'],
  });

export const forgotPasswordSchema = z.object({
  email: z.string().email('Email không hợp lệ'),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
