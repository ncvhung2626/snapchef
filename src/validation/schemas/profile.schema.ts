import { z } from 'zod';

export const editProfileSchema = z.object({
  fullname: z.string().min(2, 'Họ tên tối thiểu 2 ký tự').max(80),
  bio: z.string().max(300, 'Bio tối đa 300 ký tự'),
});

export type EditProfileInput = z.infer<typeof editProfileSchema>;
